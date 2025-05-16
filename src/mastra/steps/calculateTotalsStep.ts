import { createStep } from '@mastra/core/workflows/vNext';
import { z } from 'zod';
import {
  billSchema,
  userConsumptionSchema,
  userTotalSchema,
} from '../schemas/bill.ts';

export const calculateTotalsStep = createStep({
  id: 'calculateTotals',
  inputSchema: z.object({
    bill: billSchema,
    consumption: z.array(userConsumptionSchema),
    users: z.array(z.string()).describe('Array of user names'),
  }),
  outputSchema: z.array(userTotalSchema),
  execute: async (context) => {
    try {
      const { bill, consumption, users } = context.inputData;
      const numUsers = users.length;

      if (numUsers === 0 && bill.tax > 0) {
        // If no users and tax exists, it's problematic.
        // For now, proceed by not adding tax per user if numUsers is 0.
        // Consider throwing an error or specific handling if this state is invalid.
        console.warn(
          '[calculateTotalsStep] numUsers is 0. Tax will not be split.',
        );
      }

      const taxPerUser = numUsers > 0 ? bill.tax / numUsers : 0;

      return consumption.map((user) => {
        const itemTotal = user.consumption.reduce(
          (sum, { itemId, proportion }) => {
            const item = bill.items.find((i) => i.id === itemId);
            return sum + (item ? item.cost * proportion : 0);
          },
          0,
        );
        const total = itemTotal + taxPerUser;
        return { ...user, total };
      });
    } catch (error) {
      console.error('[calculateTotalsStep] execute error:', error);
      throw error;
    }
  },
});
