# Handler-Based Agent Architecture

This document describes the handler-based architecture implemented in the Story Time agent, which provides a flexible and extensible way to process actions from the frontend.

## Overview

The agent uses an abstract handler system that receives action requests via LiveKit RPC (Remote Procedure Calls) and routes them to appropriate handlers. This architecture makes it easy to add new capabilities without modifying the core agent code.

## Architecture Components

### 1. Base Handler Interface (`src/handlers/base.ts`)

The foundation of the system, providing:

- **`ActionHandler`**: Interface that all handlers must implement
- **`BaseActionHandler`**: Abstract base class with helper methods
- **`ActionRequest`**: Standardized request format
- **`ActionResponse`**: Standardized response format
- **`HandlerContext`**: Context passed to handlers (session, room, request)

### 2. Handler Manager (`src/handlers/manager.ts`)

The **`HandlerManager`** class orchestrates all handlers:

- Registers handlers by action name
- Routes incoming requests to the correct handler
- Validates payloads before execution
- Handles errors and returns formatted responses
- Creates RPC handler functions for LiveKit integration

### 3. Built-in Handlers

#### SayHandler (`src/handlers/say-handler.ts`)

Makes the agent speak text aloud.

**Action:** `say`

**Payload:**

```json
{
  "text": "Hello, this is the text to speak"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Text spoken successfully",
  "data": {
    "text": "Hello, this is the text to speak"
  }
}
```

#### StoreHandler (`src/handlers/store-handler.ts`)

Stores text with a unique ID for later retrieval.

**Action:** `store`

**Payload:**

```json
{
  "id": "story-1",
  "text": "Once upon a time..."
}
```

**Response:**

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

#### PlayHandler (`src/handlers/play-handler.ts`)

Retrieves stored text by ID and plays it aloud.

**Action:** `play`

**Payload:**

```json
{
  "id": "story-1"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Text played successfully",
  "data": {
    "id": "story-1",
    "text": "Once upon a time..."
  }
}
```

## How to Use from Frontend

### 1. Connect to the LiveKit Room

```typescript
import { Room } from 'livekit-client';

const room = new Room();
await room.connect(LIVEKIT_URL, token);
```

### 2. Call Actions via RPC

```typescript
// Find the agent participant
const agentParticipant = Array.from(room.remoteParticipants.values()).find((p) => p.isAgent);

if (!agentParticipant) {
  throw new Error('Agent not found');
}

// Make the agent say something
const sayResponse = await room.localParticipant.performRpc({
  destinationIdentity: agentParticipant.identity,
  method: 'processAction',
  payload: JSON.stringify({
    action: 'say',
    payload: {
      text: 'Hello from the frontend!',
    },
  }),
});

console.log(JSON.parse(sayResponse));

// Store a story
const storeResponse = await room.localParticipant.performRpc({
  destinationIdentity: agentParticipant.identity,
  method: 'processAction',
  payload: JSON.stringify({
    action: 'store',
    payload: {
      id: 'my-story',
      text: 'This is my amazing story...',
    },
  }),
});

// Play the stored story
const playResponse = await room.localParticipant.performRpc({
  destinationIdentity: agentParticipant.identity,
  method: 'processAction',
  payload: JSON.stringify({
    action: 'play',
    payload: {
      id: 'my-story',
    },
  }),
});
```

### 3. Handle Responses

All responses follow this format:

```typescript
interface ActionResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}
```

Example error response:

```json
{
  "success": false,
  "error": "No text found with id: invalid-id",
  "data": {
    "id": "invalid-id",
    "availableIds": ["my-story", "story-1"]
  }
}
```

## Creating Custom Handlers

### Step 1: Create Handler Class

Create a new file in `src/handlers/`:

```typescript
import { BaseActionHandler, type HandlerContext } from './base.js';

export class CustomHandler extends BaseActionHandler {
  constructor() {
    super('customAction'); // Action name
  }

  // Optional: Validate the payload
  validate(payload: Record<string, unknown> | undefined): boolean {
    if (!payload) return false;
    // Add your validation logic
    return typeof payload.someField === 'string';
  }

  // Required: Handle the action
  async handle(context: HandlerContext) {
    const { session, ctx, request } = context;
    const { payload } = request;

    try {
      // Your custom logic here
      // You can:
      // - Use session.say() to make the agent speak
      // - Access ctx.room for room operations
      // - Call external APIs
      // - Update databases
      // - Anything else!

      return this.success('Action completed', { result: 'data' });
    } catch (error) {
      return this.error(error instanceof Error ? error.message : 'Failed');
    }
  }
}
```

