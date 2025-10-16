
// src/inngest/functions.ts
import { inngest } from "./client";
import { MessageRole } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { simpleAgent } from "./simple-agent";

export const testHelloWorld = inngest.createFunction(
  { id: "test-hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    console.log("BACKGROUND JOB STARTED: Received event", event.data);

    await step.sleep("wait-a-moment", "2s");

    console.log("BACKGROUND JOB FINISHED: Waited 2 seconds.");

    return { success: true, message: "Hello, " + event.data.name };
  }
);


export const simpleAgentRun = inngest.createFunction(
  { id: "conversation-start" },
  { event: "agent/conversation.start" },
  async ({ event, step }) => {
    const { messageId, projectId } = event.data;
    const message = await prisma.message.findUnique({
      where: {
        id: messageId,
      },
    });
    if (!message) {
      return `Message does not exist for the given messageId`;
    }
    const { content } = message;
    const result = await step.run("run-agent", async () => {
      return await simpleAgent.run(content);
    });

    await prisma.message.create({
      data: {
        projectId: projectId,
         content: JSON.stringify(result),
         role: MessageRole.ASSISTANCE,
         type:'RESULT'
      },
    });
    return result
  }
);


