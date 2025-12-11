'use client';

import { useMemo, useState, useEffect, createContext, useContext } from 'react';
import {
  RoomAudioRenderer,
  SessionProvider,
  StartAudio,
  useSession,
} from '@livekit/components-react';
import type { AppConfig } from '@/app-config';
import { ViewController } from '@/components/app/view-controller';
import { Toaster } from '@/components/livekit/toaster';
import { useAgentErrors } from '@/hooks/useAgentErrors';
import { useDebugMode } from '@/hooks/useDebug';
import { getSandboxTokenSource, getStandardTokenSource } from '@/lib/utils';

const IN_DEVELOPMENT = process.env.NODE_ENV !== 'production';

// Voice ID context to allow components to access and update voice selection
const VoiceIdContext = createContext<{
  voiceId: string | undefined;
  setVoiceId: (id: string) => void;
}>({
  voiceId: undefined,
  setVoiceId: () => {},
});

export const useVoiceId = () => useContext(VoiceIdContext);

function AppSetup() {
  useDebugMode({ enabled: IN_DEVELOPMENT });
  useAgentErrors();

  return null;
}

interface AppProps {
  appConfig: AppConfig;
}

export function App({ appConfig }: AppProps) {
  // Load voice ID from localStorage or use default
  const [voiceId, setVoiceIdState] = useState<string | undefined>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('livekit-voice-id');
      return stored || appConfig.defaultVoiceId;
    }
    return appConfig.defaultVoiceId;
  });

  // Save voice ID to localStorage when it changes
  const setVoiceId = (id: string) => {
    setVoiceIdState(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('livekit-voice-id', id);
    }
  };

  const tokenSource = useMemo(() => {
    return typeof process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT === 'string'
      ? getSandboxTokenSource(appConfig, voiceId)
      : getStandardTokenSource(appConfig, voiceId);
  }, [appConfig, voiceId]);

  const session = useSession(
    tokenSource,
    appConfig.agentName ? { agentName: appConfig.agentName } : undefined
  );

  return (
    <VoiceIdContext.Provider value={{ voiceId, setVoiceId }}>
      <SessionProvider session={session}>
        <AppSetup />
        <main className="grid h-svh grid-cols-1 place-content-center">
          <ViewController appConfig={appConfig} />
        </main>
        <StartAudio label="Start Audio" />
        <RoomAudioRenderer />
        <Toaster />
      </SessionProvider>
    </VoiceIdContext.Provider>
  );
}
