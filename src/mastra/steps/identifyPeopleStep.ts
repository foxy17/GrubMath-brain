import { Step } from '@mastra/core';
import { z } from 'zod';
import { getIdentifyPeopleAgent } from '../agents/identifyPeopleAgent.ts'; // Assume this agent exists for now

export const identifyPeopleStep = new Step({
  id: 'identifyPeople',
  inputSchema: z.object({
    generalPrompt: z.string().optional().describe(
      'General instructions on how to split the bill, potentially containing user names',
    ),
  }),
  outputSchema: z.object({
    users: z.array(z.string()).describe('An array of identified user names'),
  }),
  async execute({ context }) {
    try {
      const { generalPrompt } = context.inputData;

      if (!generalPrompt) {
        console.warn(
          '[identifyPeopleStep] No generalPrompt provided, returning empty array.',
        );
        return { users: [] }; // Return empty users array matching the schema
      }
      const agent = await getIdentifyPeopleAgent();
      const response = await agent.generate([
        {
          role: 'user',
          content: generalPrompt,
        },
      ], {
        output: z.array(z.string()), // Ensure the agent returns the correct format
      });

      return { users: response.object ?? [] }; // Return the identified names or an empty array
    } catch (error) {
      console.error('[identifyPeopleStep] execute error:', error);
      return { users: <string[]> [] }; // Default to empty array on error for now
    }
  },
});
