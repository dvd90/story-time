# 🌙 Story Time - Parent Voice Storytime

> **Bringing parents' bedtime stories to life, even when they can't be there.**

[![Demo Video](https://img.shields.io/badge/Demo-Watch%20Video-red?style=for-the-badge&logo=youtube)](YOUR_VIDEO_LINK_HERE)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-black?style=for-the-badge&logo=github)](https://github.com/dvd90/story-time)

---

## 📖 Project Overview

### The Problem

Bedtime stories are a cherished bonding moment between parents and children. But what happens when parents travel for work, work late shifts, or simply can't be there at bedtime? Children miss out on hearing their parent's comforting voice during one of the most important moments of their day.

### Our Solution

**Story Time** is an AI-powered application that lets parents clone their voice and create personalized bedtime stories for their children. Even when a parent can't physically be present, their voice can still tuck their child in with a custom story tailored to the child's interests and preferences.

**Key Features:**
- 🎙️ **Voice Cloning**: Parents record their voice once, and the app uses AI to narrate stories in their unique voice
- 👶 **Personalized Stories**: Stories are generated based on the child's name, age, and interests captured during onboarding
- 🎭 **Interactive Experience**: Children can request what kind of story they want (dinosaurs, space adventures, princesses, etc.)
- 🔊 **Real-Time Audio**: Powered by LiveKit for seamless, low-latency voice streaming
- 🔐 **Secure Authentication**: Parent accounts secured with Clerk authentication

---

## 👥 Team Information

| Role | Name | Responsibilities |
|------|------|------------------|
| **Backend & Glue** | *[Team Member Name]* | API development, database integration, system orchestration |
| **Frontend & Avatar** | *[Team Member Name]* | React UI, user experience, visual design |
| **Story Logic & LLM** | *[Team Member Name]* | AI story generation, prompt engineering, content logic |
| **LiveKit & Voice** | *[Team Member Name]* | Real-time audio, voice cloning integration, TTS/STT |

---

## 🛠️ Tech Stack

### Frontend
- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - UI library
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Radix UI](https://www.radix-ui.com/)** - Accessible component primitives
- **[Motion](https://motion.dev/)** - Animation library

### Backend
- **[Express.js](https://expressjs.com/)** - Node.js web framework
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[MongoDB](https://www.mongodb.com/)** with **[Mongoose](https://mongoosejs.com/)** - Database & ODM

### Real-Time Voice & AI
- **[LiveKit](https://livekit.io/)** - Real-time audio/video infrastructure
  - `@livekit/agents` - Voice AI agent framework
  - `@livekit/components-react` - React components for LiveKit
  - `livekit-client` - Client SDK
- **[Anam AI](https://www.anam.ai/)** - Voice cloning technology
- **[ElevenLabs](https://elevenlabs.io/)** - Text-to-Speech API
- **[Silero VAD](https://github.com/snakers4/silero-vad)** - Voice Activity Detection

### Authentication & Security
- **[Clerk](https://clerk.com/)** - User authentication and management

### Development Tools
- **[pnpm](https://pnpm.io/)** - Fast, disk space efficient package manager
- **[tsx](https://github.com/privatenumber/tsx)** - TypeScript execution
- **[ESLint](https://eslint.org/)** & **[Prettier](https://prettier.io/)** - Code quality

---

## 📁 Project Structure

```
story-time/
├── apps/
│   ├── client/              # Next.js frontend application
│   │   ├── app/             # App Router pages & API routes
│   │   ├── components/      # React components (LiveKit, onboarding, UI)
│   │   └── hooks/           # Custom React hooks
│   │
│   ├── server/              # Express.js REST API
│   │   └── src/
│   │       ├── db/          # MongoDB models & connection
│   │       ├── routes/      # API endpoints (onboarding, story, voice)
│   │       └── middleware/  # Auth middleware
│   │
│   └── livekit-service/     # LiveKit Agents voice AI service
│       └── src/
│           ├── agent.ts     # Main agent entry point
│           ├── handlers/    # Event handlers (voice, play, say, store)
│           └── managers/    # Session & room management
│
├── packages/                # Shared libraries (future use)
├── CLAUDE.md               # AI assistant context
└── spec.md                 # Product specification
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 22.0.0
- **pnpm** >= 9.0.0
- **MongoDB** instance (local or Atlas)
- **LiveKit Cloud** account (or self-hosted LiveKit server)
- **Clerk** account for authentication
- **ElevenLabs** API key (for TTS)
- **Anam AI** API key (for voice cloning)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/dvd90/story-time.git
   cd story-time
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment variables**

   Copy the example env files and fill in your credentials:

   ```bash
   # Client app
   cp apps/client/.env.example apps/client/.env.local

   # Server app
   cp apps/server/.env.example apps/server/.env

   # LiveKit service
   cp apps/livekit-service/.env.example apps/livekit-service/.env.local
   ```

   **Client** (`apps/client/.env.local`):
   ```env
   LIVEKIT_API_KEY=your_api_key
   LIVEKIT_API_SECRET=your_api_secret
   LIVEKIT_URL=wss://your-livekit-url
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
   CLERK_SECRET_KEY=your_clerk_secret
   ```

   **Server** (`apps/server/.env`):
   ```env
   PORT=3001
   MONGODB_URI=mongodb://localhost:27017/storytime
   CLERK_SECRET_KEY=your_clerk_secret
   ELEVENLABS_API_KEY=your_elevenlabs_key
   ```

   **LiveKit Service** (`apps/livekit-service/.env.local`):
   ```env
   LIVEKIT_API_KEY=your_api_key
   LIVEKIT_API_SECRET=your_api_secret
   LIVEKIT_URL=wss://your-livekit-url
   ```

   > 💡 **Tip**: Use LiveKit CLI for easy setup:
   > ```bash
   > lk cloud auth
   > lk app env -w -d apps/livekit-service/.env.local
   > ```

4. **Download required models** (for LiveKit service)
   ```bash
   cd apps/livekit-service
   pnpm run download-files
   ```

5. **Start the development servers**
   ```bash
   # From root directory - starts all apps
   pnpm dev
   ```

   Or start individually:
   ```bash
   # Terminal 1 - Client (http://localhost:3000)
   cd apps/client && pnpm dev

   # Terminal 2 - Server (http://localhost:3001)
   cd apps/server && pnpm dev

   # Terminal 3 - LiveKit Service
   cd apps/livekit-service && pnpm dev
   ```

---

## 🎬 Demo Video

[![Watch the Demo](https://img.shields.io/badge/▶️%20Watch%20Demo-Click%20Here-blue?style=for-the-badge)](YOUR_VIDEO_LINK_HERE)

*A 2-minute walkthrough showing:*
1. Parent onboarding and voice recording
2. Voice profile creation with Anam AI
3. Child entering the story room
4. Personalized story generation and narration in the parent's cloned voice

---

## 📋 How It Works

### Scenario 1: Parent Onboarding
1. Parent signs in with Clerk authentication
2. Joins a LiveKit onboarding room
3. Speaks about themselves and their child (interests, personality, etc.)
4. Reviews and approves the transcription
5. Records a clean voice sample for cloning
6. Voice profile is created via Anam AI and saved

### Scenario 2: Story Time
1. Returning parent/child starts a story session
2. System loads the parent's voice profile
3. AI agent (speaking in parent's voice) asks the child what story they want
4. Child requests a theme (dinosaurs, space, magic, etc.)
5. LLM generates a personalized story using child's profile data
6. Story is narrated in the parent's cloned voice via ElevenLabs TTS

---

## 🔧 Open Source Tools & APIs

| Tool/API | Purpose | Link |
|----------|---------|------|
| **LiveKit** | Real-time audio/video infrastructure | [livekit.io](https://livekit.io) |
| **LiveKit Agents** | Voice AI agent framework | [docs.livekit.io/agents](https://docs.livekit.io/agents) |
| **Clerk** | Authentication & user management | [clerk.com](https://clerk.com) |
| **Anam AI** | Voice cloning technology | [anam.ai](https://www.anam.ai) |
| **ElevenLabs** | Text-to-Speech synthesis | [elevenlabs.io](https://elevenlabs.io) |
| **Silero VAD** | Voice Activity Detection | [GitHub](https://github.com/snakers4/silero-vad) |
| **Next.js** | React framework | [nextjs.org](https://nextjs.org) |
| **Express.js** | Node.js web framework | [expressjs.com](https://expressjs.com) |
| **MongoDB** | NoSQL database | [mongodb.com](https://mongodb.com) |
| **Mongoose** | MongoDB ODM | [mongoosejs.com](https://mongoosejs.com) |
| **Tailwind CSS** | CSS framework | [tailwindcss.com](https://tailwindcss.com) |
| **Radix UI** | UI component primitives | [radix-ui.com](https://radix-ui.com) |

---

## 📜 License

This project was built for hackathon purposes. Please check individual dependency licenses for usage terms.

---

## 🙏 Acknowledgments

- **LiveKit** team for the incredible real-time infrastructure
- **Clerk** for seamless authentication
- **Anam AI** and **ElevenLabs** for voice technology
- All the open-source contributors whose tools made this possible

---

<p align="center">
  <strong>Built with ❤️ for parents and children everywhere</strong>
</p>
