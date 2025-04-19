import { Langfuse } from 'https://esm.sh/langfuse@3.37.2';
import '@std/dotenv/load';

const langfuse = new Langfuse({
  publicKey: Deno.env.get('LANGFUSE_PUBLIC_KEY')!,
  secretKey: Deno.env.get('LANGFUSE_SECRET_KEY')!,
  baseUrl: Deno.env.get('LANGFUSE_BASEURL')!,
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
