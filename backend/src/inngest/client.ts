import { Inngest } from "inngest";

export const inngest = new Inngest({ 
  id: "my-lovable-app",
  eventKey: process.env.INNGEST_EVENT_KEY,
});
