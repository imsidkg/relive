import { inngest } from "./client";
import { simpleAgent } from "./simple-agent";

export const simpleAgentRun = inngest.createFunction(
    {id: 'simple-agent-run'},
    {event : 'agent/simple.run'} , 
    async({event, step} ) => {
        const {data} = event;
        const result = await step.run('run-agent', async() => {
            return await simpleAgent.run(data.prompt)
        })

        return result
    }
)