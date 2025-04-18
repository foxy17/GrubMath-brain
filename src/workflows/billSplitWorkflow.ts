import { Workflow } from '@mastra/core/workflows';
import { z } from 'zod';

// Define the workflow
const billSplitWorkflow = new Workflow({
  name: 'BillSplitWorkflow',
  triggerSchema: z.object({
    currency: z.string().describe('The currency of the bill (USD or INR)'),
    image: z.string().optional().describe('Base64-encoded image of the bill'),
    users: z.array(z.object({
      name: z.string(),
      description: z.string().optional(),
    })).optional().describe(
      'Optional list of users with their consumption descriptions',
    ),
    generalPrompt: z.string().optional().describe(
      'Optional general instructions on how to split the bill',
    ),
  }),
});

export { billSplitWorkflow };
