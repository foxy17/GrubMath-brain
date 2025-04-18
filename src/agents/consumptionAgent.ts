import { Agent } from '@mastra/core/agent';
import openrouter from 'utils/openRouter.ts';

const consumptionAgent = new Agent({
  name: 'ConsumptionMapper',
  instructions: Deno.env.get('CONSUMPTION_INSTRUCTIONS')!,
  model: openrouter(Deno.env.get('BILL_MODEL')!),
});

export { consumptionAgent };
