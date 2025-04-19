import { Step } from '@mastra/core';
import { billSchema } from 'schemas/bill.ts';
import openRouter from 'utils/openRouter.ts';
import { CoreMessage, generateObject } from 'ai';
import { z } from 'zod';
import '@std/dotenv/load';
import { langfuse } from 'utils/langfuse.ts';

const parseBillStep = new Step({
  id: 'parseBill',
  inputSchema: z.object({
    image: z.string().describe('Base64-encoded image of the bill'),
    currency: z.string().describe('Currency of the bill (e.g., USD, INR)'),
  }),
  outputSchema: billSchema,
  execute: async ({ context }) => {
    const parentTraceId = context.triggerData.traceId;
    const image = context.triggerData.image;
    const currency = context.triggerData.currency;
    const messageObject: CoreMessage[] = [
      {
        role: 'user',
        content: currency,
      },
      {
        role: 'user',
        content: [{
          type: 'image',
          image: image,
        }],
      },
    ];

    const trace = langfuse.trace({
      id: parentTraceId,
      name: 'Bill parsing tool trace',
    });
    const model = Deno.env.get('BILL_MODEL')!;
    const aiModel = openRouter(model);

    try {
      const _generation = trace.generation({
        name: 'Bill parsing',
        model: model,
        input: messageObject,
      });

      const promptObject = await langfuse.getPrompt('BILL_INSTRUCTIONS');

      const response = await generateObject({
        model: aiModel,
        schema: billSchema,
        schemaName: 'Food and drinks bill',
        schemaDescription:
          'This schema defines the structure of a bill, including an array of items (each with id, name, cost, and type), tax, total, and currency. ',
        messages: messageObject,
        system: promptObject.prompt,
        experimental_telemetry: {
          isEnabled: true,
          metadata: {
            langfusePrompt: promptObject.toJSON(),
          },
        },
      });

      _generation.end({
        output: response.object,
      });
      console.log(response.object);
      return response.object;
    } catch (error) {
      console.error('Error parsing bill:', error);
      throw new Error('Failed to parse bill');
    }
  },
});

export { parseBillStep };
