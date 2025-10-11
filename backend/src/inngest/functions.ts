// src/inngest/functions.ts
import { inngest } from "./client";

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