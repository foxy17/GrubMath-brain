import { createStep } from '@mastra/core/workflows/vNext';
import { z } from 'zod';
import { userTotalSchema } from '../schemas/bill.ts';

export const validateTotalStep = createStep({
  id: 'validateTotal',
  inputSchema: z.object({
    userTotals: z.array(userTotalSchema),
    billTotal: z.number(),
  }),
  outputSchema: z.boolean(),
  execute: async (context) => {
    try {
      const { userTotals, billTotal } = context.inputData;
      const sum = userTotals.reduce((sum, { total }) => sum + total, 0);
      return Math.abs(sum - billTotal) < 0.01;
    } catch (error) {
      console.error('[validateTotalStep] execute error:', error);
      throw error;
    }
  },
});
