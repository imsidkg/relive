import { Sandbox } from "@e2b/code-interpreter";
import  {
  
  NetworkRun,
} from "@inngest/agent-kit";

export async function getSandbox(network?: NetworkRun<any>) {
  let sandbox = network?.state.kv.get("sandbox") as Sandbox;
  if (!sandbox) {
    sandbox = await Sandbox.create();
  }
  await sandbox.setTimeout(5 * 60_000);
  network?.state.kv.set("sandbox", sandbox);
  return sandbox;
}
