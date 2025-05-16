import { createStep } from '@mastra/core/workflows/vNext';
import { z } from 'zod';
import {
  billSchema,
  userConsumptionSchema,
  // userTotalSchema, // No longer directly used for input schema, but represents the shape of calculated totals
} from '../schemas/bill.ts';

export const generateOutputStep = createStep({
  id: 'generateOutput',
  inputSchema: z.object({
    // userTotals: z.array(userTotalSchema), // Removed from input
    consumption: z.array(userConsumptionSchema),
    bill: billSchema,
    users: z.array(z.string()).describe('Array of user names'),
  }),
  outputSchema: z.string(),
  execute: async (context) => {
    try {
      const { consumption, bill, users: userNamesArray } = context.inputData;
      const numUsers = userNamesArray.length;

      let taxPerUser = 0;
      if (numUsers > 0 && bill.tax > 0) {
        taxPerUser = bill.tax / numUsers;
      }

      if (consumption.length === 0 || bill.items.length === 0) {
        let problem = '';
        if (consumption.length === 0) {
          problem += 'No consumption data provided.';
        }
        if (bill.items.length === 0) {
          problem += (problem ? ' ' : '') + 'Bill has no items.';
        }
        return `Cannot calculate totals: ${problem} Bill Total: $${
          bill.total.toFixed(2)
        }, Tax: $${bill.tax.toFixed(2)}`;
      }

      const calculatedUserTotals = consumption.map((cUser) => {
        let itemsSubtotal = 0;
        const consumedItemsDetails = cUser.consumption.map(
          ({ itemId, proportion }) => {
            const item = bill.items.find((i) => i.id === itemId);
            if (item) {
              itemsSubtotal += item.cost * proportion;
              return `${item.name} (${
                proportion === 1 ? 'full' : `${proportion * 100}%`
              }) $${(item.cost * proportion).toFixed(2)}`;
            }
            return 'Unknown item';
          },
        ).filter(Boolean).join(', ');

        const userTotalAmount = itemsSubtotal + taxPerUser;

        return {
          userId: cUser.userId,
          name: cUser.name,
          total: userTotalAmount,
          itemsString: consumedItemsDetails || 'None',
        };
      });

      const result = calculatedUserTotals
        .map((user) => {
          return `${user.name} : $${
            user.total.toFixed(2)
          } (Items: ${user.itemsString}, Tax: $${taxPerUser.toFixed(2)})`;
        })
        .join('\n');

      return result;
    } catch (error) {
      console.error('[generateOutputStep] execute error:', error);
      // It might be better to return a user-friendly error string than throwing
      if (error instanceof Error) {
        return `Error during output generation: ${error.message}`;
      }
      return 'An unexpected error occurred while generating the output.';
    }
  },
});
