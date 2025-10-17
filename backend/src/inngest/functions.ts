// import { inngest } from "./client";
// import { simpleAgent } from "./simple-agent";
// import { prisma } from "../lib/prisma";

// export const simpleAgentRun = inngest.createFunction(
//   { id: "conversation-start" },
//   { event: "agent/conversation.start" },
//   async ({ event, step }) => {
//     const { messageId, projectId } = event.data;
//     try {
//       let messages:string[];
//       try {
//         const project = await prisma.project.findUnique({
//           where: { id: projectId },
//           include: {
//             messages: true,
//           },
//         });

//          messages = project?.messages;
//       } catch (error) {
//         console.error(error)
//         return `Unable to find messages from the projectId that you provided`
//       }

//       const result = await simpleAgent.run(messages, {
//         step: step,
//       });

//       return result;
//     } catch (error) {
//       console.error(error)
//     }
//   }
// );

import { inngest } from "./client";
import { simpleAgent } from "./simple-agent";
import { prisma } from "../lib/prisma";

export const simpleAgentRun = inngest.createFunction(
  { id: "conversation-start" },
  { event: "agent/conversation.start" },
  async ({ event, step }) => {
    const { messageId, projectId } = event.data;

    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { messages: true },
      });

      if (!project) {
        return `Unable to find project with the provided ID`;
      }

      const allMessages = project.messages
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n");

      const result = await simpleAgent.run(allMessages, { step });

      return result;
    } catch (error) {
      console.error(error);
      return `An error occurred while running the simple agent.`;
    }
  }
);
