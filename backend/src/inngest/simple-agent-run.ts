import { inngest } from "./client";
import { simpleAgent } from "./simple-agent";

export const simpleAgentRun = inngest.createFunction(
    {id: 'conversation-start'},
    {event : 'agent/conversation.start'} , 
    async({event, step} ) => {
        const {data} = event;
        

        console.log(data)
    }
)