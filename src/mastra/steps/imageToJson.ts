import { createStep } from '@mastra/core/workflows/vNext';
import { billSchema } from '../schemas/bill.ts';
import { CoreMessage, generateObject } from 'ai';
import { z } from 'zod';
import { langfuse } from '../utils/langfuse.ts';
import { identifyPeopleStep } from './identifyPeopleStep.ts';
import google from '../utils/gemini.ts';

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
    const modelName = 'gemini-2.5-flash-preview-04-17';

    const aiModel = google(modelName);

    try {
      const _generation = trace.generation({
        name: 'Bill parsing',
        model: modelName,
        input: messageObject,
      });

      const promptObject = await langfuse.getPrompt('IDENTIFY_PEOPLE_INSTRUCTIONS');

      const { object: parsedBillObject } = await generateObject({
        model: aiModel,
        schema: billSchema,
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
        output: parsedBillObject,
      });
      return { object: parsedBillObject, users: users };
    } catch (error) {
      console.error('Error parsing bill:', error);
      throw new Error('Failed to parse bill');
    }
  },
});

export { parseBillStep };
