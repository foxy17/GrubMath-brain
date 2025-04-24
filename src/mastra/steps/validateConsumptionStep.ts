import { Step } from '@mastra/core';
import { z } from 'zod';
import { userConsumptionSchema } from '../schemas/bill.ts';
import { parseBillStep } from './imageToJson.ts';

export const validateConsumptionStep = new Step({
  id: 'validateConsumption',
  inputSchema: z.object({
    consumption: z.array(userConsumptionSchema).describe(
      'User consumption mappings',
    ),
  }),
  outputSchema: z.boolean().describe(
    'True if every bill item is consumed by at least one user',
  ),
  execute: async ({ context }) => {
    try {
      const { consumption } = context.inputData;
      const { object: billItems } = context.getStepResult(parseBillStep);
      const consumedIds = new Set<number>();
      consumption.forEach((user) => {
        user.consumption.forEach(({ itemId, proportion }) => {
          if (proportion > 0) consumedIds.add(itemId);
        });
      });
      return billItems.items.every(({ id }) => consumedIds.has(id));
    } catch (error) {
      console.error('[validateConsumptionStep] execute error:', error);
      throw error;
    }
  },
});
