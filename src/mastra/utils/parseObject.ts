/**
 * Extracts and parses a JSON object from a Markdown code block string.
 * Handles code blocks like ```json ... ```
 */
export function extractJsonFromCodeBlock(codeBlock: string): any {
  // Remove code block markers if present
  const code = codeBlock
    .replace(/^```json\s*/i, '') // Remove starting ```json
    .replace(/^```\s*/i, '') // Remove starting ```
    .replace(/```$/, '') // Remove ending ```
    .trim();

  // Parse the JSON string
  try {
    return JSON.parse(code);
  } catch (error) {
    throw new Error('Failed to parse JSON: ' + error);
  }
}
