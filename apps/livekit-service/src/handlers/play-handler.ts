import { BaseActionHandler, type HandlerContext } from './base.js';
import { StoreHandler } from './store-handler.js';

/**
 * Handler that retrieves and plays stored text
 *
 * Expected payload:
 * {
 *   id: string - The identifier of the stored text to play
 * }
 */
export class PlayHandler extends BaseActionHandler {
  constructor() {
    super('play');
  }

  override validate(payload: Record<string, unknown> | undefined): boolean {
    if (!payload) return false;
    return typeof payload.id === 'string' && payload.id.length > 0;
  }

  override async handle(context: HandlerContext) {
    const { session, request } = context;
    const id = request.payload?.id as string;

    try {
      // Get the stored text
      const storage = StoreHandler.getStorage();
      const text = storage.get(id);

      if (!text) {
        return this.error(`No text found with id: ${id}`, {
          id,
          availableIds: storage.list().map((item) => item.id),
        });
      }

      // Use the session's say method to speak the stored text
      await session.say(text);
      console.log(`Played text with id '${id}': ${text.substring(0, 50)}...`);

      return this.success('Text played successfully', {
        id,
        text,
      });
    } catch (error) {
      console.error('Error in PlayHandler:', error);
      return this.error(error instanceof Error ? error.message : 'Failed to play text');
    }
  }
}
