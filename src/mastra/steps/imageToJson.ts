import { Step } from '@mastra/core';
import { billSchema } from '../schemas/bill.ts';
import openRouter from '../utils/openRouter.ts';
import { CoreMessage, generateText, Output } from 'ai';
import { z } from 'zod';
import { langfuse } from '../utils/langfuse.ts';
import process from 'node:process';
import { extractJsonFromCodeBlock } from '../utils/parseObject.ts';

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
    const model = process.env.BILL_MODEL!;
    const aiModel = openRouter(model);

    try {
      const _generation = trace.generation({
        name: 'Bill parsing',
        model: model,
        input: messageObject,
      });

      const promptObject = await langfuse.getPrompt('BILL_INSTRUCTIONS');

      const response = await generateText({
        model: aiModel,
        experimental_output: Output.object({
          schema: billSchema,
        }),
        system: promptObject.prompt,
        experimental_telemetry: {
          isEnabled: true,
          metadata: {
            langfusePrompt: promptObject.toJSON(),
          },
        },
      });
      const object = extractJsonFromCodeBlock(response.text);
      _generation.end({
        output: object,
      });
      return object;
    } catch (error) {
      console.error('Error parsing bill:', error);
      throw new Error('Failed to parse bill');
    }
  },
});

export { parseBillStep };
