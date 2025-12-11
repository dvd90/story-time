# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Story Time is a pnpm monorepo for building voice AI applications using LiveKit Agents. The repository contains three applications:

1. **client** - Next.js frontend with React for voice interaction UI
2. **server** - Simple Express.js REST API server
3. **story-time-server** - LiveKit Agents voice AI assistant (Node.js)

## LiveKit Documentation Access

**IMPORTANT**: This project heavily uses LiveKit APIs and SDKs. When working with LiveKit-related code or answering questions about LiveKit features, you MUST use the LiveKit Docs MCP server to access up-to-date documentation.

The LiveKit Docs MCP server should already be installed. If you need to access LiveKit documentation:
- Use the MCP tools to search and browse LiveKit documentation
- Look up API references for `@livekit/agents`, `@livekit/components-react`, `livekit-client`, etc.
- Check for the latest features and best practices
- Verify Node.js SDK feature availability

Key areas to reference via MCP:
- LiveKit Agents SDK documentation (models, tools, workflows, handoffs)
- LiveKit Client SDK for frontend implementation
- LiveKit Cloud features (inference, noise cancellation)
- Turn detection and VAD configuration
- Deployment and production guides

## Package Manager

This project uses **pnpm** as the package manager with workspaces. Always use `pnpm` commands, never `npm` or `yarn`.

## Common Commands

### Root level (runs across all workspaces):
- `pnpm install` - Install all dependencies for all workspaces
- `pnpm dev` - Run all apps in development mode in parallel
- `pnpm build` - Build all applications
- `pnpm start` - Start all applications in parallel
- `pnpm lint` - Lint all applications
- `pnpm clean` - Clean build artifacts from all workspaces

### Client app (`apps/client`):
- `pnpm dev` - Start Next.js dev server (http://localhost:3000)
- `pnpm build` - Build Next.js production bundle
- `pnpm start` - Start Next.js production server
- `pnpm lint` - Run ESLint

### Server app (`apps/server`):
- `pnpm dev` - Run Express server with tsx watch (hot reload)
- `pnpm build` - Compile TypeScript to dist/
- `pnpm start` - Run compiled server from dist/
- `pnpm lint` - Run ESLint on src/

### Story Time Server (LiveKit Agent) (`apps/story-time-server`):
- `pnpm run download-files` - **Must run before first use** - downloads required models (Silero VAD, LiveKit turn detector)
- `pnpm dev` - Run agent in development mode with hot reload
- `pnpm start` - Run agent in production mode (requires `pnpm build` first)
- `pnpm build` - Compile TypeScript
- `pnpm test` - Run tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier

## Architecture

### Client (Next.js Frontend)

- **Framework**: Next.js 15 with App Router
- **UI**: React 19, Tailwind CSS 4, Radix UI components
- **LiveKit**: Uses `@livekit/components-react` and `livekit-client` for real-time voice communication
- **Configuration**: [app-config.ts](apps/client/app-config.ts) defines app branding, features, and UI settings
- **Structure**:
  - `app/` - Next.js App Router pages and API routes
  - `components/` - Reusable React components (LiveKit components, UI primitives)
  - `hooks/` - Custom React hooks
  - `lib/` - Utility functions

**Key features configured in app-config.ts**:
- Chat input support
- Video input streaming
- Screen sharing
- Pre-connect buffer for smoother connections
- Customizable branding (logo, colors, button text)

### Server (Express API)

A minimal Express.js server providing REST API endpoints. Currently has:
- `/health` - Health check endpoint
- `/api/hello` - Basic API test endpoint

The server is TypeScript-based using ES modules and includes CORS support.

### Story Time Server (LiveKit Agent)

A voice AI assistant built with LiveKit Agents SDK for Node.js. This is the core AI logic that powers voice interactions.

**Architecture**:
- Entry point: [src/agent.ts](apps/story-time-server/src/agent.ts)
- Extends `voice.Agent` class from `@livekit/agents`
- Uses LiveKit Cloud inference for LLM, STT, and TTS
- Includes Silero VAD for voice activity detection
- Supports LiveKit turn detection for conversation flow
- Background voice cancellation enabled

**Key agent features**:
- System instructions define AI personality and behavior
- Tool calling support for extending capabilities
- Handoffs/workflows for complex multi-stage conversations
- Metrics and logging integration

**Important**: Always refer to [apps/story-time-server/AGENTS.md](apps/story-time-server/AGENTS.md) for detailed LiveKit Agents guidance. This includes information about:
- Project structure and conventions
- LiveKit documentation MCP server installation
- Handoffs/workflows best practices
- Feature parity notes between Node.js and Python SDKs

## Environment Configuration

All apps require environment variables. Each app has `.env.example` files to copy:

- **Client** (`.env.local`): LiveKit credentials (API key, secret, URL)
- **Server** (`.env`): PORT configuration (optional, defaults to 3001)
- **Story Time Server** (`.env.local`): LiveKit credentials for agent connection

Use LiveKit CLI for easy credential setup:
```bash
lk cloud auth
lk app env -w -d apps/story-time-server/.env.local
```

## Development Workflow

1. Install dependencies: `pnpm install` (from root)
2. Set up environment variables for each app
3. **For story-time-server**: Run `pnpm run download-files` once before first use
4. Start all apps: `pnpm dev` (from root) or start individual apps from their directories

## Code Style

- **Client**: Uses Prettier with sort-imports plugin, ESLint with Next.js config
- **Server**: Basic TypeScript/ESLint setup
- **Story Time Server**: Prettier and ESLint with strict formatting rules

Always run `pnpm format` and `pnpm lint` before committing in the story-time-server app.

## Important Notes

- The story-time-server is based on the LiveKit Agents Node.js template and includes deployment-ready Dockerfile
- Client app configuration is intentionally flexible via [app-config.ts](apps/client/app-config.ts) to support different use cases
- LiveKit Agents documentation evolves frequently - use LiveKit Docs MCP server for latest info
- Voice AI agents are latency-sensitive - use handoffs for complex multi-phase conversations rather than long instruction prompts
- Node.js SDK may have different feature availability than Python SDK - always verify in documentation
