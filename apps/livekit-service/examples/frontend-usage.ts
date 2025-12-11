/**
 * Example: Using the Handler-Based Agent from Frontend
 *
 * This file demonstrates how to interact with the Story Time agent
 * from a web frontend using LiveKit RPC calls.
 */
import { Room } from 'livekit-client';

// Types matching the agent's handler interface
interface ActionRequest {
  action: string;
  payload?: Record<string, unknown>;
}

interface ActionResponse {
  success: boolean;
  message?: string;
  data?: unknown;
  error?: string;
}

/**
 * Helper class to interact with the Story Time agent
 */
export class StoryTimeAgent {
  private room: Room;
  private agentIdentity: string | null = null;

  constructor(room: Room) {
    this.room = room;
    this.findAgent();

    // Watch for agent joining/leaving
    this.room.on('participantConnected', () => this.findAgent());
    this.room.on('participantDisconnected', () => this.findAgent());
  }

  /**
   * Find the agent participant in the room
   */
  private findAgent(): void {
    const agent = Array.from(this.room.remoteParticipants.values()).find((p) => p.kind === 'agent');
    this.agentIdentity = agent?.identity ?? null;
  }

  /**
   * Check if agent is available
   */
  isAgentAvailable(): boolean {
    return this.agentIdentity !== null;
  }

  /**
   * Send an action to the agent
   */
  private async sendAction(request: ActionRequest): Promise<ActionResponse> {
    if (!this.agentIdentity) {
      throw new Error('Agent not found in room');
    }

    const responseStr = await this.room.localParticipant.performRpc({
      destinationIdentity: this.agentIdentity,
      method: 'processAction',
      payload: JSON.stringify(request),
    });

    return JSON.parse(responseStr) as ActionResponse;
  }

  /**
   * Make the agent say text
   */
  async say(text: string): Promise<ActionResponse> {
    return this.sendAction({
      action: 'say',
      payload: { text },
    });
  }

  /**
   * Store text with an ID
   */
  async store(id: string, text: string): Promise<ActionResponse> {
    return this.sendAction({
      action: 'store',
      payload: { id, text },
    });
  }

  /**
   * Play stored text by ID
   */
  async play(id: string): Promise<ActionResponse> {
    return this.sendAction({
      action: 'play',
      payload: { id },
    });
  }
}

// ============================================================================
// Usage Examples
// ============================================================================

/**
 * Example 1: Basic Usage
 */
export async function basicExample(room: Room) {
  const agent = new StoryTimeAgent(room);

  if (!agent.isAgentAvailable()) {
    console.log('Waiting for agent to join...');
    return;
  }

  // Make the agent say something
  const sayResponse = await agent.say('Hello! How can I help you today?');
  console.log('Say response:', sayResponse);
}

/**
 * Example 2: Store and Play Stories
 */
export async function storeAndPlayExample(room: Room) {
  const agent = new StoryTimeAgent(room);

  // Store multiple stories
  await agent.store('intro', 'Welcome to Story Time!');
  await agent.store('story1', 'Once upon a time, in a land far away, there lived a brave knight.');
  await agent.store('story2', 'The quick brown fox jumps over the lazy dog.');

  // Play a specific story
  const playResponse = await agent.play('story1');
  console.log('Play response:', playResponse);

  if (playResponse.success) {
    console.log('Now playing:', playResponse.data);
  } else {
    console.error('Failed to play story:', playResponse.error);
  }
}

/**
 * Example 3: Error Handling
 */
export async function errorHandlingExample(room: Room) {
  const agent = new StoryTimeAgent(room);

  try {
    // Try to play a story that doesn't exist
    const response = await agent.play('nonexistent-story');

    if (!response.success) {
      console.error('Error:', response.error);
      // Response might include available IDs
      if (response.data && 'availableIds' in (response.data as object)) {
        console.log(
          'Available stories:',
          (response.data as { availableIds: string[] }).availableIds,
        );
      }
    }
  } catch (error) {
    console.error('RPC call failed:', error);
  }
}

/**
 * Example 4: Interactive Story Manager
 */
export class InteractiveStoryManager {
  private agent: StoryTimeAgent;
  private stories: Map<string, string> = new Map();

  constructor(room: Room) {
    this.agent = new StoryTimeAgent(room);
  }

  async addStory(id: string, text: string): Promise<void> {
    const response = await this.agent.store(id, text);

    if (response.success) {
      this.stories.set(id, text);
      console.log(`✓ Story '${id}' added successfully`);
    } else {
      console.error(`✗ Failed to add story: ${response.error}`);
      throw new Error(response.error);
    }
  }

  async playStory(id: string): Promise<void> {
    const response = await this.agent.play(id);

    if (response.success) {
      console.log(`♪ Playing story '${id}'`);
    } else {
      console.error(`✗ Failed to play story: ${response.error}`);
      throw new Error(response.error);
    }
  }

  async announceStory(id: string): Promise<void> {
    const text = this.stories.get(id);
    if (text) {
      await this.agent.say(`Now playing: ${id}`);
      await this.playStory(id);
    }
  }

  getStoryIds(): string[] {
    return Array.from(this.stories.keys());
  }
}

/**
 * Example 5: React Hook (TypeScript definition)
 *
 * Note: This is a TypeScript example. To use it in a real React project:
 * 1. Rename this file to .tsx
 * 2. Add: import React from 'react';
 * 3. Use the hook in your React components
 */

// Example hook interface (implementation would be in a .tsx file)
export interface UseStoryTimeAgentResult {
  agent: StoryTimeAgent | null;
  isReady: boolean;
  say?: (text: string) => Promise<ActionResponse>;
  store?: (id: string, text: string) => Promise<ActionResponse>;
  play?: (id: string) => Promise<ActionResponse>;
}

// TypeScript definition of the hook
export type UseStoryTimeAgentHook = (room: Room | null) => UseStoryTimeAgentResult;

/**
 * Example implementation (would go in a .tsx file):
 *
 * export function useStoryTimeAgent(room: Room | null): UseStoryTimeAgentResult {
 *   const [agent, setAgent] = React.useState<StoryTimeAgent | null>(null);
 *   const [isReady, setIsReady] = React.useState(false);
 *
 *   React.useEffect(() => {
 *     if (!room) return;
 *     const agentInstance = new StoryTimeAgent(room);
 *     setAgent(agentInstance);
 *     setIsReady(agentInstance.isAgentAvailable());
 *
 *     const checkAgent = () => setIsReady(agentInstance.isAgentAvailable());
 *     room.on('participantConnected', checkAgent);
 *     room.on('participantDisconnected', checkAgent);
 *
 *     return () => {
 *       room.off('participantConnected', checkAgent);
 *       room.off('participantDisconnected', checkAgent);
 *     };
 *   }, [room]);
 *
 *   return {
 *     agent,
 *     isReady,
 *     say: agent?.say.bind(agent),
 *     store: agent?.store.bind(agent),
 *     play: agent?.play.bind(agent),
 *   };
 * }
 */
