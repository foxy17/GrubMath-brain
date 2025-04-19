import { Step } from '@mastra/core';
import { z } from 'zod';
import { userConsumptionSchema } from '../schemas/bill.ts';
import { getConsumptionAgent } from '../agents/consumptionAgent.ts';

export const mapConsumptionStep = new Step({
  id: 'mapConsumption',
  inputSchema: z.object({
    users: z.array(z.object({
      userId: z.number(),
      name: z.string(),
      description: z.string().optional(),
    })).describe('List of users with optional consumption descriptions'),
    billItems: z.array(z.object({
      id: z.number(),
      name: z.string(),
      cost: z.number(),
      type: z.string(),
    })).describe('List of bill items'),
    generalPrompt: z.string().optional().describe(
      'General instructions on how to split the bill',
    ),
  }),
  outputSchema: userConsumptionSchema.array(),
  async execute({ context }) {
    const { users, billItems, generalPrompt } = context.triggerData;
    const agent = await getConsumptionAgent();
    const response = await agent.generate([
      {
        role: 'user',
        content: `Map consumption for users: ${
          JSON.stringify(users)
        } on bill items: ${
          JSON.stringify(billItems)
        } with context on who had what: "${generalPrompt ?? ''}"`,
      },
    ], {
      output: userConsumptionSchema.array(),
    });
    return response.object;
  },
});
