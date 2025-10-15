import { prisma } from "./lib/prisma";
import { router, publicProcedure } from "./trpc";
import { z } from "zod";
import { MessageRole } from "@prisma/client";
import { inngest } from "./inngest/client";

export const appRouter = router({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `hello ${input.text}`,
      };
    }),

  sendMessage: publicProcedure
    .input(
      z.object({
        message: z.string(),
        projectId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const userMessage = await prisma.message.create({
        data: {
          content: input.message,
          role: MessageRole.USER,
          type: "RESULT",
          projectId: input.projectId,
        },
      });

      await inngest.send({
        name: "agent/conversation.start",
        data: {
          projectId: input.projectId,
          messageId: userMessage.id,
        },
      });

      return {
        messageId: userMessage.id,
      };
    }),
});

export type AppRouter = typeof appRouter;
