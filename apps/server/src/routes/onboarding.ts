import { Router } from 'express';
import { getUserId } from '../middleware/auth.js';
import { store } from '../store.js';
import type { OnboardingData } from '../types.js';

const router = Router();

// POST /api/onboarding - Store parent name, child name, and chosen voice
router.post('/', (req, res) => {
  const { parentName, childName, chosenVoice } = req.body;

  // Get authenticated user ID from Clerk
  const clerkUserId = getUserId(req);
  if (!clerkUserId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  // Validate required fields
  if (!parentName || !childName || !chosenVoice) {
    res.status(400).json({
      error: 'Missing required fields',
      required: ['parentName', 'childName', 'chosenVoice'],
    });
    return;
  }

  // Create user data with Clerk user ID
  const userData: OnboardingData = {
    id: clerkUserId,
    parentName: parentName.trim(),
    childName: childName.trim(),
    chosenVoice: chosenVoice.trim(),
    createdAt: new Date(),
  };

  // Store in memory
  store.saveUser(userData);

  console.log(`✅ Onboarding complete for ${userData.parentName} & ${userData.childName} (${clerkUserId})`);

  res.status(201).json({
    success: true,
    userId: userData.id,
    message: `Welcome ${userData.parentName}! Story time with ${userData.childName} is ready.`,
    data: {
      parentName: userData.parentName,
      childName: userData.childName,
      chosenVoice: userData.chosenVoice,
    },
  });
});

// GET /api/onboarding/current - Get current user data
router.get('/current', (req, res) => {
  // Get authenticated user ID from Clerk
  const clerkUserId = getUserId(req);
  if (!clerkUserId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const user = store.getUser(clerkUserId);

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
  });
});

export default router;

