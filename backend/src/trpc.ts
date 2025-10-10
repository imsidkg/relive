import { initTRPC } from '@trpc/server';
import { z } from 'zod';
export const t = initTRPC.create();
export const router = t.router;
export const publicProcedure = t.procedure;
export type AppRouter = typeof router;