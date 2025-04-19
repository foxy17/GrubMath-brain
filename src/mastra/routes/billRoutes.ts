// src/routes/billSplit.ts
import { registerApiRoute } from '@mastra/core/server';
import { handleBillSplit } from '../handlers/billSplitHandler.ts';
export const billRoutes = [
  registerApiRoute('/split-bill', {
    method: 'POST',
    handler: handleBillSplit
  }),
];
