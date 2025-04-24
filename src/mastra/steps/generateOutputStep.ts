import { Step } from '@mastra/core';
import { z } from 'zod';
import {
  billSchema,
  userConsumptionSchema,
  userTotalSchema,
} from '../schemas/bill.ts';

export const generateOutputStep = new Step({
  id: 'generateOutput',
  inputSchema: z.object({
    userTotals: z.array(userTotalSchema),
    consumption: z.array(userConsumptionSchema),
    bill: billSchema,
    numUsers: z.number(),
  }),
  outputSchema: z.string(),
  async execute({ context }) {
    try {
      const { userTotals, consumption, bill, numUsers } = context.inputData;
      const taxPerUser = bill.tax / numUsers;
      const result = userTotals
        .map((user) => {
          const userConsumption = consumption.find((c) =>
            c.userId === user.userId
          );
          if (!userConsumption) {
            return `${user.name}: $${
              user.total.toFixed(2)
            } (Items: None, Tax: $${taxPerUser.toFixed(2)})`;
          }
          const items = userConsumption.consumption
            .map(({ itemId, proportion }) => {
              const item = bill.items.find((i) => i.id === itemId);
              if (!item) return '';
              return `${item.name} (${
                proportion === 1 ? 'full' : proportion * 100 + '%'
              }) $${
                (
                  item.cost * proportion
                ).toFixed(2)
              }`;
            })
            .filter(Boolean);
          return `${user.name} : $${user.total.toFixed(2)} (Items: ${
            items.join(', ') || 'None'
          }, Tax: $${taxPerUser.toFixed(2)})`;
        })
        .join('\n');
      return result;
    } catch (error) {
      console.error('[generateOutputStep] execute error:', error);
      throw error;
    }
  },
});
