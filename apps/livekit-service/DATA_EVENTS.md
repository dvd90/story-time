## Data Event Architecture

This document describes how the Story Time agent uses LiveKit data events instead of RPC for communication with the frontend.

## Overview

The agent now uses **room data events** (`dataReceived`) to receive action requests from the frontend, instead of RPC calls. This provides:

- ✅ Better alignment with LiveKit's real-time architecture
- ✅ Automatic pub/sub pattern for multiple participants
- ✅ Topic-based message routing
- ✅ Simpler message handling

## Architecture Components

### 1. Agent Session Manager

**File:** `src/managers/agent-session-manager.ts`

Manages the complete lifecycle of an agent session:

- Creates and configures the voice pipeline (STT, LLM, TTS)
- Sets up metrics collection
- Registers the session in the session registry
- Subscribes to room events
- Handles cleanup on shutdown

**Usage:**
```typescript
const sessionManager = new AgentSessionManager(ctx, sessionRegistry);
await sessionManager.initialize();
```

### 2. Room Event Handler

**File:** `src/managers/room-event-handler.ts`

Handles incoming data packets from participants and routes them to appropriate handlers:

- Subscribes to room `dataReceived` events
- Parses incoming JSON action requests
- Routes actions to the handler manager
- Sends responses back to the participant via `publishData`

**Key Methods:**
- `subscribeToEvents()` - Start listening to data events
- `unsubscribeFromEvents()` - Stop listening to events
- `handleDataReceived()` - Process incoming data packets
- `sendResponse()` - Send response to participant

### 3. Session Registry

**File:** `src/managers/session-registry.ts`

A singleton registry that stores active sessions by room name:

- Maps room names to session contexts
- Allows looking up sessions across the application
- Automatically cleaned up on shutdown

**Usage:**
```typescript
// Register a session
sessionRegistry.register(roomName, { session, agent, ctx });

// Get a session
const context = sessionRegistry.get(roomName);

// Check if exists
if (sessionRegistry.has(roomName)) {
  // ...
}
```

## Frontend Integration

### Sending Actions to the Agent

Instead of using `performRpc`, use `publishData`:

```typescript
import { Room, DataPacket_Kind } from 'livekit-client';

const room = new Room();
await room.connect(LIVEKIT_URL, token);

// Create action request
const request = {
  action: 'say',
  payload: {
    text: 'Hello from the frontend!'
  }
};

// Send to agent
const encoder = new TextEncoder();
const data = encoder.encode(JSON.stringify(request));

await room.localParticipant.publishData(data, {
  reliable: true,
  destinationIdentities: [], // Empty = send to all (including agent)
});
```

### Receiving Responses from the Agent

Subscribe to the `action-response` topic:

```typescript
room.on('dataReceived', (payload: Uint8Array, participant, kind, topic) => {
  // Only handle responses
  if (topic !== 'action-response') return;

  const decoder = new TextDecoder();
  const responseStr = decoder.decode(payload);
  const response = JSON.parse(responseStr);

  console.log('Response from agent:', response);

  if (response.success) {
    console.log('Action succeeded:', response.data);
  } else {
    console.error('Action failed:', response.error);
  }
});
```

## Request/Response Format

### Request Format

```typescript
interface ActionRequest {
  action: string;
  payload?: Record<string, unknown>;
}
```

**Example:**
```json
{
  "action": "store",
  "payload": {
    "id": "story-1",
    "text": "Once upon a time..."
  }
}
```

### Response Format

```typescript
interface ActionResponse {
  success: boolean;
  message?: string;
  data?: unknown;
  error?: string;
}
```

**Success Example:**
```json
{
  "success": true,
  "message": "Text stored successfully",
  "data": {
    "id": "story-1",
    "textLength": 19,
    "totalStored": 1
  }
}
```

**Error Example:**
```json
{
  "success": false,
  "error": "No text found with id: invalid-id",
  "data": {
    "availableIds": ["story-1", "story-2"]
  }
}
```

## Complete Frontend Example

