import { createStep } from '@mastra/core/workflows/vNext';
import { billSchema } from '../schemas/bill.ts';
import openRouter from '../utils/openRouter.ts';
import { CoreMessage, generateText, Output } from 'ai';
import { z } from 'zod';
import { langfuse } from '../utils/langfuse.ts';
import process from 'node:process';
import { extractJsonFromCodeBlock } from '../utils/parseObject.ts';
import { identifyPeopleStep } from './identifyPeopleStep.ts';

const parseBillStep = createStep({
  id: 'parseBill',
  inputSchema: z.object({
    image: z.string().describe('Base64-encoded image of the bill'),
    currency: z.string().describe('Currency of the bill (e.g., USD, INR)'),
    traceId: z.string().describe('Trace ID for debugging'),
  }),
  outputSchema: z.object({
    object: billSchema,
    users: z.array(z.string()),
  }),
  execute: async (context) => {
    const { image, currency, traceId } = context.inputData;
    const identifyPeopleResult = context.getStepResult(identifyPeopleStep);
    const users = identifyPeopleResult?.users ?? [];

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
      id: traceId,
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
        messages: messageObject,
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
      return { object: object, users: users };
    } catch (error) {
      console.error('Error parsing bill:', error);
      throw new Error('Failed to parse bill');
    }
  },
});

export { parseBillStep };
