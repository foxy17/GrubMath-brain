import { createStep } from '@mastra/core/workflows/vNext';
import { z } from 'zod';
import { billSchema, userConsumptionSchema } from '../schemas/bill.ts';

export const validateConsumptionStep = createStep({
  id: 'validateConsumption',
  inputSchema: z.object({
    consumption: z.array(userConsumptionSchema).describe(
      'User consumption mappings',
    ),
    billItems: billSchema.shape.items.describe(
      'List of items from the bill',
    ),
  }),
  outputSchema: z.boolean().describe(
    'True if every bill item is consumed by at least one user',
  ),
  execute: async (context) => {
    try {
      const { consumption, billItems } = context.inputData;

      const consumedIds = new Set<number>();
      consumption.forEach((user) => {
        user.consumption.forEach(({ itemId, proportion }) => {
          if (proportion > 0) consumedIds.add(itemId);
        });
    });
      return billItems.every(({ id }) => consumedIds.has(id));
    } catch (error) {
      console.error('[validateConsumptionStep] execute error:', error);
      throw error;
    }
  },
});
