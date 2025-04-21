import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import process from 'node:process';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export default openrouter;