```typescript
import { Room, RoomEvent } from 'livekit-client';

class StoryTimeClient {
  private room: Room;

  constructor(room: Room) {
    this.room = room;
    this.setupResponseListener();
  }

  private setupResponseListener(): void {
    this.room.on(RoomEvent.DataReceived, (payload, participant, kind, topic) => {
      if (topic !== 'action-response') return;

      const decoder = new TextDecoder();
      const response = JSON.parse(decoder.decode(payload));

      console.log('Agent response:', response);
    });
  }

  async sendAction(action: string, payload?: Record<string, unknown>): Promise<void> {
    const request = { action, payload };
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(request));

    await this.room.localParticipant.publishData(data, {
      reliable: true,
    });
  }

  async say(text: string): Promise<void> {
    await this.sendAction('say', { text });
  }

  async store(id: string, text: string): Promise<void> {
    await this.sendAction('store', { id, text });
  }

  async play(id: string): Promise<void> {
    await this.sendAction('play', { id });
  }
}

// Usage
const room = new Room();
await room.connect(LIVEKIT_URL, token);

const client = new StoryTimeClient(room);
await client.say('Hello!');
await client.store('story-1', 'Once upon a time...');
await client.play('story-1');
```

## Benefits of Data Events vs RPC

### Data Events (Current)
- ✅ Native pub/sub pattern
- ✅ Topic-based routing
- ✅ Works with multiple participants
- ✅ Lower latency for broadcast messages
- ✅ Better for real-time scenarios
- ✅ Simpler message flow

### RPC (Previous)
- ✅ Request/response pattern built-in
- ✅ Automatic error handling
- ✅ Timeouts
- ❌ More complex for pub/sub
- ❌ Requires destination identity
- ❌ Not ideal for broadcasts

## Error Handling

The system handles various error scenarios:

1. **Invalid JSON**: Returns error response
2. **Missing action field**: Returns error with validation message
3. **Unknown action**: Handler manager returns available actions
4. **Handler execution error**: Caught and returned as error response
5. **Missing participant identity**: Logged, response not sent

All errors are logged to the console for debugging.

## Session Lifecycle

1. **Initialization**
   - Agent connects to room
   - Voice pipeline is created
   - Session is registered
   - Event handler subscribes to data events

2. **Active**
   - Processes incoming data events
   - Routes to handlers
   - Sends responses

3. **Shutdown**
   - Unsubscribes from events
   - Logs usage metrics
   - Unregisters session
   - Cleans up resources

## Debugging

Enable detailed logging:

```typescript
// In room-event-handler.ts
console.log(`Received data from ${data.participant?.identity}: ${payload}`);
console.log(`Processing action: ${request.action}`);
console.log(`Sent response to ${participantIdentity}`);
```

Check these logs when debugging:
- "Subscribed to data events for room: X"
- "Received data from [identity]: [payload]"
- "Processing action: [action]"
- "Sent response to [identity]"
- "Handlers registered for room X: [actions]"

## Testing

Test the data event flow:

```bash
# Start the agent
pnpm dev

# In another terminal, use lk CLI
lk room create test-room
lk room join test-room

# Send test data (requires client-side script)
# Or use the frontend client
```

## Migration from RPC

If migrating from RPC:

1. Replace `performRpc` calls with `publishData`
2. Add response listener with `room.on('dataReceived')`
3. Remove `registerRpcMethod` from agent code
4. Use data events subscription instead

**Before (RPC):**
```typescript
const response = await room.localParticipant.performRpc({
  destinationIdentity: agent.identity,
  method: 'processAction',
  payload: JSON.stringify(request)
});
```

**After (Data Events):**
```typescript
await room.localParticipant.publishData(
  encoder.encode(JSON.stringify(request)),
  { reliable: true }
);
```

## Best Practices

1. **Always use reliable delivery** for action requests
2. **Subscribe to responses early** in your initialization
3. **Handle missing responses** with timeouts
4. **Log all actions** for debugging
5. **Validate payloads** on both sides
6. **Use topic filtering** for different message types
7. **Clean up listeners** on disconnect

## Troubleshooting

### Agent not receiving messages

1. Check agent is connected to room
2. Verify data is being sent reliably
3. Check console logs for subscription messages
4. Ensure JSON is valid

### Responses not received

1. Check response listener is registered
2. Verify topic filter matches 'action-response'
3. Check participant identity is available
4. Look for errors in agent logs

### Performance issues

1. Use `reliable: false` for non-critical messages
2. Batch multiple actions if possible
3. Check network latency
4. Monitor message sizes
