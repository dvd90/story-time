import type { JobContext } from '@livekit/agents';
import type { voice } from '@livekit/agents';
import type { ActionHandler, ActionRequest, ActionResponse } from './base.js';

/**
 * Manages registration and routing of action handlers
 */
export class HandlerManager {
  private handlers: Map<string, ActionHandler> = new Map();
  private ctx: JobContext;
  private session: voice.AgentSession;
  private roomName: string;

  constructor(ctx: JobContext, session: voice.AgentSession, roomName: string) {
    this.ctx = ctx;
    this.session = session;
    this.roomName = roomName;
  }

  /**
   * Register an action handler
   * @param handler - The handler to register
   */
  register(handler: ActionHandler): void {
    if (this.handlers.has(handler.actionName)) {
      console.warn(`Handler for action '${handler.actionName}' is being overwritten`);
    }
    this.handlers.set(handler.actionName, handler);
    console.log(`Registered handler for action: ${handler.actionName}`);
  }

  /**
   * Register multiple handlers at once
   * @param handlers - Array of handlers to register
   */
  registerAll(handlers: ActionHandler[]): void {
    handlers.forEach((handler) => this.register(handler));
  }

  /**
   * Get a handler by action name
   * @param actionName - The name of the action
   * @returns The handler or undefined if not found
   */
  getHandler(actionName: string): ActionHandler | undefined {
    return this.handlers.get(actionName);
  }

  /**
   * Check if a handler exists for the given action
   * @param actionName - The name of the action
   * @returns true if handler exists
   */
  hasHandler(actionName: string): boolean {
    return this.handlers.has(actionName);
  }

  /**
   * Get all registered action names
   * @returns Array of action names
   */
  getActionNames(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Process an action request
   * @param request - The action request
   * @returns The action response
   */
  async processAction(request: ActionRequest): Promise<ActionResponse> {
    const handler = this.handlers.get(request.action);

    if (!handler) {
      return {
        success: false,
        error: `Unknown action: ${request.action}. Available actions: ${this.getActionNames().join(', ')}`,
      };
    }

    // Validate payload if handler provides validation
    if (handler.validate && !handler.validate(request.payload)) {
      return {
        success: false,
        error: `Invalid payload for action: ${request.action}`,
      };
    }

    try {
      return await handler.handle({
        ctx: this.ctx,
        session: this.session,
        request,
        roomName: this.roomName,
      });
    } catch (error) {
      console.error(
        `Error handling action '${request.action}':`,
        error instanceof Error ? error.message : error,
      );
      return {
        success: false,
        error: `Failed to execute action: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

}
