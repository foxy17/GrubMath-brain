import { Agent } from '@mastra/core';
import openrouter from '../utils/openRouter.ts';
import { langfuse } from '../utils/langfuse.ts';
import process from 'node:process';

export async function getIdentifyPeopleAgent() {
  const promptObject = await langfuse.getPrompt('CONSUMPTION_INSTRUCTIONS');
  return new Agent({
    name: 'IdentifyPeopleAgent',
    model: openrouter(process.env.BILL_MODEL!),
    instructions: promptObject.prompt,
  });
}
