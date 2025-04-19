import { Mastra } from '@mastra/core';
import { LangfuseExporter } from 'langfuse-vercel';
import { billSplitWorkflow } from 'workflows/billSplitWorkflow.ts';
import { billRoutes } from 'routes/billRoutes.ts';
import { rateLimitMiddleware } from 'handlers/rateLimitMiddleware.ts';
import '@std/dotenv/load';

const isProd = Deno.env.get('ENV') === 'production';
const allowedOrigin = isProd ? ['https://grubmath.com'] : ['*'];

export const mastra = new Mastra({
  workflows: { billSplitWorkflow },
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
  server: {
    middleware: [rateLimitMiddleware ],
    port: 3000,
    cors: {
      origin: allowedOrigin,
      allowMethods: ['POST', 'OPTIONS'],
      allowHeaders: ['Content-Type'],
      credentials: false,
    },
    apiRoutes: [
      ...billRoutes
    ],
  },
});
