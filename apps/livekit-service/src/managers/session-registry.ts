import type { SessionContext } from './agent-session-manager.js';

/**
 * Registry for managing active agent sessions
 */
export class SessionRegistry {
  private sessions: Map<string, SessionContext> = new Map();

  /**
   * Register a session
   */
  register(roomName: string, context: SessionContext): void {
    if (this.sessions.has(roomName)) {
      console.warn(`Session for room '${roomName}' is being overwritten`);
    }
    this.sessions.set(roomName, context);
    console.log(`Registered session for room: ${roomName}`);
  }

  /**
   * Unregister a session
   */
  unregister(roomName: string): void {
    if (this.sessions.delete(roomName)) {
      console.log(`Unregistered session for room: ${roomName}`);
    }
  }

  /**
   * Get a session by room name
   */
  get(roomName: string): SessionContext | undefined {
    return this.sessions.get(roomName);
  }

  /**
   * Check if a session exists
   */
  has(roomName: string): boolean {
    return this.sessions.has(roomName);
  }

  /**
   * Get all room names
   */
  getRoomNames(): string[] {
    return Array.from(this.sessions.keys());
  }

  /**
   * Get the number of active sessions
   */
  size(): number {
    return this.sessions.size;
  }

  /**
   * Clear all sessions
   */
  clear(): void {
    this.sessions.clear();
  }
}

// Singleton instance
export const sessionRegistry = new SessionRegistry();
