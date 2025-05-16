import { createStep } from '@mastra/core/workflows/vNext';
import { z } from 'zod';
import { CoreMessage, generateObject } from 'ai';
import { langfuse } from '../utils/langfuse.ts';
import google from '../utils/gemini.ts';
import process from 'node:process';

export const identifyPeopleStep = createStep({
  id: 'identifyPeople',
  inputSchema: z.object({
    generalPrompt: z.string().optional().describe(
      'General instructions on how to split the bill, potentially containing user names',
    ),
    traceId: z.string().describe('Trace ID for debugging'), // Added traceId
  }),
  outputSchema: z.object({
    users: z.array(z.string()).describe('An array of identified user names'),
  }),
  execute: async (context) => {
    try {
      const { generalPrompt, traceId } = context.inputData; // Added traceId

      if (!generalPrompt) {
        console.warn(
          '[identifyPeopleStep] No generalPrompt provided, returning empty array.',
        );
        return { users: [] };
      }

      const promptObject = await langfuse.getPrompt(
        'IDENTIFY_PEOPLE_INSTRUCTIONS',
      );
      const modelName = process.env.BILL_MODEL!;
      const aiModel = google(modelName); // Changed from openrouter to google


      const messageObject: CoreMessage[] = [
        {
          role: 'user',
          content: generalPrompt,
        },
      ];

      const trace = langfuse.trace({
        id: traceId,
        name: 'Identify people trace',
      });

      const _generation = trace.generation({
        name: 'Identify people',
        model: modelName,
        input: messageObject,
      });
      
      const { object: identifiedUsers } = await generateObject({
        model: aiModel,
        schema: z.array(z.string()), // Output schema for the LLM call
        messages: messageObject,
        system: promptObject.prompt,
        experimental_telemetry: {
          isEnabled: true,
          metadata: {
            langfusePrompt: promptObject.toJSON(),
          },
        },
      });

      _generation.end({
        output: identifiedUsers,
      });
      console.log('i got these users', identifiedUsers);

      return { users: identifiedUsers ?? [] };
    } catch (error) {
      console.error('[identifyPeopleStep] execute error:', error);
      return { users: [] };
    }
  },
});
