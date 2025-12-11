'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  parentName: string;
  childName: string;
  isUploading?: boolean;
}

export function VoiceRecorder({
  onRecordingComplete,
  parentName,
  childName,
  isUploading = false,
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const MIN_RECORDING_TIME = 10; // minimum 10 seconds
  const MAX_RECORDING_TIME = 60; // maximum 60 seconds

  const promptText = `Hi, my name is ${parentName}, and I'm recording this special voice for my child ${childName}. I love spending time with ${childName}, and I'm excited to read bedtime stories together. Story time is one of my favorite moments of the day.`;

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= MAX_RECORDING_TIME - 1) {
            stopRecording();
            return MAX_RECORDING_TIME;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Could not access microphone. Please allow microphone access and try again.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  const resetRecording = useCallback(() => {
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setRecordingTime(0);
  }, [audioUrl]);

  const handleSubmit = useCallback(() => {
    if (audioBlob && recordingTime >= MIN_RECORDING_TIME) {
      onRecordingComplete(audioBlob);
    }
  }, [audioBlob, recordingTime, onRecordingComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const canSubmit = audioBlob && recordingTime >= MIN_RECORDING_TIME && !isUploading;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      {/* Prompt Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-6"
      >
        <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-amber-200">
          <span className="text-2xl">📜</span> Read this aloud:
        </h3>
        <p className="text-lg leading-relaxed text-slate-200 italic">"{promptText}"</p>
        <p className="mt-4 text-sm text-slate-400">
          💡 Tip: Speak naturally, as if you're reading to {childName}. Take your time!
        </p>
      </motion.div>

      {/* Recording Controls */}
      <div className="flex flex-col items-center gap-6">
        {/* Waveform Animation */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1"
            >
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 rounded-full bg-gradient-to-t from-red-500 to-pink-400"
                  animate={{
                    height: [12, 32, 20, 40, 16, 28, 12],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.05,
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timer */}
        <div className="text-center">
          <div className="font-mono text-4xl font-bold text-white">{formatTime(recordingTime)}</div>
          <div className="mt-1 text-sm text-slate-400">
            {recordingTime < MIN_RECORDING_TIME
              ? `At least ${MIN_RECORDING_TIME - recordingTime}s more needed`
              : 'Recording ready!'}
          </div>
        </div>

        {/* Record Button */}
        {!audioBlob ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={isRecording ? stopRecording : startRecording}
            className={`relative flex h-24 w-24 items-center justify-center rounded-full transition-all ${
              isRecording
                ? 'bg-red-500 shadow-lg shadow-red-500/50'
                : 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50'
            }`}
          >
            {isRecording ? (
              <div className="h-8 w-8 rounded-sm bg-white" />
            ) : (
              <svg className="h-10 w-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            )}
            {isRecording && (
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-red-300"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </motion.button>
        ) : (
          <div className="flex flex-col items-center gap-4">
            {/* Audio Preview */}
            <audio src={audioUrl!} controls className="w-full max-w-md" />

            {/* Action Buttons */}
            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetRecording}
                disabled={isUploading}
                className="rounded-xl border border-slate-600 bg-slate-800 px-6 py-3 font-medium text-white transition-colors hover:bg-slate-700 disabled:opacity-50"
              >
                🔄 Re-record
              </motion.button>
              <motion.button
                whileHover={{ scale: canSubmit ? 1.05 : 1 }}
                whileTap={{ scale: canSubmit ? 0.95 : 1 }}
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={`rounded-xl px-8 py-3 font-semibold text-white transition-all ${
                  canSubmit
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/30 hover:shadow-green-500/50'
                    : 'cursor-not-allowed bg-slate-700 opacity-50'
                }`}
              >
                {isUploading ? (
                  <span className="flex items-center gap-2">
                    <motion.div
                      className="h-5 w-5 rounded-full border-2 border-white border-t-transparent"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    Creating Voice...
                  </span>
                ) : (
                  '✨ Use This Recording'
                )}
              </motion.button>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!isRecording && !audioBlob && (
          <p className="text-center text-slate-400">
            Click the microphone to start recording
          </p>
        )}
      </div>
    </div>
  );
}

