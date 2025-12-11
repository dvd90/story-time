import { Router } from 'express';
import { getUserId } from '../middleware/auth.js';
import { store, type StoryResponse } from '../store.js';
import type { StoryMode } from '../db/index.js';

const router = Router();

// Mock predefined stories for Phase 1
const PREDEFINED_STORIES = [
  `Once upon a time, in a cozy little house on Maple Street, there lived a curious child who loved to explore.

Every morning, they would wake up early and look out the window at the garden below. The flowers swayed gently in the breeze, and butterflies danced from petal to petal.

One special day, something magical happened. A tiny door appeared at the base of the old oak tree, and our brave little adventurer knew that a wonderful journey was about to begin.`,

  `In a land where dreams come true, there was a special place called Starlight Meadow.

The meadow was home to friendly creatures who loved to play and sing. Every night, when the stars came out, they would gather to share stories and make wishes.

And on this particular evening, a new friend was about to arrive, bringing with them the most wonderful adventure anyone had ever seen.`,
];

// Audio chunk interface
interface AudioChunk {
  index: number;
  text: string;
  duration?: number;
}

interface AudioChunksResponse {
  chunks: AudioChunk[];
  voiceId: string;
  totalChunks: number;
}

// POST /api/story/start - Start a new story
router.post('/start', async (req, res) => {
  try {
    const { mode = 'predefined' } = req.body as { mode?: StoryMode };

    // Get authenticated user ID from Clerk
    const clerkUserId = getUserId(req);
    if (!clerkUserId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Validate mode
    const validModes: StoryMode[] = ['predefined', 'generated', 'previous'];
    if (!validModes.includes(mode)) {
      res.status(400).json({
        error: 'Invalid story mode',
        validModes,
      });
      return;
    }

    // Get current user for personalization
    const user = await store.getUser(clerkUserId);
    let storyText: string;

    switch (mode) {
      case 'predefined':
        // Pick a random predefined story
        storyText = PREDEFINED_STORIES[Math.floor(Math.random() * PREDEFINED_STORIES.length)];
        break;

      case 'previous':
        // Get the most recent story for this user
        const previousStory = await store.getLatestStoryForUser(clerkUserId);
        if (previousStory) {
          storyText = previousStory.text;
        } else {
          // Fall back to predefined if no previous story
          storyText = PREDEFINED_STORIES[0];
        }
        break;

      case 'generated':
        // For Phase 1, return mock generated story
        // Will be replaced with real LLM call in Phase 2
        const childName = user?.childName || 'little one';
        const parentName = user?.parentName || 'dear friend';
        storyText = generateMockStory(childName, parentName);
        break;

      default:
        storyText = PREDEFINED_STORIES[0];
    }

    // Parse into paragraphs (split by blank lines)
    const paragraphs = storyText
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    // Create story data
    const storyData: Omit<StoryResponse, 'createdAt'> = {
      storyId: generateStoryId(),
      mode,
      text: storyText,
      paragraphs,
    };

    // Save story to MongoDB
    const story = await store.saveStory(clerkUserId, storyData);

    console.log(`📖 Story started [${mode}] - ${story.storyId} for user ${clerkUserId}`);

    res.json({
      success: true,
      storyId: story.storyId,
      mode,
      text: storyText,
      paragraphs,
      paragraphCount: paragraphs.length,
    });
  } catch (error) {
    console.error('❌ Story start error:', error);
    res.status(500).json({ error: 'Failed to start story' });
  }
});

// POST /api/story/audio-chunks - Split story into audio-ready chunks
router.post('/audio-chunks', async (req, res) => {
  try {
    const { storyText, voiceId } = req.body as { storyText?: string; voiceId?: string };

    // Get authenticated user ID from Clerk
    const clerkUserId = getUserId(req);
    if (!clerkUserId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!storyText) {
      res.status(400).json({
        error: 'Missing required field: storyText',
      });
      return;
    }

    // Get voice ID from user if not provided
    const user = await store.getUser(clerkUserId);
    const effectiveVoiceId = voiceId || user?.chosenVoiceId || 'default';

    // Split text into chunks (by paragraphs/sentences for natural pauses)
    const chunks = splitIntoChunks(storyText);

    const response: AudioChunksResponse = {
      chunks,
      voiceId: effectiveVoiceId,
      totalChunks: chunks.length,
    };

    console.log(`🔊 Audio chunks created: ${chunks.length} chunks for voice ${effectiveVoiceId}`);

    res.json(response);
  } catch (error) {
    console.error('❌ Audio chunks error:', error);
    res.status(500).json({ error: 'Failed to create audio chunks' });
  }
});

// GET /api/story/history - Get user's story history
router.get('/history', async (req, res) => {
  try {
    const clerkUserId = getUserId(req);
    if (!clerkUserId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const stories = await store.getStoriesForUser(clerkUserId);

    res.json({
      stories,
      count: stories.length,
    });
  } catch (error) {
    console.error('❌ Story history error:', error);
    res.status(500).json({ error: 'Failed to retrieve story history' });
  }
});

// GET /api/story/:id - Get a specific story
router.get('/:id', async (req, res) => {
  try {
    const story = await store.getStory(req.params.id);

    if (!story) {
      res.status(404).json({
        error: 'Story not found',
      });
      return;
    }

    res.json(story);
  } catch (error) {
    console.error('❌ Get story error:', error);
    res.status(500).json({ error: 'Failed to retrieve story' });
  }
});

// Helper: Generate mock story with personalization
function generateMockStory(childName: string, parentName: string): string {
  return `Once upon a time, ${childName} went on an amazing adventure with ${parentName}.

They discovered a magical forest where the trees whispered secrets and the flowers glowed with rainbow colors. Together, they followed a sparkling path that led deeper into the enchanted woods.

At the end of their journey, they found a hidden treasure - not gold or jewels, but something far more precious: a beautiful memory they would share forever. And ${childName} knew that with ${parentName} by their side, every day could be an adventure.`;
}

// Helper: Split story text into audio chunks
function splitIntoChunks(text: string): AudioChunk[] {
  // Split by paragraphs first (double newlines)
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const chunks: AudioChunk[] = [];

  paragraphs.forEach((paragraph) => {
    // For longer paragraphs, split by sentences
    if (paragraph.length > 200) {
      const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
      sentences.forEach((sentence) => {
        chunks.push({
          index: chunks.length,
          text: sentence.trim(),
          // Estimate ~150 words per minute, avg 5 chars per word
          duration: Math.ceil((sentence.trim().length / 5) * (60 / 150) * 1000),
        });
      });
    } else {
      chunks.push({
        index: chunks.length,
        text: paragraph,
        duration: Math.ceil((paragraph.length / 5) * (60 / 150) * 1000),
      });
    }
  });

  return chunks;
}

// Helper: Generate story ID
function generateStoryId(): string {
  return `story_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export default router;
