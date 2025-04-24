import type { Context } from '@mastra/core/server/context';
import { Base64 } from 'base64-string';
import { fetchPromptsOnStartup } from '../utils/langfuse.ts';

export async function handleBillSplit(c: Context) {
  const { payload, error } = await validateAndParseBillSplitPayload(c);
  if (error) return error;
  if (!payload) return c.json({ error: 'Invalid payload.' }, 400);

  const traceId = crypto.randomUUID();
  const workflowInput = {
    image: payload.image,
    users: payload.users,
    generalPrompt: payload.generalPrompt,
    currency: payload.currency,
    traceId,
  };

  // SSE setup
  c.res.headers.set('Content-Type', 'text/event-stream');
  c.res.headers.set('Cache-Control', 'no-cache');
  c.res.headers.set('Connection', 'keep-alive');
  const encoder = new TextEncoder();
  const write = (data: string) => c.res.w.write(encoder.encode(data));

  try {
    await fetchPromptsOnStartup();
    const mastra = c.get('mastra');
    const workflow = mastra.getWorkflow('billSplitWorkflow');
    const { start, watch } = workflow.createRun();
    let finalResult;
    const unwatch = watch((record: { progress: any; status: string }) => {
      if (record && typeof record === 'object') {
        if ('progress' in record) {
          write(
            `event: progress\ndata: ${
              JSON.stringify({ progress: record.progress })
            }\n\n`,
          );
        }
        if ('status' in record && record.status === 'completed') {
          finalResult = record;
          write(`event: completed\ndata: ${JSON.stringify(finalResult)}\n\n`);
        }
      }
    });
    finalResult = await start({ triggerData: workflowInput });
    unwatch();
    // End the stream
    c.res.w.close();
    return;
  } catch (error) {
    const err = error as Error;
    write(
      `event: error\ndata: ${
        JSON.stringify({
          message: 'Workflow execution failed on server.',
          error: err.message,
          traceId,
        })
      }\n\n`,
    );
    c.res.w.close();
    return;
  }
}

async function validateAndParseBillSplitPayload(c: Context) {
  try {
    const body = await c.req.parseBody();
    const imageFile = body.image;
    if (
      !imageFile || typeof imageFile !== 'object' ||
      !imageFile.type?.startsWith('image/')
    ) {
      return {
        error: c.json({ error: 'Missing or invalid image file.' }, 400),
      };
    }
    if (imageFile.size > 5 * 1024 * 1024) {
      return {
        error: c.json({ error: 'Image file too large. Max size is 5MB.' }, 400),
      };
    }
    const imageUint8 = new Uint8Array(await imageFile.arrayBuffer());
    const imageBase64 = imageUint8.toString();

    const usersRaw = body.users;
    let users;
    try {
      users = JSON.parse(usersRaw);
      if (!Array.isArray(users)) throw new Error();
    } catch {
      return {
        error: c.json(
          { error: 'Invalid users field. Must be a JSON array.' },
          400,
        ),
      };
    }

    const generalPrompt = body.generalPrompt;
    const currency = body.currency;
    if (
      typeof generalPrompt !== 'string' ||
      typeof currency !== 'string'
    ) {
      return {
        error: c.json({
          error:
            'Missing or invalid fields. Required: image (file), users (array as JSON string), generalPrompt (string), currency (string)',
        }, 400),
      };
    }
    return {
      payload: {
        image: imageBase64,
        users,
        generalPrompt,
        currency,
      },
    };
  } catch {
    return {
      error: c.json({ error: 'Invalid multipart/form-data request.' }, 400),
    };
  }
}
