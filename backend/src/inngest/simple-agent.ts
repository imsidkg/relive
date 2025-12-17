import { createAgent, createTool, gemini } from "@inngest/agent-kit";
import z from "zod";
import { getSandbox } from "../lib/utils";
import { PROMPT } from "../prompt";

const listFiles = createTool({
  name: "listFiles",
  description: "Lists all the files present in the directory",
  parameters: z.object({}),
  handler: async (parameters, { network }) => {
    try {
      const sandbox = await getSandbox(network);
      const files = await sandbox.files.list("/home/user");
      return files;
    } catch (error) {
      console.error("Failed to fetch file list");
      return;
    }
  },
});

const writeFiles = createTool({
  name: "writeFiles",
  description: "Create or update files in the sandbox",
  parameters: z.object({ path: z.string(), content: z.string() }),
  handler: async (parameters, { network }) => {
    const sandbox = await getSandbox(network);
    const files = await sandbox.files.write(
      parameters.path,
      parameters.content
    );
    return files;
  },
});

const readFiles = createTool({
  name: "readFiles",
  description: "Reads file's content according to the path provided",
  parameters: z.object({ path: z.string() }),
  handler: async (parameters, { network }) => {
    try {
      const sandbox = await getSandbox(network);
      const content = await sandbox.files.read(parameters.path);
      return content;
    } catch (error) {
      console.error("Failed to fetch file content");
      return;
    }
  },
});

const executeCommand = createTool({
  name: "executeCommand",
  description:
    "Executes a shell command in the sandbox terminal and returns its output.",
  parameters: z.object({
    command: z.string().describe("The shell command to execute."),
  }),
  handler: async ({ command }, { network }) => {
    try {
      const sandbox = await getSandbox(network);

      const process = await sandbox.commands.run(command);

      return {
        stdout: process.stdout,
        stderr: process.stderr,
        exitCode: process.exitCode,
      };
    } catch (error: any) {
      console.error(`Command failed to execute: ${command}`, error);
      return {
        stdout: "",
        stderr: `Failed to execute command: ${error.message}`,
        exitCode: 1,
      };
    }
  },
});

const getPreviewURL = createTool({
  name: "getPreviewURL",
  description:
    "Gets the public preview URL for the web application running in the sandbox on port 3000.",
  parameters: z.object({}),
  handler: async (parameters, { network }) => {
    const sandbox = await getSandbox(network);
    const url = sandbox.getHost(3000);
    return url;
  },
});

export const simpleAgent = createAgent({
  name: "SImple tool agent",
  tools: [listFiles, writeFiles, readFiles, executeCommand, getPreviewURL],
  system: PROMPT,
  model: gemini({
    model: "gemini-2.5-pro",
    apiKey: "AIzaSyCIzI_uhJbUJ5UY3lNNOyfVQF6pc_FmFGk",
  }),
});
