import { Workflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { parseBillStep } from '../steps/imageToJson.ts';
import { mapConsumptionStep } from '../steps/mapConsumptionStep.ts';
import { validateConsumptionStep } from '../steps/validateConsumptionStep.ts';
import { calculateTotalsStep } from '../steps/calculateTotalsStep.ts';
import { validateTotalStep } from '../steps/validateTotalStep.ts';
import { generateOutputStep } from '../steps/generateOutputStep.ts';

// Define the workflow with error handling
let billSplitWorkflow: Workflow;
try {
  billSplitWorkflow = new Workflow({
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
      traceId: z.string().describe('Trace ID for debugging'),
    }),
  })
    .step(parseBillStep)
    .then(mapConsumptionStep, {
      variables: {
        items: { step: parseBillStep, path: 'items' },
        tax: { step: parseBillStep, path: 'tax' },
        total: { step: parseBillStep, path: 'total' },
        currency: { step: parseBillStep, path: 'currency' },
      },
    })
    .after(mapConsumptionStep)
    .step(validateConsumptionStep)
    .if(({ context }) => {
      const value = context.getStepResult('validateConsumption');
      return value;
    })
    .then(calculateTotalsStep)
    .then(validateTotalStep)
    .then(generateOutputStep)
    .else()
    .then(generateOutputStep)
    .commit();
} catch (error) {
  console.error('[billSplitWorkflow] initialization error:', error);
  throw error;
}

export { billSplitWorkflow };
