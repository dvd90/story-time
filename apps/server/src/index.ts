import cors from 'cors';
import express from 'express';
import { clerkAuth, isAuthenticated } from './middleware/auth.js';
import onboardingRouter from './routes/onboarding.js';
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

app.listen(PORT, () => {
  console.log(`🚀 Story Time Server running at http://localhost:${PORT}`);
  console.log(`📖 Endpoints:`);
  console.log(`   POST /api/onboarding - Register parent & child`);
  console.log(`   GET  /api/onboarding/current - Get current user`);
  console.log(`   POST /api/story/start - Start a new story`);
  console.log(`   POST /api/story/audio-chunks - Get audio chunks`);
  console.log(`   GET  /api/story/:id - Get story by ID`);
});
