import { Step } from '@mastra/core';
import { z } from 'zod';
import { billSchema, userConsumptionSchema, userTotalSchema } from '../schemas/bill.ts';

export const calculateTotalsStep = new Step({
  id: 'calculateTotals',
  inputSchema: z.object({
    bill: billSchema,
    consumption: z.array(userConsumptionSchema),
    numUsers: z.number(),
  }),
  outputSchema: z.array(userTotalSchema),
  async execute({ context }) {
    try {
      const { bill, consumption, numUsers } = context.inputData;
      const taxPerUser = bill.tax / numUsers;
      return consumption.map((user) => {
        const itemTotal = user.consumption.reduce(
          (sum, { itemId, proportion }) => {
            const item = bill.items.find((i) => i.id === itemId);
            return sum + (item ? item.cost * proportion : 0);
          },
          0,
        );
        const total = itemTotal + taxPerUser;
        return { ...user, userId: user.userId, total };
      });
    } catch (error) {
      console.error('[calculateTotalsStep] execute error:', error);
      throw error;
    }
  },
}); 