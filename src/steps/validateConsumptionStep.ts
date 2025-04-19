import { Step } from '@mastra/core';
import { z } from 'zod';
import { billItemSchema, userConsumptionSchema } from 'schemas/bill.ts';

export const validateConsumptionStep = new Step({
  id: 'validateConsumption',
  inputSchema: z.object({
    billItems: z.array(billItemSchema).describe('List of items on the bill'),
    consumption: z.array(userConsumptionSchema).describe(
      'User consumption mappings',
    ),
  }),
  outputSchema: z.boolean().describe(
    'True if every bill item is consumed by at least one user',
  ),
  execute: async ({ context }) => {
    const { billItems, consumption } = context.inputData;
    const consumedIds = new Set<number>();
    consumption.forEach((user) => {
      user.consumption.forEach(({ itemId, proportion }) => {
        if (proportion > 0) consumedIds.add(itemId);
      });
    });
    return billItems.every(({ id }) => consumedIds.has(id));
  },
});
