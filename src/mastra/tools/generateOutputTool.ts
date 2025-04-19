import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import {
  billSchema,
  userConsumptionSchema,
  userTotalSchema,
} from '../schemas/bill.ts';

const formatOutputInputSchema = z.object({
  userTotals: z.array(userTotalSchema),
  consumption: z.array(userConsumptionSchema),
  bill: billSchema,
  numUsers: z.number(),
});

const formatOutputOutputSchema = z.string();

const formatOutputTool = createTool({
  id: 'formatOutput',
  description: 'Generates a formatted output of the bill split',
  inputSchema: formatOutputInputSchema,
  outputSchema: formatOutputOutputSchema,
  execute: async (
    { context }: { context: z.infer<typeof formatOutputInputSchema> },
  ) => {
    const { userTotals, consumption, bill, numUsers } = context;
    const taxPerUser = bill.tax / numUsers;
    return userTotals.map((user) => {
      const userConsumption = consumption.find((c) => c.userId === user.userId);
      if (!userConsumption) {
        return `${user.name}: $${user.total.toFixed(2)} (Items: None, Tax: $${
          taxPerUser.toFixed(2)
        })`;
      }
      const items = userConsumption.consumption.map(
        ({ itemId, proportion }) => {
          const item = bill.items.find((i) => i.id === itemId);
          if (!item) return '';
          return `${item.name} (${
            proportion === 1 ? 'full' : proportion * 100 + '%'
          }) $${(item.cost * proportion).toFixed(2)}`;
        },
      ).filter(Boolean);
      return `${user.name} : $${user.total.toFixed(2)} (Items: ${
        items.join(', ') || 'None'
      }, Tax: $${taxPerUser.toFixed(2)})`;
    }).join('\n');
  },
});

export { formatOutputTool };
