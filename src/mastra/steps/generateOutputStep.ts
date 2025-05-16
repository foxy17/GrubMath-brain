import { createStep } from '@mastra/core/workflows/vNext';
import { z } from 'zod';
import {
  billSchema,
  userConsumptionSchema,
  userTotalSchema,
} from '../schemas/bill.ts';

export const generateOutputStep = createStep({
  id: 'generateOutput',
  inputSchema: z.object({
    userTotals: z.array(userTotalSchema),
    consumption: z.array(userConsumptionSchema),
    bill: billSchema,
    users: z.array(z.string()).describe('Array of user names'),
  }),
  outputSchema: z.string(),
  execute: async (context) => {
    try {
      const { userTotals, consumption, bill, users } = context.inputData;
      const numUsers = users.length;

      let taxPerUser = 0;
      if (numUsers > 0 && bill.tax > 0) {
        taxPerUser = bill.tax / numUsers;
      }

      if (userTotals.length === 0) {
        if (consumption.length > 0 && bill.items.length > 0) {
          const consumptionSummary = consumption.map((cUser) => {
            const items = cUser.consumption.map(({ itemId, proportion }) => {
              const item = bill.items.find((i) => i.id === itemId);
              if (!item) return '';
              return `${item.name} (${
                proportion === 1 ? 'full' : `${proportion * 100}%`
              }) $${(item.cost * proportion).toFixed(2)}`;
            }).filter(Boolean).join(', ');
            return `${cUser.name}: Items: ${items || 'None'}`;
          }).join('\n');
          return `Bill processing failed or consumption was invalid. No totals calculated. Detected consumption:\n${consumptionSummary}\nBill Total: $${
            bill.total.toFixed(2)
          }, Tax: $${bill.tax.toFixed(2)}`;
        }
        return 'Bill processing failed or consumption was invalid. No totals calculated.';
      }

      const result = userTotals
        .map((user) => {
          const userConsumptionDetail = consumption.find((c) =>
            c.userId === user.userId
          );

          let itemsString = 'None';
          if (userConsumptionDetail) {
            const items = userConsumptionDetail.consumption
              .map(({ itemId, proportion }) => {
                const item = bill.items.find((i) => i.id === itemId);
                if (!item) return '';
                return `${item.name} (${
                  proportion === 1 ? 'full' : `${proportion * 100}%`
                }) $${
                  (
                    item.cost * proportion
                  ).toFixed(2)
                }`;
              })
              .filter(Boolean);
            if (items.length > 0) {
              itemsString = items.join(', ');
            }
          }
          return `${user.name} : $${
            user.total.toFixed(2)
          } (Items: ${itemsString}, Tax: $${taxPerUser.toFixed(2)})`;
        })
        .join('\n');
      return result;
    } catch (error) {
      console.error('[generateOutputStep] execute error:', error);
      throw error;
    }
  },
});
