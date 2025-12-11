import cors from 'cors';
import express from 'express';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Hello endpoint
app.get('/api/hello', (_req, res) => {
  res.json({ message: 'Hello from Story Time API! 📖' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
