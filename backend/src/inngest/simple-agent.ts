import { createAgent, createTool, gemini, Network } from "@inngest/agent-kit";
import z from "zod";
import { getSandbox } from "../lib/utils";

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

export const simpleAgent = createAgent({
  name: "SImple tool agent",
  tools: [listFiles, writeFiles , readFiles],
  system: "An expert coding agent",
  model: gemini({
    model: "gemini-2.5-pro",
    apiKey: process.env.GEMINI_API_KEY!,
  }),
});
