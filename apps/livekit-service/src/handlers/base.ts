import type { JobContext } from '@livekit/agents';
import type { voice } from '@livekit/agents';

/**
 * Action request structure sent from the frontend via RPC
 */
export interface ActionRequest {
  action: string;
  payload?: Record<string, unknown>;
}

/**
 * Action response structure returned to the frontend
 */
export interface ActionResponse {
  success: boolean;
  message?: string;
  data?: unknown;
  error?: string;
}

/**
 * Context provided to handlers for executing actions
 */
export interface HandlerContext {
  ctx: JobContext;
  session: voice.AgentSession;
  request: ActionRequest;
}

/**
 * Base interface for all action handlers
 */
export interface ActionHandler {
  /**
   * The name of the action this handler processes
   */
  readonly actionName: string;

  /**
   * Executes the action with the given context
   * @param context - The handler context containing session, request, etc.
   * @returns A promise that resolves to an action response
   */
  handle(context: HandlerContext): Promise<ActionResponse>;

  /**
   * Optional validation method to check if the request payload is valid
   * @param payload - The payload to validate
   * @returns true if valid, false otherwise
   */
  validate?(payload: Record<string, unknown> | undefined): boolean;
}

/**
 * Abstract base class for action handlers
 */
export abstract class BaseActionHandler implements ActionHandler {
  constructor(public readonly actionName: string) {}

  abstract handle(context: HandlerContext): Promise<ActionResponse>;

  validate?(payload: Record<string, unknown> | undefined): boolean;

  /**
   * Helper method to create a success response
   */
  protected success(message?: string, data?: unknown): ActionResponse {
    const response: ActionResponse = { success: true };
    if (message !== undefined) response.message = message;
    if (data !== undefined) response.data = data;
    return response;
  }

  /**
   * Helper method to create an error response
   */
  protected error(error: string, data?: unknown): ActionResponse {
    const response: ActionResponse = { success: false, error };
    if (data !== undefined) response.data = data;
    return response;
  }
}
