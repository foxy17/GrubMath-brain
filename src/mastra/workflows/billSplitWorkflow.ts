import { Workflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { identifyPeopleStep } from '../steps/identifyPeopleStep.ts';
import { parseBillStep } from '../steps/imageToJson.ts';
import { mapConsumptionStep } from '../steps/mapConsumptionStep.ts';
import { validateConsumptionStep } from '../steps/validateConsumptionStep.ts';
import { calculateTotalsStep } from '../steps/calculateTotalsStep.ts';
import { validateTotalStep } from '../steps/validateTotalStep.ts';
import { generateOutputStep } from '../steps/generateOutputStep.ts';

export let billSplitWorkflow: Workflow;

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
  // Step A: Identify people
  .step(identifyPeopleStep, {
    variables: {
      generalPrompt: { step: 'trigger', path: 'generalPrompt' },
    },
  })
  .after(identifyPeopleStep)
  .step(parseBillStep, {
    variables: {
      image: { step: 'trigger', path: 'image' },
      currency: { step: 'trigger', path: 'currency' },
    },
  })
  .after([identifyPeopleStep, parseBillStep])
  .step(mapConsumptionStep, {
    variables: {
      items: { step: parseBillStep, path: 'object.items' },
      tax: { step: parseBillStep, path: 'object.tax' },
      total: { step: parseBillStep, path: 'object.total' },
      currency: { step: parseBillStep, path: 'object.currency' },
    },
  })
  .after(mapConsumptionStep)
  .step(validateConsumptionStep, {
    variables: {
      consumption: { step: mapConsumptionStep, path: '.' },
    },
  })
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
