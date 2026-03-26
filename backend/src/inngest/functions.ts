import { inngest } from "./client";
import Sandbox from "@e2b/code-interpreter";
import { z } from "zod";
import {
  createAgent,
  openai,
  anthropic,
  gemini,
  createTool,
  createNetwork,
  type Tool,
  type Message,
  createState,
} from "@inngest/agent-kit";
import {
  getSandbox,
  lastAssistantTextMessageContent,
  parseAgentOutput,
} from "../lib/utils";

import {
  FRAGMENT_TITLE_PROMPT,
  PROMPT,
  PROMPT2,
  PROMPT3,
  RESPONSE_PROMPT,
} from "../prompt";
import { SANDBOX_TIMEOUT } from "../../types";
import { prisma } from "../lib/prisma";

interface AgentState {
  summary: string;
  files: { [path: string]: string };
}

export const codeAgentFunction = inngest.createFunction(
  { id: "codeAgentFunction" },
  { event: "codeAgentFunction/run" },
  async ({ event, step }) => {
    const sandboxId = await step.run("get-sandbox-id", async () => {
      const sandbox = await Sandbox.create("nextjs-imsidkg");

      await sandbox.setTimeout(SANDBOX_TIMEOUT);

      return sandbox.sandboxId;
    });

    const previousMessages = await step.run(
      "get-previous-messages",
      async () => {
        const formattedMessages: Message[] = [];

        const messages = await prisma.message.findMany({
          where: {
            projectId: event.data.projectId,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        for (const message of messages) {
          // Avoid poisoning the agent with prior malformed tool-call scaffolding
          // (eg `print(default_api....)`), which tends to cause repeated failures.
          if (
            typeof message.content === "string" &&
            (message.content.includes("default_api") ||
              message.content.includes("```tool_code") ||
              message.content.includes("```tool_outputs"))
          ) {
            continue;
          }
          formattedMessages.push({
            type: "text",
            role: message.role === "ASSISTANCE" ? "assistant" : "user",
            content: message.content,
          });
        }

        return formattedMessages;
      },
    );

    const state = createState<AgentState>(
      {
        summary: "",
        files: {},
      },
      {
        messages: previousMessages,
      },
    );

    const terminalTool = createTool({
      name: "terminal",
      description: "Use the terminal to run commands",
      parameters: z.object({
        command: z.string().describe("The shell command to execute"),
      }),
      handler: async ({ command }, { step }) => {
        return await step?.run("terminal", async () => {
          const buffers = { stdout: "", stderr: "" };
          const trimmedCommand = command.trim();
          // Sandbox hardening:
          // - Do NOT run `bun add ...` (bun is unreliable/missing in the sandbox)
          // - Block animation deps explicitly to avoid repeated install failures
          let commandToRun = command;
          const blockedPackages = ["tailwindcss-animate"];
          const isBlockedInstall = (pkgListRaw: string) => {
            const tokens = pkgListRaw
              .split(/\s+/)
              .map((t) => t.trim())
              .filter(Boolean)
              .filter((t) => !t.startsWith("-"));
            return tokens.some((t) => blockedPackages.includes(t));
          };
          const bunAddMatch = trimmedCommand.match(/^bun\s+add\s+(.+)$/);
          if (bunAddMatch) {
            const pkgs = bunAddMatch[1].trim();
            if (isBlockedInstall(pkgs)) {
              return `Blocked dependency install in sandbox: ${trimmedCommand}`;
            }
            commandToRun = `npm install ${pkgs}`;
          }
          const npmInstallMatch = trimmedCommand.match(/^npm\s+install\s+(.+)$/);
          if (npmInstallMatch) {
            const pkgs = npmInstallMatch[1].trim();
            if (isBlockedInstall(pkgs)) {
              return `Blocked dependency install in sandbox: ${trimmedCommand}`;
            }
          }
          try {
            const sandbox = await getSandbox(sandboxId);
            const result = await sandbox.commands.run(commandToRun, {
              onStdout: (data: string) => {
                buffers.stdout += data;
              },
              onStderr: (data: string) => {
                buffers.stderr += data;
              },
            });

            return result.stdout;
          } catch (err) {
            console.error(
              `terminal command failed: ${String(err)}\nstdout: ${buffers.stdout}\nstderr: ${buffers.stderr}`,
            );
            return `command failed : ${String(err)} \nstdout: ${buffers.stdout}\nstderr: ${buffers.stderr}`;
          }
        });
      },
    });

    const createOrUpdateFiles = createTool({
      name: "create_or_update_files",
      description: "create or Update files in the sandbox",
      parameters: z.object({
        files: z
          .array(
            z.object({
              path: z
                .string()
                .describe("The absolute or relative path to the file"),
              content: z.string().describe("The content to write to the file"),
            }),
          )
          .describe("A list of files to create or update"),
      }),
      handler: async (
        { files },
        { step, network }: Tool.Options<AgentState>,
      ) => {
        const newFiles = await step?.run("create_or_update_files", async () => {
          try {
            const updatedFiles = network.state.data.files || {};

            const sandbox = await getSandbox(sandboxId);
            for (const file of files) {
              await sandbox.files.write(file.path, file.content);
              updatedFiles[file.path] = file.content;
            }

            return updatedFiles;
          } catch (err) {
            console.error("command failed : ${err}");

            return "command failed : ${err}";
          }
        });

        if (typeof newFiles === "object") {
          network.state.data.files = newFiles;
        }
      },
    });

    const readFiles = createTool({
      name: "read_files",
      description: "read_files from sandbox",
      parameters: z.object({
        files: z
          .array(z.string().describe("The path of the file to read"))
          .describe("A list of file paths to read"),
      }),

      handler: async ({ files }, { step }) => {
        return await step?.run("read_files", async () => {
          try {
            const sandbox = await getSandbox(sandboxId);
            const contents = [];

            for (const file of files) {
              const content = await sandbox.files.read(file);
              contents.push({ path: file, content });
            }

            return JSON.stringify(contents);
          } catch (err) {
            console.error("command failed : ${err}");
            return "command failed : ${err}";
          }
        });
      },
    });

    const openAiCodeAgent = createAgent<AgentState>({
      name: "openAiCodeAgent",
      description: "An expert Coding Agent",
      system: PROMPT3,
      model: openai({
        model: "gpt-4o",
      }),
      tools: [terminalTool, createOrUpdateFiles, readFiles],
      lifecycle: {
        onResponse: async ({ result, network }) => {
          const lastAssistantMessageText =
            lastAssistantTextMessageContent(result);
          if (lastAssistantMessageText && network) {
            if (lastAssistantMessageText?.includes("<task_summary>")) {
              network.state.data.summary = lastAssistantMessageText;
            }
          }

          return result;
        },
      },
    });

    const codeAgent = createAgent<AgentState>({
      name: "codeAgent",
      description: "An expert Coding Agent",
      system: PROMPT3,
      model: gemini({
        // NOTE: `gemini-2.0-flash` has been observed producing malformed tool calls
        // with this agent-kit version. Use a stable tool-calling model instead.
        model: "gemini-1.5-pro",
        apiKey: process.env.GEMINI_API_KEY!,
      }),

      tools: [terminalTool, createOrUpdateFiles, readFiles],
      lifecycle: {
        onResponse: async ({ result, network }) => {
          const lastAssistantMessageText =
            lastAssistantTextMessageContent(result);
          if (lastAssistantMessageText && network) {
            if (lastAssistantMessageText?.includes("<task_summary>")) {
              network.state.data.summary = lastAssistantMessageText;
            }
          }

          return result;
        },
      },
    });

    const anthropicCodeAgent = createAgent<AgentState>({
      name: "anthropicCodeAgent",
      description: "An expert Coding Agent",
      system: PROMPT2,
      model: anthropic({
        model: "claude-3-5-haiku-latest",
        defaultParameters: { temperature: 0.5, max_tokens: 4096 },
      }),
      tools: [terminalTool, createOrUpdateFiles, readFiles],
      lifecycle: {
        onResponse: async ({ result, network }) => {
          const lastAssistantMessageText =
            lastAssistantTextMessageContent(result);
          if (lastAssistantMessageText && network) {
            if (lastAssistantMessageText?.includes("<task_summary>")) {
              network.state.data.summary = lastAssistantMessageText;
            }
          }

          return result;
        },
      },
    });

    const network = createNetwork<AgentState>({
      name: "coding-agent-network",
      agents: [codeAgent],
      maxIter: 15,
      defaultState: state,
      router: async ({ network }) => {
        const summary = network.state.data.summary;

        if (summary) {
          return;
        }
        return codeAgent;
      },
    });

    let latestMessageContent = "";
    for (const message of previousMessages) {
      if (message.role === "user" && message.type === "text") {
        latestMessageContent = message.content as string;
        break;
      }
    }
    let result: Awaited<ReturnType<typeof network.run>>;
    try {
      result = await network.run(latestMessageContent, { state: state });
    } catch (err) {
      // No OpenAI fallback (API key may not be present). Surface the error and let
      // the caller retry, after logging details.
      console.error("Agent run failed", err);
      throw err;
    }

    const fragmentTitleGenerator = createAgent({
      name: "fragment-title-generator",
      description: "A fragment title generator",
      system: FRAGMENT_TITLE_PROMPT,
      model: gemini({
        model: "gemini-1.5-flash",
        apiKey: process.env.GEMINI_API_KEY!,
      }),
    });

    const responseGenerator = createAgent({
      name: "response-generator",
      description: "A response  generator",
      system: RESPONSE_PROMPT,
      model: gemini({
        model: "gemini-1.5-flash",
        apiKey: process.env.GEMINI_API_KEY!,
      }),
    });

    const { output: fragmentTitleOutput } = await fragmentTitleGenerator.run(
      result.state.data.summary,
    );
    const { output: responseOutput } = await responseGenerator.run(
      result.state.data.summary,
    );

    const generateFragmentTitle = () => {
      const output = fragmentTitleOutput[0];

      if (output.type !== "text") {
        return "Fragment";
      }

      if (Array.isArray(output.content)) {
        return output.content.map((txt) => txt).join("");
      } else {
        return output.content;
      }
    };

    const isErorr =
      !result.state.data.summary ||
      Object.keys(result.state.data.files || {}).length === 0;

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxId);
      const host = await sandbox.getHost(3000);
      return `https://${host}`;
    });

    await step.run("save-result", async () => {
      if (isErorr) {
        return await prisma.message.create({
          data: {
            projectId: event.data.projectId,
            content: "somthing went wrong . plese try agian, ",
            role: "ASSISTANCE",
            type: "ERROR",
          },
        });
      }

      return await prisma.message.create({
        data: {
          projectId: event.data.projectId,
          content: parseAgentOutput(responseOutput),
          role: "ASSISTANCE",
          type: "RESULT",
          fragment: {
            create: {
              sandboxUrl: sandboxUrl,
              title: parseAgentOutput(fragmentTitleOutput),
              file: result.state.data.files,
            },
          },
        },
      });
    });

    return {
      url: sandboxUrl,
      title: "Fragment",
      files: result.state.data.summary,
    };
  },
);
