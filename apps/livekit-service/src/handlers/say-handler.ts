import { BaseActionHandler, type HandlerContext } from './base.js';

/**
 * Handler that makes the agent say text aloud
 *
 * Expected payload:
 * {
 *   text: string - The text to speak
 * }
 */
export class SayHandler extends BaseActionHandler {
  constructor() {
    super('say');
  }

  override validate(payload: Record<string, unknown> | undefined): boolean {
    if (!payload) return false;
    return typeof payload.text === 'string' && payload.text.length > 0;
  }

  override async handle(context: HandlerContext) {
    const { session, request } = context;
    const text = request.payload?.text as string;

    try {
      // Use the session's say method to speak the text
      await session.say(text);

      return this.success('Text spoken successfully', { text });
    } catch (error) {
      console.error('Error in SayHandler:', error);
      return this.error(error instanceof Error ? error.message : 'Failed to speak text');
    }
  }
}
