import { Step } from '@mastra/core';
import { billSchema } from 'schemas/bill.ts';
import openRouter from 'utils/openRouter.ts';
import { generateObject } from 'ai';
import { z } from 'zod';
import '@std/dotenv/load';

const instructions = Deno.env.get('BILL_INSTRUCTIONS')!;

const parseBillStep = new Step({
  id: 'parseBill',
  inputSchema: z.object({
    image: z.string().describe('Base64-encoded image of the bill'),
    currency: z.string().describe('Currency of the bill (e.g., USD, INR)'),
  }),
  outputSchema: billSchema,
  execute: async ({ context }) => {
    const image = context.triggerData.image;
    const currency = context.triggerData.currency;
    try {
      const aiModel = openRouter(Deno.env.get('BILL_MODEL')!);

      const response = await generateObject({
        model: aiModel,
        schema: billSchema,
        schemaName: 'Food and drinks bill',
        schemaDescription:
          'This schema defines the structure of a bill, including an array of items (each with id, name, cost, and type), tax, total, and currency. ',
        messages: [
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
        ],
        system: instructions,
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
