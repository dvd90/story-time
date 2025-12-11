<a href="https://livekit.io/">
  <img src="./.github/assets/livekit-mark.png" alt="LiveKit logo" width="100" height="100">
</a>

# Story Time Server - Handler-Based Voice AI Agent

A flexible, extensible LiveKit Agents voice AI assistant built with a **handler-based architecture** for processing actions from frontend applications via **data events**.

## What's Different About This Agent?

This is not just a standard voice assistant - it features an **abstract handler system** with **room event subscriptions**:

- ✅ Receives action requests via LiveKit data events (pub/sub pattern)
- ✅ Routes actions to appropriate handlers dynamically
- ✅ Makes it trivial to add new capabilities without touching core agent code
- ✅ Includes three built-in handlers: `say`, `store`, and `play`
- ✅ Provides a clean, type-safe API for frontend integration
- ✅ Session management with registry pattern
- ✅ Clean lifecycle management with proper cleanup

## Built-in Features

- **Say Handler**: Make the agent speak any text on demand
- **Store Handler**: Store text with unique IDs for later retrieval (in-memory storage)
- **Play Handler**: Retrieve and play stored text by ID
- **Voice AI Pipeline**: Uses OpenAI, Cartesia, and AssemblyAI via [LiveKit Inference](https://docs.livekit.io/agents/models)
- [LiveKit Turn Detector](https://docs.livekit.io/agents/build/turns/turn-detector/) for contextually-aware speaker detection
- [Background voice cancellation](https://docs.livekit.io/home/cloud/noise-cancellation/)
- Integrated [metrics and logging](https://docs.livekit.io/agents/build/metrics/)
- Production-ready Dockerfile

This agent is compatible with any [custom web/mobile frontend](https://docs.livekit.io/agents/start/frontend/) or [SIP-based telephony](https://docs.livekit.io/agents/start/telephony/).

## Coding agents and MCP

This project is designed to work with coding agents like [Cursor](https://www.cursor.com/) and [Claude Code](https://www.anthropic.com/claude-code).

To get the most out of these tools, install the [LiveKit Docs MCP server](https://docs.livekit.io/mcp).

For Cursor, use this link:

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-light.svg)](https://cursor.com/en-US/install-mcp?name=livekit-docs&config=eyJ1cmwiOiJodHRwczovL2RvY3MubGl2ZWtpdC5pby9tY3AifQ%3D%3D)

For Claude Code, run this command:

```
claude mcp add --transport http livekit-docs https://docs.livekit.io/mcp
```

For Codex CLI, use this command to install the server:

```
codex mcp add --url https://docs.livekit.io/mcp livekit-docs
```

For Gemini CLI, use this command to install the server:

```
gemini mcp add --transport http livekit-docs https://docs.livekit.io/mcp
```

The project includes a complete [AGENTS.md](AGENTS.md) file for these assistants. You can modify this file to suit your needs. To learn more about this file, see [https://agents.md](https://agents.md).

## Dev Setup

This project uses [pnpm](https://pnpm.io/) as the package manager.

Clone the repository and install dependencies:

```console
cd agent-starter-node
pnpm install
```

Sign up for [LiveKit Cloud](https://cloud.livekit.io/) then set up the environment by copying `.env.example` to `.env.local` and filling in the required keys:

- `LIVEKIT_URL`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`

You can load the LiveKit environment automatically using the [LiveKit CLI](https://docs.livekit.io/home/cli/cli-setup):

```bash
lk cloud auth
lk app env -w -d .env.local
```

## Run the agent

Before your first run, you must download certain models such as [Silero VAD](https://docs.livekit.io/agents/build/turns/vad/) and the [LiveKit turn detector](https://docs.livekit.io/agents/build/turns/turn-detector/):

```console
pnpm run download-files
```

To run the agent during development, use the `dev` command:

```console
pnpm run dev
```

In production, use the `start` command:

```console
pnpm run start
```

## Frontend & Telephony

Get started quickly with our pre-built frontend starter apps, or add telephony support:

| Platform         | Link                                                                                                                | Description                                        |
| ---------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| **Web**          | [`livekit-examples/agent-starter-react`](https://github.com/livekit-examples/agent-starter-react)                   | Web voice AI assistant with React & Next.js        |
| **iOS/macOS**    | [`livekit-examples/agent-starter-swift`](https://github.com/livekit-examples/agent-starter-swift)                   | Native iOS, macOS, and visionOS voice AI assistant |
| **Flutter**      | [`livekit-examples/agent-starter-flutter`](https://github.com/livekit-examples/agent-starter-flutter)               | Cross-platform voice AI assistant app              |
| **React Native** | [`livekit-examples/voice-assistant-react-native`](https://github.com/livekit-examples/voice-assistant-react-native) | Native mobile app with React Native & Expo         |
| **Android**      | [`livekit-examples/agent-starter-android`](https://github.com/livekit-examples/agent-starter-android)               | Native Android app with Kotlin & Jetpack Compose   |
| **Web Embed**    | [`livekit-examples/agent-starter-embed`](https://github.com/livekit-examples/agent-starter-embed)                   | Voice AI widget for any website                    |
| **Telephony**    | [📚 Documentation](https://docs.livekit.io/agents/start/telephony/)                                                 | Add inbound or outbound calling to your agent      |

For advanced customization, see the [complete frontend guide](https://docs.livekit.io/agents/start/frontend/).

## Handler-Based Architecture

### Using from Frontend

Quick example of calling actions from your web app:

```typescript
import { Room } from 'livekit-client';

// Connect to the room
const room = new Room();
await room.connect(LIVEKIT_URL, token);

// Find the agent
const agent = Array.from(room.remoteParticipants.values()).find((p) => p.kind === 'agent');

// Make the agent say something
const response = await room.localParticipant.performRpc({
  destinationIdentity: agent.identity,
  method: 'processAction',
  payload: JSON.stringify({
    action: 'say',
    payload: { text: 'Hello from the frontend!' },
  }),
});

console.log(JSON.parse(response)); // { success: true, ... }
```

### Built-in Actions

| Action  | Description               | Payload                        |
| ------- | ------------------------- | ------------------------------ |
| `say`   | Make the agent speak text | `{ text: string }`             |
| `store` | Store text with an ID     | `{ id: string, text: string }` |
| `play`  | Play stored text by ID    | `{ id: string }`               |

### Creating Custom Handlers

Add new capabilities by creating a handler:

```typescript
// src/handlers/my-handler.ts
import { BaseActionHandler, type HandlerContext } from './base.js';

export class MyHandler extends BaseActionHandler {
  constructor() {
    super('myAction');
  }

  async handle(context: HandlerContext) {
    const { session } = context;
    await session.say('Handling my custom action!');
    return this.success('Done!');
  }
}
```

Register it in `src/agent.ts`:

```typescript
handlerManager.registerAll([
  new SayHandler(),
  new StoreHandler(),
  new PlayHandler(),
  new MyHandler(), // Add here
]);
```

### Documentation

- **[HANDLERS.md](./HANDLERS.md)**: Complete handler system documentation with examples
- **[examples/frontend-usage.ts](./examples/frontend-usage.ts)**: Frontend integration guide with React hooks
- **[AGENTS.md](./AGENTS.md)**: General LiveKit Agents guidance

### Project Structure

```
src/
├── agent.ts              # Main agent entry point
└── handlers/
    ├── base.ts          # Base handler interface
    ├── manager.ts       # Handler registration & routing
    ├── say-handler.ts   # Built-in: say action
    ├── store-handler.ts # Built-in: store action
    ├── play-handler.ts  # Built-in: play action
    └── index.ts         # Exports
```

## Deploying to production

This project is production-ready and includes a working `Dockerfile`. To deploy it to LiveKit Cloud or another environment, see the [deploying to production](https://docs.livekit.io/agents/ops/deployment/) guide.

## Self-hosted LiveKit

You can also self-host LiveKit instead of using LiveKit Cloud. See the [self-hosting](https://docs.livekit.io/home/self-hosting/) guide for more information. If you choose to self-host, you'll need to also use [model plugins](https://docs.livekit.io/agents/models/#plugins) instead of LiveKit Inference and will need to remove the [LiveKit Cloud noise cancellation](https://docs.livekit.io/home/cloud/noise-cancellation/) plugin.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
