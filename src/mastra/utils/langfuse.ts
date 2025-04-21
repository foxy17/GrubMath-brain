import { Langfuse } from 'langfuse';
import process from 'node:process';

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY!,
  secretKey: process.env.LANGFUSE_SECRET_KEY!,
  baseUrl: process.env.LANGFUSE_BASEURL!,
});

async function fetchPromptsOnStartup() {
  // Fetch and cache the production version of the prompt
  await langfuse.getPrompt('BILL_INSTRUCTIONS', undefined, {
    cacheTtlSeconds: 600,
  });
  await langfuse.getPrompt('CONSUMPTION_INSTRUCTIONS', undefined, {
    cacheTtlSeconds: 600,
  });
}

export { fetchPromptsOnStartup, langfuse };
