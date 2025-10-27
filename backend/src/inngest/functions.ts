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

import { createAgent, gemini } from "@inngest/agent-kit";

import { FRAGMENT_TITLE_PROMPT, RESPONSE_PROMPT } from "../prompt";



// Helper function to parse the agent's final output

const parseAgentOutput = (output: any): string => {

  if (output.type !== "text") {

    return "Fragment";

  }

  if (Array.isArray(output.content)) {

    return output.content.map((txt: any) => txt).join("");

  } else {

    return output.content;

  }

};



export const simpleAgentRun = inngest.createFunction(

  { id: "conversation-start" },

  { event: "agent/conversation.start" },

  async ({ event, step }) => {

    const { projectId } = event.data;



    const project = await prisma.project.findUnique({

      where: { id: projectId },

      include: { messages: { orderBy: { createdAt: "asc" } } },

    });



    if (!project) {

      throw new Error(`Project with ID ${projectId} not found`);

    }



    const conversationHistory = project.messages

      .map((m) => `${m.role}: ${m.content}`)

      .join("\n\n");



    const agentResult = await simpleAgent.run(conversationHistory, { step });



    const agentContent = typeof agentResult === 'string' 

      ? agentResult 

      : JSON.stringify(agentResult, null, 2);



    // Extract the summary from the agent's output

    const summaryMatch = agentContent.match(/<task_summary>([\s\S]*?)<\/task_summary>/);

    const summary = summaryMatch ? summaryMatch[1].trim() : "No summary provided.";



    // Define post-processing agents

    const fragmentTitleGenerator = createAgent({

      name: "fragment-title-generator",

            system: FRAGMENT_TITLE_PROMPT,

model: gemini({ model: "gemini-2.5-pro" }),

    });



    const responseGenerator = createAgent({

      name: "response-generator",

      system: RESPONSE_PROMPT,

      model: gemini({ model: "gemini-2.5-pro" }),

    });



    // Run post-processing agents

    const { output: fragmentTitleOutput } = await fragmentTitleGenerator.run(summary);

    const { output: responseOutput } = await responseGenerator.run(summary);



    const finalTitle = parseAgentOutput(fragmentTitleOutput[0]);

    const finalContent = parseAgentOutput(responseOutput[0]);



    // Check for a preview URL in the agent's raw output

    const urlRegex = /\[PREVIEW_URL\]\((.*?)\)/;

    const urlMatch = agentContent.match(urlRegex);

    const previewUrl = urlMatch ? urlMatch[1] : null;



    const isError = !summary || summary === "No summary provided.";



    if (isError) {

      await prisma.message.create({

        data: {

          projectId: projectId,

          content: "Something went wrong. Please try again.",

          role: "ASSISTANCE",

          type: "ERROR",

        },

      });

      return { error: "Agent failed to provide a summary." };

    }



    // Save the final, polished result to the database

    await prisma.message.create({

      data: {

        projectId: projectId,

        content: finalContent,

        role: MessageRole.ASSISTANCE,

        type: MessageType.RESULT,

        fragment: {

          create: {

            sandboxUrl: previewUrl || "",

            title: finalTitle,

            file: { summary: summary, rawOutput: agentContent },

          },

        },

      },

    });



    return { success: true, title: finalTitle, content: finalContent };

  }

);


