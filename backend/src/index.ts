import { serve } from "inngest/express";
import { inngest } from "./inngest/client";
import { codeAgentFunction } from "./inngest/functions";
import express from "express";
import cors from "cors";
import * as trpcExpress from "@trpc/server/adapters/express";
import { appRouter } from "./router";
import "zod-to-json-schema";
import "dotenv/config";

const app = express();
app.use(express.json());
app.use(cors());

app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: appRouter,
  })
);

app.use(
  "/api/inngest",
  serve({ client: inngest, functions: [codeAgentFunction] })
);

app.get("/test-trigger", async (req, res) => {
  await inngest.send({
    name: "test/hello.world",
    data: { name: "From Test Trigger" },
  });
  res.send("Event sent!");
});

app.get("/test-agent", async (req, res) => {
  const prompt = req.query.prompt as string;
  if (!prompt) {
    return res.status(400).send("Missing 'prompt' query parameter");
  }

  await inngest.send({
    name: "agent/simple.run",
    data: { prompt },
  });
  res.send("Agent run event sent!");
});

app.listen(4000, () => {
  console.log("Server started on http://localhost:4000");
});
