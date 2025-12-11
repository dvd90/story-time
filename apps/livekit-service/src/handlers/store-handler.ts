import { BaseActionHandler, type HandlerContext } from './base.js';

/**
 * In-memory storage for text items
 */
class TextStorage {
  private storage: Map<string, string> = new Map();

  store(id: string, text: string): void {
    this.storage.set(id, text);
  }

  get(id: string): string | undefined {
    return this.storage.get(id);
  }

  delete(id: string): boolean {
    return this.storage.delete(id);
  }

  has(id: string): boolean {
    return this.storage.has(id);
  }

  list(): Array<{ id: string; text: string }> {
    return Array.from(this.storage.entries()).map(([id, text]) => ({
      id,
      text,
    }));
  }

  clear(): void {
    this.storage.clear();
  }

  size(): number {
    return this.storage.size;
  }
}

// Singleton storage instance shared across all handlers
const textStorage = new TextStorage();

/**
 * Handler that stores text for later retrieval
 *
 * Expected payload:
 * {
 *   id: string - Unique identifier for the stored text
 *   text: string - The text to store
 * }
 */
export class StoreHandler extends BaseActionHandler {
  constructor() {
    super('store');
  }

  override validate(payload: Record<string, unknown> | undefined): boolean {
    if (!payload) return false;
    return (
      typeof payload.id === 'string' &&
      payload.id.length > 0 &&
      typeof payload.text === 'string' &&
      payload.text.length > 0
    );
  }

  override async handle(context: HandlerContext) {
    const { request } = context;
    const id = request.payload?.id as string;
    const text = request.payload?.text as string;

    try {
      textStorage.store(id, text);
      console.log(`Stored text with id '${id}': ${text.substring(0, 50)}...`);

      return this.success('Text stored successfully', {
        id,
        textLength: text.length,
        totalStored: textStorage.size(),
      });
    } catch (error) {
      console.error('Error in StoreHandler:', error);
      return this.error(error instanceof Error ? error.message : 'Failed to store text');
    }
  }

  /**
   * Get the storage instance (useful for other handlers)
   */
  static getStorage(): TextStorage {
    return textStorage;
  }
}
