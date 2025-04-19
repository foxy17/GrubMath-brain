import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const validateTotalContextSchema = z.object({
  userTotals: z.array(z.object({ userId: z.string(), total: z.number() })),
  billTotal: z.number(),
});

const validateTotalOutputSchema = z.boolean();

const validateTotalTool = createTool({
  id: 'validateTotal',
  description: 'Validates if the sum of user totals equals the bill total',
  inputSchema: validateTotalContextSchema,
  outputSchema: validateTotalOutputSchema,
  execute: async ({ context }) => {
    const { userTotals, billTotal } = context;
    const sum = userTotals.reduce((sum, { total }) => sum + total, 0);
    return Math.abs(sum - billTotal) < 0.01;
  },
});

export { validateTotalTool };
