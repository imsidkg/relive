import { createAgent, createTool, gemini  } from "@inngest/agent-kit";
import { Sandbox } from "@e2b/code-interpreter";
import z from "zod";
import { getSandbox } from "../lib/utils";

const greetTool = createTool({
  name: "greetTool",
  description: "Greets a person with their name",
  parameters: z.object({
    name: z.string().describe("The name of the person to greet"),
  }),
  handler: async ({ name }) => {
    return `hello  ${name}`;
  },
});

const listFiles = createTool({
  name: "listFiles",
  description: "Lists all the files present in the directory",
  parameters : z.object({}),
  handler: async (parameters , {network}) => {
    try {
      const sandbox = await getSandbox(network);
      const files =await sandbox.files.list('/')
      return files
    } catch (error) {
      console.error('Failed to fetch file list')
      return 
    }
  },
});

export const simpleAgent = createAgent({
  name: "SImple tool agent",
  tools: [ listFiles],
  system: "You are a friendly agent that greets people.",
  model : gemini({ model: 'gemini-2.5-pro' })
});
