import { Router } from 'express';
import multer from 'multer';
import FormData from 'form-data';
import { getUserId } from '../middleware/auth.js';
import { store } from '../store.js';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

// POST /api/onboarding/voice/create - Create voice clone with ElevenLabs
router.post('/create', upload.single('audio'), async (req, res) => {
  try {
    const clerkUserId = getUserId(req);
    if (!clerkUserId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'No audio file provided' });
      return;
    }

    if (!ELEVENLABS_API_KEY) {
      console.warn('⚠️ ELEVENLABS_API_KEY not set - skipping voice clone creation');
      res.status(200).json({
        success: false,
        message: 'Voice cloning not configured. Add ELEVENLABS_API_KEY to .env',
        skipped: true,
      });
      return;
    }

    const user = await store.getUser(clerkUserId);
    const voiceName = req.body.name || `${user?.parentName || 'User'}'s Story Voice`;

    console.log(`🎤 Creating voice clone for user ${clerkUserId}: ${voiceName}`);

    // Create form data for ElevenLabs API
    const formData = new FormData();
    formData.append('name', voiceName);
    formData.append('description', `Voice clone for ${user?.parentName || 'parent'} to read stories to ${user?.childName || 'child'}`);
    formData.append('files', req.file.buffer, {
      filename: 'voice-sample.webm',
      contentType: req.file.mimetype || 'audio/webm',
    });

    // Call ElevenLabs API to add voice
    const response = await fetch(`${ELEVENLABS_API_URL}/voices/add`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        ...formData.getHeaders(),
      },
      body: formData as unknown as BodyInit,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ ElevenLabs API error:', response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    const voiceData = await response.json();
    const voiceId = voiceData.voice_id;
    
    console.log(`✅ Voice clone created: ${voiceId}`);

    // Store voice ID in user record
    await store.updateUserVoiceClone(clerkUserId, voiceId);

    res.json({
      success: true,
      message: 'Voice clone created successfully',
      voiceId,
      voiceName,
    });
  } catch (error) {
    console.error('❌ Voice clone creation error:', error);
    
    res.status(500).json({
      error: 'Failed to create voice clone',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/onboarding/voice/status - Check voice clone status
router.get('/status', async (req, res) => {
  try {
    const clerkUserId = getUserId(req);
    if (!clerkUserId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await store.getUser(clerkUserId);

    res.json({
      hasVoiceClone: !!user?.anamVoiceId,
      voiceId: user?.anamVoiceId,
    });
  } catch (error) {
    console.error('❌ Voice status error:', error);
    res.status(500).json({ error: 'Failed to check voice status' });
  }
});

export default router;
