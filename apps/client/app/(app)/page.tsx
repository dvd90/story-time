import { auth } from '@clerk/nextjs/server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { App } from '@/components/app/app';
import { getAppConfig } from '@/lib/utils';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default async function Page() {
  const { userId, getToken } = await auth();
  const hdrs = await headers();
  const appConfig = await getAppConfig(hdrs);

  // Check if user needs onboarding
  if (userId) {
    let needsOnboarding = false;
    
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
        needsOnboarding = !data.onboardingComplete;
      }
    } catch (error) {
      // If we can't check, let user proceed (server might be down)
      console.error('Failed to check onboarding status:', error);
    }
    
    // Redirect outside of try-catch (redirect throws an error that should propagate)
    if (needsOnboarding) {
      redirect('/onboarding');
    }
  }

  return <App appConfig={appConfig} />;
}