### Step 2: Register the Handler

In `src/agent.ts`, add your handler to the registration:

```typescript
import { CustomHandler } from './handlers/custom-handler.js';

// In the entry function:
handlerManager.registerAll([
  new SayHandler(),
  new StoreHandler(),
  new PlayHandler(),
  new CustomHandler(), // Add your handler here
]);
```

### Step 3: Export from Index

Add to `src/handlers/index.ts`:

```typescript
export * from './custom-handler.js';
```

## Advanced Use Cases

### Accessing Storage from Other Handlers

The `StoreHandler` provides access to the shared storage:

```typescript
import { StoreHandler } from './store-handler.js';

// In your handler
const storage = StoreHandler.getStorage();
const text = storage.get('some-id');
```

### Using Session Methods

The `HandlerContext` provides access to the `AgentSession`:

```typescript
async handle(context: HandlerContext) {
  const { session } = context;

  // Make the agent speak
  await session.say('Hello!');

  // Generate a reply based on user input
  await session.generateReply({ userInput: 'What is the weather?' });

  // Interrupt current speech
  session.interrupt();
}
```

### Accessing Room State

Use the `JobContext` to interact with the room:

```typescript
async handle(context: HandlerContext) {
  const { ctx } = context;

  // Access room participants
  const participants = ctx.room.remoteParticipants;

  // Get room metadata
  const metadata = ctx.room.metadata;

  // Use RPC to call methods on other participants
  if (ctx.room.localParticipant) {
    await ctx.room.localParticipant.performRpc({
      destinationIdentity: 'some-participant',
      method: 'someMethod',
      payload: 'data',
    });
  }
}
```

## Error Handling

The system provides automatic error handling:

1. **Invalid JSON**: Returns error if RPC payload is not valid JSON
2. **Unknown Action**: Returns error with list of available actions
3. **Validation Failure**: Returns error if payload validation fails
4. **Execution Error**: Catches exceptions and returns formatted error response

## Best Practices

1. **Keep Handlers Focused**: Each handler should do one thing well
2. **Validate Input**: Always implement the `validate` method
3. **Use Helper Methods**: Use `this.success()` and `this.error()` for consistent responses
4. **Log Operations**: Use console.log for debugging and monitoring
5. **Handle Async Operations**: All handlers are async, use await for promises
6. **Return Meaningful Data**: Include relevant information in response data
7. **Consider Storage**: Use shared storage for cross-handler state
8. **Test Thoroughly**: Test with various payloads and error conditions

## Example: Complete Custom Handler

```typescript
import { BaseActionHandler, type HandlerContext } from './base.js';
import { StoreHandler } from './store-handler.js';

/**
 * Lists all stored stories
 */
export class ListHandler extends BaseActionHandler {
  constructor() {
    super('list');
  }

  validate(payload: Record<string, unknown> | undefined): boolean {
    // No payload required for list action
    return true;
  }

  async handle(context: HandlerContext) {
    try {
      const storage = StoreHandler.getStorage();
      const stories = storage.list();

      if (stories.length === 0) {
        await context.session.say('You have no stored stories yet.');
        return this.success('No stories found', { stories: [] });
      }

      const storyList = stories.map((s, i) => `${i + 1}. ${s.id}`).join(', ');

      await context.session.say(`You have ${stories.length} stored stories: ${storyList}`);

      return this.success('Stories listed', {
        count: stories.length,
        stories: stories.map((s) => ({ id: s.id, length: s.text.length })),
      });
    } catch (error) {
      return this.error(error instanceof Error ? error.message : 'Failed to list stories');
    }
  }
}
```

## Testing

To test your handlers:

1. Start the agent: `pnpm dev`
2. Connect from frontend
3. Send RPC calls with different payloads
4. Check console output for logs
5. Verify responses match expected format

## Future Enhancements

Potential additions to the handler system:

- **Middleware**: Pre/post-processing for all handlers
- **Rate Limiting**: Prevent abuse of certain actions
- **Permission System**: Role-based access to actions
- **Async Events**: Handlers that emit events to frontend
- **Persistent Storage**: Database integration for StoreHandler
- **Handler Composition**: Chain multiple handlers together
- **Metrics Collection**: Track handler usage and performance
