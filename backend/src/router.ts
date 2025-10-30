import { prisma } from "./lib/prisma";
import { router, publicProcedure } from "./trpc";
import { z } from "zod";
import { MessageRole } from "@prisma/client";
import { inngest } from "./inngest/client";

export const appRouter = router({
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
        name: "codeAgentFunction/run",
        data: {
          projectId: input.projectId,
          messageId: userMessage.id,
        },
      });

      return {
        messageId: userMessage.id,
        projectId: input.projectId,
      };
    }),

  createProject: publicProcedure
    .input(
      z.object({
        name: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const project = await prisma.project.create({
        data: {
          name: input.name,
          userId: input.userId,
        },
      });
      return project;
    }),

  getProjectById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const project = await prisma.project.findUniqueOrThrow({
        where: {
          id: input.id,
        },
      });
      return project;
    }),

  listProjects: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const projects = await prisma.project.findMany({
        where: {
          userId: input.userId,
        },
      });
      return projects;
    }),

  getMessages: publicProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      const messages = await prisma.message.findMany({
        where: {
          projectId: input.projectId,
        },
        include: {
          fragment: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });
      return messages;
    }),
});

export type AppRouter = typeof appRouter;
