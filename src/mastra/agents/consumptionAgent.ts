import { Agent } from '@mastra/core/agent';
import openrouter from '../utils/openRouter.ts';
import { langfuse } from '../utils/langfuse.ts';
import process from 'node:process';
export async function getConsumptionAgent() {
  const promptObject = await langfuse.getPrompt('CONSUMPTION_INSTRUCTIONS');
  return new Agent({
    name: 'ConsumptionMapper',
    instructions: promptObject.prompt,
    model: openrouter(process.env.BILL_MODEL!),
  });
}
