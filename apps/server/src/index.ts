import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { connectToDatabase } from './db/index.js';
import { clerkAuth, isAuthenticated } from './middleware/auth.js';
import onboardingRouter from './routes/onboarding.js';
import voiceRouter from './routes/voice.js';
import storyRouter from './routes/story.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Clerk authentication middleware - validates session tokens
app.use(clerkAuth);

// Health check (public)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Hello endpoint (public)
app.get('/api/hello', (_req, res) => {
  res.json({ message: 'Hello from Story Time API! 📖' });
});

// Protected API Routes - require authentication
app.use('/api/onboarding', isAuthenticated, onboardingRouter);
app.use('/api/onboarding/voice', isAuthenticated, voiceRouter);
app.use('/api/story', isAuthenticated, storyRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server with database connection
async function startServer() {
  try {
    // Connect to MongoDB
    await connectToDatabase();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Story Time Server running at http://localhost:${PORT}`);
      console.log(`📖 Endpoints:`);
      console.log(`   GET  /api/onboarding/status - Check onboarding status`);
      console.log(`   POST /api/onboarding - Start onboarding`);
      console.log(`   POST /api/onboarding/voice/create - Create voice clone`);
      console.log(`   POST /api/onboarding/complete - Complete onboarding`);
      console.log(`   POST /api/story/start - Start a new story`);
      console.log(`   GET  /api/story/history - Get story history`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
