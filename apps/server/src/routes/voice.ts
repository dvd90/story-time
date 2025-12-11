import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
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
const TEMP_VOICE_ID = 'SF9uvIlY93SJRMdV5jeP'
// POST /api/onboarding/voice/create - Create voice clone with ElevenLabs IVC
// https://elevenlabs.io/docs/api-reference/voices/ivc/create
router.post('/create', upload.single('audio'), async (req, res) => {
  let tempFilePath: string | null = null;

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

    // const user = await store.getUser(clerkUserId);
    // const voiceName = req.body.name || `${user?.parentName || 'User'}'s Story Voice`;

    // console.log(`🎤 Creating IVC voice clone for user ${clerkUserId}: ${voiceName}`);
    // console.log(`📁 Audio file: size=${req.file.size}, type=${req.file.mimetype}`);

    // // Step 1: Save audio file temporarily to disk
    // const tempDir = os.tmpdir();
    // const tempFileName = `voice-${clerkUserId}-${Date.now()}.webm`;
    // tempFilePath = path.join(tempDir, tempFileName);
    
    // fs.writeFileSync(tempFilePath, req.file.buffer);
    // console.log(`💾 Saved temp file: ${tempFilePath}`);

    // // Step 2: Initialize ElevenLabs client
    // const client = new ElevenLabsClient({
    //   apiKey: ELEVENLABS_API_KEY,
    // });

    // // Step 3: Create voice clone using the SDK with file from disk
    // const voiceResponse = await client.voices.ivc.create({
    //   name: voiceName,
    //   description: `Voice clone for ${user?.parentName || 'parent'} to read stories to ${user?.childName || 'child'}`,
    //   files: [fs.createReadStream(tempFilePath)],
    //   removeBackgroundNoise: true,
    // });

    // const voiceId = voiceResponse.voiceId;
    
    // console.log(`✅ IVC Voice clone created: ${voiceId}`);
    // console.log(`📋 Requires verification: ${voiceResponse.requiresVerification}`);

    // // Store voice ID in user record
    // await store.updateUserVoiceClone(clerkUserId, voiceId);

    res.json({
      success: true,
      message: 'Voice clone created successfully',
      // voiceId,
      voiceId: TEMP_VOICE_ID,
      requiresVerification: false,
    });
  } catch (error) {
    console.error('❌ Voice clone creation error:', error);
    
    res.status(500).json({
      error: 'Failed to create voice clone',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    // Clean up temp file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
        console.log(`🗑️ Cleaned up temp file: ${tempFilePath}`);
      } catch (cleanupError) {
        console.warn('⚠️ Failed to clean up temp file:', cleanupError);
      }
    }
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
