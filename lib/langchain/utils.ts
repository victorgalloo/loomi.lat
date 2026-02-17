/**
 * Shared LangChain utilities
 */

/**
 * Extract text from ChatAnthropic response content.
 * Content can be a plain string or an array of content blocks.
 */
export function extractTextContent(content: string | Array<Record<string, unknown>>): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .filter(b => b.type === 'text' && typeof b.text === 'string')
      .map(b => b.text as string)
      .join('');
  }
  return '';
}
