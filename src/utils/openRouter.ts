import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import "@std/dotenv/load";

const openrouter = createOpenRouter({ apiKey: Deno.env.get("OPENROUTER_API_KEY") });

export default openrouter; 