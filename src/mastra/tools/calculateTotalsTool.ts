import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import {
  billSchema,
  userConsumptionSchema,
  userTotalSchema,
} from '../schemas/bill.ts';

const calculateTotalsContextSchema = z.object({
  bill: billSchema,
  consumption: z.array(userConsumptionSchema),
  numUsers: z.number(),
});

const calculateTotalsOutputSchema = z.array(userTotalSchema);

const calculateTotalsTool = createTool({
  id: 'calculateTotals',
  description:
    'Calculates total amounts for each user, including their share of tax',
  inputSchema: calculateTotalsContextSchema,
  outputSchema: calculateTotalsOutputSchema,
  execute: async ({ context }) => {
    const { bill, consumption, numUsers } = context;
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
  },
});

export { calculateTotalsTool };
