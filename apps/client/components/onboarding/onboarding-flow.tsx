'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'motion/react';
import { VoiceRecorder } from './voice-recorder';

type OnboardingStep = 'welcome' | 'names' | 'voice' | 'complete';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function OnboardingFlow() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [parentName, setParentName] = useState('');
  const [childName, setChildName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNamesSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!parentName.trim() || !childName.trim()) return;

      setIsLoading(true);
      setError(null);

      try {
        const token = await getToken();
        const response = await fetch(`${API_BASE}/api/onboarding`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            parentName: parentName.trim(),
            childName: childName.trim(),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save names');
        }

        setStep('voice');
      } catch (err) {
        console.error('Names submit error:', err);
        setError('Something went wrong. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [parentName, childName, getToken]
  );

  const handleVoiceRecordingComplete = useCallback(
    async (audioBlob: Blob) => {
      setIsLoading(true);
      setError(null);

      try {
        const token = await getToken();

        // First, upload the audio to Anam to create voice clone
        // Note: In production, this should go through your backend for security
        const formData = new FormData();
        formData.append('audio', audioBlob, 'voice-recording.webm');
        formData.append('name', `${parentName}'s Voice`);

        // For now, we'll call our backend which will handle the Anam API
        const voiceResponse = await fetch(`${API_BASE}/api/onboarding/voice/create`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!voiceResponse.ok) {
          // If voice creation fails, we'll still complete onboarding
          // The user can try again later
          console.warn('Voice clone creation failed, continuing with default voice');
        }

        // Complete onboarding
        const completeResponse = await fetch(`${API_BASE}/api/onboarding/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!completeResponse.ok) {
          throw new Error('Failed to complete onboarding');
        }

        setStep('complete');

        // Redirect to main app after a moment
        setTimeout(() => {
          router.push('/');
          router.refresh();
        }, 3000);
      } catch (err) {
        console.error('Voice recording error:', err);
        setError('Failed to create voice clone. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [parentName, getToken, router]
  );

  const skipVoiceClone = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      await fetch(`${API_BASE}/api/onboarding/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      setStep('complete');
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 2000);
    } catch (err) {
      console.error('Skip error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getToken, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <AnimatePresence mode="wait">
        {/* Welcome Step */}
        {step === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-lg text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="mb-8 text-8xl"
            >
              📚
            </motion.div>
            <h1 className="mb-4 text-4xl font-bold text-white">Welcome to Story Time!</h1>
            <p className="mb-8 text-xl text-slate-300">
              Let's set up your personalized storytelling experience
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setStep('names')}
              className="rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 px-12 py-4 text-xl font-semibold text-white shadow-lg shadow-purple-500/30 transition-shadow hover:shadow-purple-500/50"
            >
              Get Started ✨
            </motion.button>
          </motion.div>
        )}

        {/* Names Step */}
        {step === 'names' && (
          <motion.div
            key="names"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md"
          >
            <div className="mb-8 text-center">
              <div className="mb-4 text-6xl">👋</div>
              <h2 className="mb-2 text-3xl font-bold text-white">Tell us about you</h2>
              <p className="text-slate-300">We'll personalize stories just for you</p>
            </div>

            <form onSubmit={handleNamesSubmit} className="space-y-6">
              <div>
                <label htmlFor="parentName" className="mb-2 block text-sm font-medium text-slate-200">
                  Your name
                </label>
                <input
                  type="text"
                  id="parentName"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="e.g., Sarah"
                  className="w-full rounded-xl border border-slate-600 bg-slate-800/50 px-4 py-3 text-white placeholder:text-slate-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  required
                />
              </div>

              <div>
                <label htmlFor="childName" className="mb-2 block text-sm font-medium text-slate-200">
                  Your child's name
                </label>
                <input
                  type="text"
                  id="childName"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  placeholder="e.g., Emma"
                  className="w-full rounded-xl border border-slate-600 bg-slate-800/50 px-4 py-3 text-white placeholder:text-slate-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  required
                />
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-red-400"
                >
                  {error}
                </motion.p>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading || !parentName.trim() || !childName.trim()}
                className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:shadow-purple-500/50 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Continue →'}
              </motion.button>
            </form>
          </motion.div>
        )}

        {/* Voice Recording Step */}
        {step === 'voice' && (
          <motion.div
            key="voice"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-3xl"
          >
            <div className="mb-8 text-center">
              <div className="mb-4 text-6xl">🎤</div>
              <h2 className="mb-2 text-3xl font-bold text-white">Create Your Voice</h2>
              <p className="text-slate-300">
                Record yourself reading the prompt below. We'll create a voice clone so stories sound
                like you!
              </p>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-6 text-center text-red-400"
              >
                {error}
              </motion.p>
            )}

            <VoiceRecorder
              parentName={parentName}
              childName={childName}
              onRecordingComplete={handleVoiceRecordingComplete}
              isUploading={isLoading}
            />

            <div className="mt-8 text-center">
              <button
                onClick={skipVoiceClone}
                disabled={isLoading}
                className="text-sm text-slate-400 underline underline-offset-4 transition-colors hover:text-slate-300"
              >
                Skip for now (use default voice)
              </button>
            </div>
          </motion.div>
        )}

        {/* Complete Step */}
        {step === 'complete' && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="mb-8 text-8xl"
            >
              🎉
            </motion.div>
            <h2 className="mb-4 text-4xl font-bold text-white">You're all set!</h2>
            <p className="mb-2 text-xl text-slate-300">
              Welcome, {parentName}! Story time with {childName} awaits.
            </p>
            <p className="text-slate-400">Redirecting you to the app...</p>
            <motion.div
              className="mx-auto mt-8 h-1 w-48 overflow-hidden rounded-full bg-slate-700"
            >
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 2.5 }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

