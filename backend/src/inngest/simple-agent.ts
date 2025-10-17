import { createAgent, createTool, gemini } from "@inngest/agent-kit";
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

export const simpleAgent = createAgent({
  name: "SImple tool agent",
  tools: [listFiles],
  system: "An expert coding agent",
  model: gemini({
    model: "gemini-2.5-pro",
    apiKey: process.env.GEMINI_API_KEY!,
  }),
});
