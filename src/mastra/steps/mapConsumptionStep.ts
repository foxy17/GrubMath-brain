import { createStep } from '@mastra/core/workflows/vNext';
import { z } from 'zod';
import { userConsumptionSchema } from '../schemas/bill.ts';
import { getConsumptionAgent } from '../agents/consumptionAgent.ts';

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
  }),
  outputSchema: userConsumptionSchema.array(),
  execute: async (context) => {
    try {
      const { items: billItems, generalPrompt } = context.inputData;
      const promptContent = `Identify users from context: "${
        generalPrompt ?? ''
      }" and map consumption on bill items based of the context itself: ${
        JSON.stringify(billItems)
      }`;

      const agent = await getConsumptionAgent();
      const response = await agent.generate([
        {
          role: 'user',
          content: promptContent,
        },
      ], {
        output: userConsumptionSchema.array(),
      });
      console.log('response');
      console.log(response);
      // const object = extractJsonFromCodeBlock(response.object);
      return response.object;
    } catch (error) {
      console.error('[mapConsumptionStep] execute error:', error);
      throw error;
    }
  },
});
