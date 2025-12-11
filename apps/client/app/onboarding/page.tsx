import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default async function OnboardingPage() {
  const { userId, getToken } = await auth();

  // Redirect to sign-in if not authenticated
  if (!userId) {
    redirect('/sign-in');
  }

  // Check if user has already completed onboarding
  try {
    const token = await getToken();
    const response = await fetch(`${API_BASE}/api/onboarding/status`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (response.ok) {
      const data = await response.json();
      if (data.onboardingComplete) {
        // Already completed, redirect to main app
        redirect('/');
      }
    }
  } catch (error) {
    // If we can't check status, proceed with onboarding
    console.error('Failed to check onboarding status:', error);
  }

  return <OnboardingFlow />;
}

