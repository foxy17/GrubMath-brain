// src/handlers/billSplitHandler.ts
import { mastra } from '../utils/mastra.ts';

export async function handleBillSplit(c: any) {
  let payload;
  try {
    const contentType = c.header('Content-Type');
    if (!contentType || !contentType.includes('application/json')) {
      return c.json({ error: 'Invalid Content-Type. Expected application/json' }, 415);
    }
    payload = await c.req.json();
    if (!payload.image || typeof payload.image !== 'string' ||
        !payload.users || !Array.isArray(payload.users) ||
        !payload.generalPrompt || typeof payload.generalPrompt !== 'string' ||
        !payload.currency || typeof payload.currency !== 'string') {
      return c.json({ error: 'Missing or invalid fields. Required: image (string), users (array), generalPrompt (string), currency (string)' }, 400);
    }
  } catch {
    return c.json({ error: 'Invalid JSON request body.' }, 400);
  }

  const traceId = crypto.randomUUID();
  const workflowInput = {
    image: payload.image,
    users: payload.users,
    generalPrompt: payload.generalPrompt,
    currency: payload.currency,
    traceId,
  };

  try {
    const workflow = mastra.getWorkflow('billSplitWorkflow');
    const { start, watch } = workflow.createRun();
    let finalResult;
    const unwatch = watch((record: any) => {
      if (record && typeof record === 'object' && 'status' in record && record.status === 'completed') {
        finalResult = record;
      }
    });
    finalResult = await start({ triggerData: workflowInput });
    unwatch();
    return c.json(finalResult);
  } catch (error) {
    const err = error as Error;
    return c.json({ message: 'Workflow execution failed on server.', error: err.message, traceId }, 500);
  }
}
