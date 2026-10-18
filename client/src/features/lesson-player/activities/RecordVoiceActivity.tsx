import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore.js';
import { useChildStore } from '../../../store/childStore.js';
import {
  Mic,
  Square,
  Play,
  RotateCcw,
  Check,
  CircleAlert,
} from '../../../components/ui/icons.js';
import { useAudioRecorder } from '../../../lib/audioRecorder.js';
import { Button } from '../../../components/ui/Button.js';
import { AudioButton } from '../../../components/ui/AudioButton.js';
import { Mascot } from '../../../components/ui/Mascot.js';
import { targetTextSize } from './targetTextSize.js';
import { useT } from '../../../i18n/index.js';

export interface RecordVoiceActivityProps {
  activity: {
    id: string;
    prompt: string;
    subPrompt?: string;
    targetWord?: string;
    audioUrl?: string;
    hints?: string[];
  };
  childId: string;
  lessonId: string;
  contentVersion?: number;
  onComplete: (isCorrect: boolean, userAnswer?: any) => void;
}

export const RecordVoiceActivity: React.FC<RecordVoiceActivityProps> = ({
  activity,
  childId,
  lessonId,
  contentVersion,
  onComplete,
}) => {
  const t = useT();
  const {
    isRecording,
    isPlaying,
    audioBlob,
    durationSec,
    errorMessage,
    startRecording,
    stopRecording,
    clearRecording,
    playRecording,
    uploadRecording,
    restartExpiredUpload,
  } = useAudioRecorder(JSON.stringify([childId,lessonId,activity.id,contentVersion]));

  const [isUploading, setIsUploading] = useState(false);
  const [isStartingRecording, setIsStartingRecording] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [intentExpired, setIntentExpired] = useState(false);
  const userId = useAuthStore(state => state.user?.id);
  const activeChildId = useChildStore(state => state.activeChild?._id);
  const contextKey = JSON.stringify([userId,activeChildId,childId,lessonId,activity.id,contentVersion]);
  const contextRef = useRef(contextKey);
  contextRef.current = contextKey;
  const generation = useRef(0), mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    const auth = useAuthStore.subscribe((state,previous) => { if (state.user?.id !== previous.user?.id) generation.current++; });
    const child = useChildStore.subscribe((state,previous) => { if (state.activeChild?._id !== previous.activeChild?._id) generation.current++; });
    return () => { mounted.current = false; generation.current++; auth(); child(); };
  },[]);
  useEffect(() => { generation.current++; setIsStartingRecording(false); setIsSubmitted(false); setIsUploading(false); setUploadError(null); setIntentExpired(false); },[contextKey]);

  const handleSubmit = async () => {
    if (!audioBlob) return;
    const epoch = generation.current, key = contextKey;
    const current = () => mounted.current && epoch === generation.current && key === contextRef.current;
    try {
      setIsUploading(true);
      if (intentExpired) { restartExpiredUpload(); setIntentExpired(false); }
      setUploadError(null);
      const res = await uploadRecording({
        childId,
        lessonId,
        activityId: activity.id,
        contentVersion,
        wordOrPrompt: activity.targetWord || activity.prompt,
      });
      const recordingId = res?.id ?? res?._id;
      if (!current()) return;
      if (typeof recordingId !== 'string' || !/^[a-f\d]{24}$/i.test(recordingId)) throw new Error('Invalid recording response');
      setIsSubmitted(true);
      onComplete(true, recordingId);
    } catch (err: any) {
      if (!current()) return;
      // Timeouts end the spinner; the upload task keeps its intent, so "Thử gửi lại" asks finalize first.
      const timedOut = err?.code === 'ECONNABORTED' || err?.code === 'ETIMEDOUT' || err?.code === 'RECORDING_UPLOAD_TIMEOUT';
      const offline = err?.code === 'ERR_NETWORK';
      const msg = err.response?.data?.error?.message
        || (timedOut ? t('lesson.uploadTimeout') : undefined)
        || (offline ? t('lesson.uploadOffline') : undefined)
        || err.message || t('lesson.uploadError');
      setUploadError(msg);
      setIntentExpired(err.response?.data?.error?.code === 'UPLOAD_INTENT_EXPIRED');
    } finally {
      if (current()) setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-6 text-center max-w-xl w-full mx-auto">
      <div className="mb-4">
        <Mascot mood={isRecording ? 'listening' : 'happy'} size="md" />
      </div>

      <h2 className="text-kid-lg md:text-kid-xl font-display font-bold text-stone-800 mb-2">
        {activity.prompt}
      </h2>

      {activity.subPrompt && <p className="text-kid-base text-stone-600 mb-4 whitespace-pre-line">{activity.subPrompt}</p>}
      {!isStartingRecording && !isRecording && !isPlaying && (
        <AudioButton
          audioUrl={activity.audioUrl}
          textToSpeak={activity.targetWord || activity.subPrompt || activity.prompt}
          label={t('lesson.listenModel')}
          contentKey={contextKey}
        />
      )}

      {activity.targetWord && (
        <div className="max-w-full bg-white border-4 border-primary/30 rounded-2xl px-5 sm:px-8 py-3 my-4 inline-block shadow-sm">
          <span className={`${targetTextSize(activity.targetWord)} block font-black font-display text-primary break-words text-balance`}>
            {activity.targetWord}
          </span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center space-x-2 bg-red-50 text-red-700 border border-red-200 rounded-xl p-3 my-4 text-sm max-w-md">
          <CircleAlert className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Recording Stage Control */}
      <div className="flex flex-col items-center my-6">
        {!audioBlob ? (
          isRecording ? (
            <div className="flex flex-col items-center space-y-4">
              {/* Pulsing Recording Indicator */}
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75"></div>
                <button
                  onClick={stopRecording}
                  className="relative w-24 h-24 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-2xl min-h-[58px] min-w-[58px]"
                  aria-label={t('lesson.stopRecordingAria')}
                >
                  <Square className="w-10 h-10 fill-white" />
                </button>
              </div>

              <div className="flex items-center space-x-2 text-red-600 font-bold font-display text-kid-base">
                <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse"></span>
                <span>{t('lesson.recording')} ({durationSec}s)</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-3">
              <button
                onClick={async () => {
                  const epoch = generation.current, key = contextKey;
                  setIsStartingRecording(true);
                  try { await startRecording(); }
                  finally {
                    if (mounted.current && epoch === generation.current && key === contextRef.current) setIsStartingRecording(false);
                  }
                }}
                disabled={isStartingRecording}
                className="w-24 h-24 bg-primary hover:bg-primary-hover text-white rounded-full flex items-center justify-center shadow-kid-primary hover:scale-105 active:scale-95 transition-transform min-h-[58px] min-w-[58px]"
                aria-label={t('lesson.startRecordingAria')}
              >
                <Mic className="w-12 h-12" />
              </button>
              <span className="text-stone-600 font-bold text-kid-base">
                {t('lesson.recordPrompt')}
              </span>
            </div>
          )
        ) : (
          /* Audio Recorded: Playback, Re-record, and Submit */
          <div className="w-full bg-white border-2 border-cream-border rounded-3xl p-6 shadow-kid flex flex-col items-center space-y-5">
            <span className="text-emerald-700 font-bold text-base flex items-center space-x-1">
              <Check className="w-5 h-5 text-emerald-600" />
              <span>{t('lesson.recordDone')} ({durationSec}s)</span>
            </span>

            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="md"
                onClick={playRecording}
                className="flex items-center space-x-2"
              >
                <Play className={`w-5 h-5 ${isPlaying ? 'text-primary fill-primary animate-pulse' : ''}`} />
                <span>{t('lesson.listenBack')}</span>
              </Button>

              <Button
                variant="ghost"
                size="md"
                onClick={() => { clearRecording(); setUploadError(null); setIntentExpired(false); }}
                disabled={isUploading}
                className="flex items-center space-x-2 text-stone-600"
              >
                <RotateCcw className="w-5 h-5" />
                <span>{t('lesson.reRecord')}</span>
              </Button>
            </div>

            {uploadError && (
              <div className="flex flex-col items-center space-y-2 bg-red-50 text-red-700 border border-red-200 rounded-2xl p-4 text-sm w-full">
                <div className="flex items-center space-x-2">
                  <CircleAlert className="w-5 h-5 shrink-0 text-red-500" />
                  <span className="font-medium">{uploadError}</span>
                </div>
              </div>
            )}

            {!isSubmitted ? (
              <Button
                variant="primary"
                size="kid"
                isLoading={isUploading}
                onClick={handleSubmit}
                className="w-full max-w-xs"
              >
                {intentExpired ? t('lesson.sendNewAttempt') : uploadError ? t('lesson.sendRetry') : t('lesson.sendRecording')}
              </Button>
            ) : (
              <div className="text-emerald-600 font-bold flex items-center space-x-1">
                <Check className="w-5 h-5" />
                <span>{t('lesson.uploadSuccess')}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
