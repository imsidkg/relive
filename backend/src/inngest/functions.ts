import { inngest } from "./client";
import { simpleAgent } from "./simple-agent";
import { prisma } from "../lib/prisma";

export const simpleAgentRun = inngest.createFunction(
  { id: "conversation-start" },
  { event: "agent/conversation.start" },
  async ({ event, step }) => {
    const { messageId } = event.data;

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error(`Message with ID ${messageId} not found.`);
    }

    const result = await simpleAgent.run(message.content, {
      step: step,
    });

    return result;
  }
);
