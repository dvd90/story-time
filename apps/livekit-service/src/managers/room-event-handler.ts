import type { JobContext } from '@livekit/agents';
import type { voice } from '@livekit/agents';
import { PlayHandler, SayHandler, StoreHandler } from '../handlers/index.js';
import { HandlerManager } from '../handlers/manager.js';

/**
 * Data packet structure
 */
interface DataPacket {
  payload: Uint8Array;
  participant?: {
    identity?: string;
  };
  topic?: string;
}

/**
 * Room event handler context
 */
export interface RoomEventContext {
  session: voice.AgentSession;
  agent: voice.Agent;
  ctx: JobContext;
  roomName: string;
  room: JobContext['room'];
}

/**
 * Handles room events and routes data messages to appropriate handlers
 */
export class RoomEventHandler {
  private context: RoomEventContext;
  private isSubscribed = false;
  private boundHandleDataReceived: (
    payload: Uint8Array,
    participant?: any,
    kind?: any,
    topic?: string,
  ) => Promise<void>;
  private handlerManager: HandlerManager;

  constructor(context: RoomEventContext) {
    this.context = context;
    this.boundHandleDataReceived = this.handleDataReceived.bind(this);

    // Initialize handler manager
    this.handlerManager = new HandlerManager(context.ctx, context.session);
    this.registerHandlers();
  }

  /**
   * Register all action handlers
   */
  private registerHandlers(): void {
    this.handlerManager.registerAll([new SayHandler(), new StoreHandler(), new PlayHandler()]);

    console.log(
      `Handlers registered for room ${this.context.roomName}: ${this.handlerManager.getActionNames().join(', ')}`,
    );
  }

  /**
   * Subscribe to room events
   */
  subscribeToEvents(): void {
    if (this.isSubscribed) {
      console.warn(`Already subscribed to events for room: ${this.context.roomName}`);
      return;
    }

    this.context.room.on('dataReceived', this.boundHandleDataReceived);
    this.isSubscribed = true;
    console.log(`Subscribed to data events for room: ${this.context.roomName}`);
  }

  /**
   * Unsubscribe from room events
   */
  unsubscribeFromEvents(): void {
    if (!this.isSubscribed) {
      return;
    }

    this.context.room.off('dataReceived', this.boundHandleDataReceived);
    this.isSubscribed = false;
    console.log(`Unsubscribed from events for room: ${this.context.roomName}`);
  }

  /**
   * Handle incoming data packets
   */
  private async handleDataReceived(
    payload: Uint8Array,
    participant?: any,
    kind?: any,
    topic?: string,
  ): Promise<void> {
    try {
      // Parse the data payload
      const decoder = new TextDecoder();
      const payloadStr = decoder.decode(payload);

      console.log(`Received data from ${participant?.identity ?? 'unknown'}: ${payloadStr}`);

      // Parse the action request
      let request;
      try {
        request = JSON.parse(payloadStr);
      } catch (parseError) {
        console.error('Failed to parse data packet as JSON:', parseError);
        await this.sendResponse(participant?.identity, {
          success: false,
          error: 'Invalid JSON payload',
        });
        return;
      }

      // Validate request structure
      if (!request.action) {
        await this.sendResponse(participant?.identity, {
          success: false,
          error: 'Missing action field in request',
        });
        return;
      }

      // Process the action
      const response = await this.handlerManager.processAction(request);

      // Send response back to the participant
      await this.sendResponse(participant?.identity, response);
    } catch (error) {
      console.error('Error handling data received:', error);
      await this.sendResponse(participant?.identity, {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Send a response back to the participant
   */
  private async sendResponse(participantIdentity: string | undefined, response: unknown): Promise<void> {
    try {
      const responseStr = JSON.stringify(response);
      const encoder = new TextEncoder();
      const responseData = encoder.encode(responseStr);

      if (!participantIdentity) {
        console.error('Cannot send response: participant identity is missing');
        return;
      }

      // Send response to the specific participant
      await this.context.room.localParticipant?.publishData(responseData, {
        destination_identities: [participantIdentity],
        topic: 'action-response',
      });

      console.log(`Sent response to ${participantIdentity}`);
    } catch (error) {
      console.error('Error sending response:', error);
    }
  }
}
