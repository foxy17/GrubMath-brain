import { Mastra } from '@mastra/core';
import { LangfuseExporter } from 'langfuse-vercel';
import { billSplitWorkflow } from './workflows/billSplitWorkflow.ts';
import { rateLimitMiddleware } from './handlers/rateLimitMiddleware.ts';
import { handleBillSplit } from './handlers/billSplitHandler.ts';
import { registerApiRoute } from '@mastra/core/server';
import process from 'node:process';
import { getConsumptionAgent } from './agents/consumptionAgent.ts';

const isProd = process.env.ENV === 'production';
const allowedOrigin = isProd ? ['https://grubmath.com'] : ['*'];

const agent = await getConsumptionAgent();
export const mastra = new Mastra({
  workflows: { billSplitWorkflow },
  agents: { agent },
  telemetry: {
    serviceName: 'ai', // this must be set to "ai" so that the LangfuseExporter thinks it's an AI SDK trace
    enabled: true,
    export: {
      type: 'custom',
      exporter: new LangfuseExporter({
        publicKey: process.env.LANGFUSE_PUBLIC_KEY!,
        secretKey: process.env.LANGFUSE_SECRET_KEY!,
        baseUrl: process.env.LANGFUSE_BASEURL!,
      }),
    },
  },
  server: {
    // middleware: [rateLimitMiddleware],
    port: 3000,
    cors: {
      origin: allowedOrigin,
      allowMethods: ['POST', 'OPTIONS'],
      allowHeaders: ['Content-Type'],
      credentials: false,
    },
    apiRoutes: [
      registerApiRoute('/split-bill', {
        method: 'POST',
        handler: handleBillSplit,
      }),
    ],
  },
});
