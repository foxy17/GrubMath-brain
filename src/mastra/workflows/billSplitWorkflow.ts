import { createWorkflow } from '@mastra/core/workflows/vNext';
import { z } from 'zod';
import { identifyPeopleStep } from '../steps/identifyPeopleStep.ts';
import { parseBillStep } from '../steps/imageToJson.ts';
import { mapConsumptionStep } from '../steps/mapConsumptionStep.ts';
import { validateConsumptionStep } from '../steps/validateConsumptionStep.ts';
import { calculateTotalsStep } from '../steps/calculateTotalsStep.ts';
import { validateTotalStep } from '../steps/validateTotalStep.ts';
import { generateOutputStep } from '../steps/generateOutputStep.ts';
import { userTotalSchema } from '../schemas/bill.ts';

// Define the input schema for the workflow
const workflowInputSchema = z.object({
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
});

// Create the base workflow definition
export const baseWorkflow = createWorkflow({
  id: 'billSplitWorkflow',
  inputSchema: workflowInputSchema,
  outputSchema: z.string(),
  steps: [
    identifyPeopleStep,
    parseBillStep,
    mapConsumptionStep,
    validateConsumptionStep,
    calculateTotalsStep,
    validateTotalStep,
    generateOutputStep,
  ],
});

// Configure the workflow steps
export const billSplitWorkflow = baseWorkflow
  // Step 1: Prepare input for identifyPeopleStep
  .map({
    generalPrompt: {
      initData: baseWorkflow,
      path: 'generalPrompt',
    },
  })
  .then(identifyPeopleStep)
  // Step 2: Prepare input for parseBillStep
  .map({
    image: {
      initData: baseWorkflow,
      path: 'image',
    },
    currency: {
      initData: baseWorkflow,
      path: 'currency',
    },
    traceId: {
      initData: baseWorkflow,
      path: 'traceId',
    },
  })
  .then(parseBillStep)
  // Step 3: Prepare input for mapConsumptionStep
  .map({
    items: {
      step: parseBillStep,
      path: 'object.items',
    },
    users: {
      step: identifyPeopleStep,
      path: 'users',
    },
    tax: {
      step: parseBillStep,
      path: 'object.tax',
    },
    total: {
      step: parseBillStep,
      path: 'object.total',
    },
    currency: {
      step: parseBillStep,
      path: 'object.currency',
    },
    generalPrompt: {
      initData: baseWorkflow,
      path: 'generalPrompt',
    },
  })
  .then(mapConsumptionStep)
  // Step 4: Prepare input for validateConsumptionStep
  .map({
    consumption: {
      step: mapConsumptionStep,
      path: '.',
    },
    billItems: {
      step: parseBillStep,
      path: 'object.items',
    },
  })
  .then(validateConsumptionStep)
  .map({
    consumption: { step: mapConsumptionStep, path: '.' },
    bill: { step: parseBillStep, path: 'object' },
    users: { step: identifyPeopleStep, path: 'users' },
  })
  .then(generateOutputStep)
  .commit();
