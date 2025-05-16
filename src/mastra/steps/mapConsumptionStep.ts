import { createStep } from '@mastra/core/workflows/vNext';
import { z } from 'zod';
import { userConsumptionSchema } from '../schemas/bill.ts';
import { CoreMessage, generateObject } from 'ai';
import { langfuse } from '../utils/langfuse.ts';
import google from '../utils/gemini.ts';
import process from 'node:process';

export const mapConsumptionStep = createStep({
  id: 'mapConsumption',
  inputSchema: z.object({
    items: z.array(z.object({
      id: z.number(),
      name: z.string(),
      cost: z.number(),
      type: z.string(),
    })).describe('List of bill items'),
    users: z.array(z.string()).describe('List of users'),
    tax: z.number(),
    total: z.number(),
    currency: z.string(),
    generalPrompt: z.string().optional().describe(
      'General instructions for consumption mapping',
    ),
    traceId: z.string().describe('Trace ID for debugging'),
  }),
  outputSchema: userConsumptionSchema.array(),
  execute: async (context) => {
    try {
      const {
        items: billItems,
        users,
        generalPrompt,
        traceId,
        currency,
        tax,
        total,
      } = context.inputData; // Added users, currency, tax, total
      const promptObject = await langfuse.getPrompt('CONSUMPTION_INSTRUCTIONS'); // Fetch prompt from Langfuse

      // Construct messages for generateObject
      const messageContent = `Users: ${JSON.stringify(users)}. Bill Items: ${
        JSON.stringify(billItems)
      }. Tax: ${tax}. Total: ${total}. Currency: ${currency}. User Instructions: "${
        generalPrompt ?? ''
      }"`;

      const messageObject: CoreMessage[] = [
        {
          role: 'user',
          content: messageContent,
        },
      ];

      const trace = langfuse.trace({
        id: traceId, // Assuming traceId is passed in inputData
        name: 'Consumption mapping trace',
      });
      const modelName = process.env.BILL_MODEL!; // Get model name from env

      const aiModel = google('gemini-2.5-flash-preview-04-17');

      const _generation = trace.generation({
        name: 'Consumption mapping',
        model: modelName,
        input: messageObject,
      });

      const { object: parsedConsumptionObject } = await generateObject({
        model: aiModel,
        schema: userConsumptionSchema.array(),
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
        output: parsedConsumptionObject,
      });

      return parsedConsumptionObject;
    } catch (error) {
      console.error('[mapConsumptionStep] execute error:', error);
      throw error;
    }
  },
});
