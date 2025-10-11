import express from 'express';
import cors from 'cors';
import { serve } from 'inngest/express';
import { inngest } from './inngest/client';
import { testHelloWorld } from './inngest/functions';

const app = express();
app.use(express.json());
app.use(cors());

// Expose Inngest's API
app.use("/api/inngest", serve({ client: inngest, functions: [testHelloWorld] }));

app.get("/test-trigger", async (req, res) => {
  await inngest.send({
    name: "test/hello.world",
    data: { name: "From Test Trigger" },
  });
  res.send("Event sent!");
});

app.listen(4000, () => {
  console.log('Server started on http://localhost:4000');
});