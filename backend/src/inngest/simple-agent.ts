import { createAgent, createTool } from "@inngest/agent-kit";
import z from "zod";

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

export const simpleAgent = createAgent({
  name: "SImple tool agent",
  tools: [greetTool],
  system: "You are a friendly agent that greets people.",
});
