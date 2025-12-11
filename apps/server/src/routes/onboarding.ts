import { Router } from 'express';
import { getUserId } from '../middleware/auth.js';
import { store } from '../store.js';

const router = Router();

// Temporary hardcoded voice ID while IVC is being set up
const TEMP_VOICE_ID = 'YEPxsTk32dk1sVTotPBJ'

// GET /api/onboarding/status - Check if user has completed onboarding
router.get('/status', async (req, res) => {
  try {
    const clerkUserId = getUserId(req);
    if (!clerkUserId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await store.getUser(clerkUserId);

    res.json({
      exists: !!user,
      onboardingComplete: user?.onboardingComplete ?? false,
      hasVoiceClone: !!user?.anamVoiceId,
    });
  } catch (error) {
    console.error('❌ Onboarding status error:', error);
    res.status(500).json({ error: 'Failed to check onboarding status' });
  }
});

// POST /api/onboarding - Store parent name, child name, and start onboarding
router.post('/', async (req, res) => {
  try {
    const { parentName, childName } = req.body;

    const clerkUserId = getUserId(req);
    if (!clerkUserId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!parentName || !childName) {
      res.status(400).json({
        error: 'Missing required fields',
        required: ['parentName', 'childName'],
      });
      return;
    }

    // Save initial user data with temporary voice ID
    const userData = await store.saveUser(clerkUserId, {
      parentName: parentName.trim(),
      childName: childName.trim(),
      anamVoiceId: TEMP_VOICE_ID, // Temporary hardcoded voice ID
      onboardingComplete: false,
    });

    console.log(`📝 Onboarding started for ${userData.parentName} & ${userData.childName} (${clerkUserId})`);

    res.status(201).json({
      success: true,
      userId: userData.id,
      message: `Great! Now let's create your voice, ${userData.parentName}.`,
      data: {
        parentName: userData.parentName,
        childName: userData.childName,
      },
    });
  } catch (error) {
    console.error('❌ Onboarding error:', error);
    res.status(500).json({ error: 'Failed to save onboarding data' });
  }
});

// POST /api/onboarding/voice - Store voice clone ID from Anam
router.post('/voice', async (req, res) => {
  try {
    const { anamVoiceId, anamPersonaId } = req.body;

    const clerkUserId = getUserId(req);
    if (!clerkUserId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!anamVoiceId) {
      res.status(400).json({
        error: 'Missing required field: anamVoiceId',
      });
      return;
    }

    // Update user with voice clone ID
    const updated = await store.updateUserVoiceClone(clerkUserId, anamVoiceId, anamPersonaId);

    if (!updated) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    console.log(`🎤 Voice clone saved for user ${clerkUserId}: ${anamVoiceId}`);

    res.json({
      success: true,
      message: 'Voice clone saved successfully',
      anamVoiceId,
      anamPersonaId,
    });
  } catch (error) {
    console.error('❌ Voice clone save error:', error);
    res.status(500).json({ error: 'Failed to save voice clone' });
  }
});

// POST /api/onboarding/complete - Mark onboarding as complete
router.post('/complete', async (req, res) => {
  try {
    const clerkUserId = getUserId(req);
    if (!clerkUserId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const completed = await store.completeOnboarding(clerkUserId);

    if (!completed) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const user = await store.getUser(clerkUserId);

    console.log(`✅ Onboarding complete for user ${clerkUserId}`);

    res.json({
      success: true,
      message: `Welcome to Story Time, ${user?.parentName}! You're all set.`,
      user: {
        parentName: user?.parentName,
        childName: user?.childName,
        hasVoiceClone: !!user?.anamVoiceId,
      },
    });
  } catch (error) {
    console.error('❌ Complete onboarding error:', error);
    res.status(500).json({ error: 'Failed to complete onboarding' });
  }
});

// GET /api/onboarding/current - Get current user data
router.get('/current', async (req, res) => {
  try {
    const clerkUserId = getUserId(req);
    if (!clerkUserId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await store.getUser(clerkUserId);

    if (!user) {
      res.status(404).json({
        error: 'No user found. Please complete onboarding first.',
      });
      return;
    }

    res.json({
      userId: user.id,
      parentName: user.parentName,
      childName: user.childName,
      chosenVoice: user.chosenVoice,
      anamVoiceId: user.anamVoiceId,
      anamPersonaId: user.anamPersonaId,
      onboardingComplete: user.onboardingComplete,
    });
  } catch (error) {
    console.error('❌ Get user error:', error);
    res.status(500).json({ error: 'Failed to retrieve user data' });
  }
});

export default router;
