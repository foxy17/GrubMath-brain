import { Mastra } from '@mastra/core';
import { LangfuseExporter } from 'langfuse-vercel';
import '@std/dotenv/load';

export const mastra = new Mastra({
  telemetry: {
    serviceName: 'ai', // this must be set to "ai" so that the LangfuseExporter thinks it's an AI SDK trace
    enabled: true,
    export: {
      type: 'custom',
      exporter: new LangfuseExporter({
        publicKey: Deno.env.get('LANGFUSE_PUBLIC_KEY')!,
        secretKey: Deno.env.get('LANGFUSE_SECRET_KEY')!,
        baseUrl: Deno.env.get('LANGFUSE_BASEURL')!,
      }),
    },
  },
});
