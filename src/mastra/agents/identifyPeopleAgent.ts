import { Agent } from '@mastra/core';
import openrouter from '../utils/openRouter.ts';
import { langfuse } from '../utils/langfuse.ts';
import process from 'node:process';

export async function getIdentifyPeopleAgent() {
  const promptObject = await langfuse.getPrompt('CONSUMPTION_INSTRUCTIONS');
  return new Agent({
    name: 'IdentifyPeopleAgent',
    model: openrouter(process.env.BILL_MODEL!),
    instructions: 'You are an expert text analysis agent. Your task is to carefully read the provided text and extract only the names of people mentioned. Return these names as a simple JSON array of strings. For example, if the text is "Arnav and Rohan split the bill", you should return ["Arnav", "Rohan"]. Do not include any other text, explanations, or formatting.',
  });
}
