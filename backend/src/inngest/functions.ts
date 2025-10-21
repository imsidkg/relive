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
import { MessageRole, MessageType } from "@prisma/client";

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

      
      // PROPOSED CHANGE: This block shows how to extract the URL and save it.
      const contentToSave = typeof result === 'string' ? result : JSON.stringify(result, null, 2);

      // Check for a preview URL in the agent's output
      const urlRegex = /\[PREVIEW_URL\]\((.*?)\)/;
      const match = contentToSave.match(urlRegex);
      const previewUrl = match ? match[1] : null;

      const newMessage = await prisma.message.create({
        data: {
          content: contentToSave,
          role: MessageRole.ASSISTANCE,
          type: MessageType.RESULT,
          projectId: projectId,
        },
      });

      if (previewUrl) {
        await prisma.fragment.create({
          data: {
            messageId: newMessage.id,
            sandboxUrl: previewUrl,
            title: "Live Preview",
            file: {},
          },
        });
      }
      

      // CURRENT IMPLEMENTATION:
      // const contentToSave = typeof result === 'string' ? result : JSON.stringify(result, null ,2)

      // await prisma.message.create({
      //   data: {
      //       content: contentToSave,
      //       role : MessageRole.ASSISTANCE,
      //       type: MessageType.RESULT,
      //         projectId: projectId
      //   }
      // })

      return previewUrl;
    } catch (error) {
      console.error(error);
      return `An error occurred while running the simple agent.`;
    }
  }
);
