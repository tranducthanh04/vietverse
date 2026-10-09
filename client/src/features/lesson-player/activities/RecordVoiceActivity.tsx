import React, { useState } from 'react';
import { Mic, Square, Play, RotateCcw, Check, AlertCircle } from 'lucide-react';
import { useAudioRecorder } from '../../../lib/audioRecorder.js';
import { Button } from '../../../components/ui/Button.js';
import { Mascot } from '../../../components/ui/Mascot.js';
import { VI_LOCALES } from '../../../locales/vi.js';

export interface RecordVoiceActivityProps {
  activity: {
    id: string;
    prompt: string;
    subPrompt?: string;
    targetWord?: string;
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
  } = useAudioRecorder();

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!audioBlob) return;
    try {
      setIsUploading(true);
      setUploadError(null);
      const res = await uploadRecording({
        childId,
        lessonId,
        activityId: activity.id,
        contentVersion,
        wordOrPrompt: activity.targetWord || activity.prompt,
      });
      const recordingId = res?.id ?? res?._id;
      if (typeof recordingId !== 'string' || !/^[a-f\d]{24}$/i.test(recordingId)) throw new Error('Invalid recording response');
      setIsSubmitted(true);
      onComplete(true, recordingId);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Không thể tải bản thu âm lên máy chủ. Bé hãy kiểm tra mạng và thử gửi lại nhé!';
      setUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto">
      <div className="mb-4">
        <Mascot mood={isRecording ? 'listening' : 'happy'} size="md" />
      </div>

      <h2 className="text-kid-lg md:text-kid-xl font-display font-bold text-stone-800 mb-2">
        {activity.prompt}
      </h2>

      {activity.targetWord && (
        <div className="bg-white border-4 border-primary/30 rounded-2xl px-8 py-3 my-4 inline-block shadow-sm">
          <span className="text-4xl md:text-5xl font-black font-display text-primary">
            {activity.targetWord}
          </span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center space-x-2 bg-red-50 text-red-700 border border-red-200 rounded-xl p-3 my-4 text-sm max-w-md">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
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
                  aria-label="Dừng ghi âm"
                >
                  <Square className="w-10 h-10 fill-white" />
                </button>
              </div>

              <div className="flex items-center space-x-2 text-red-600 font-bold font-display text-kid-base">
                <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse"></span>
                <span>{VI_LOCALES.lesson.recording} ({durationSec}s)</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-3">
              <button
                onClick={startRecording}
                className="w-24 h-24 bg-primary hover:bg-primary-hover text-white rounded-full flex items-center justify-center shadow-kid-primary hover:scale-105 active:scale-95 transition-transform min-h-[58px] min-w-[58px]"
                aria-label="Bắt đầu ghi âm"
              >
                <Mic className="w-12 h-12" />
              </button>
              <span className="text-stone-600 font-bold text-kid-base">
                {VI_LOCALES.lesson.recordPrompt}
              </span>
            </div>
          )
        ) : (
          /* Audio Recorded: Playback, Re-record, and Submit */
          <div className="w-full bg-white border-2 border-cream-border rounded-3xl p-6 shadow-kid flex flex-col items-center space-y-5">
            <span className="text-emerald-700 font-bold text-base flex items-center space-x-1">
              <Check className="w-5 h-5 text-emerald-600" />
              <span>{VI_LOCALES.lesson.recordDone} ({durationSec}s)</span>
            </span>

            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="md"
                onClick={playRecording}
                className="flex items-center space-x-2"
              >
                <Play className={`w-5 h-5 ${isPlaying ? 'text-primary fill-primary animate-pulse' : ''}`} />
                <span>{VI_LOCALES.lesson.listenBack}</span>
              </Button>

              <Button
                variant="ghost"
                size="md"
                onClick={clearRecording}
                className="flex items-center space-x-2 text-stone-600"
              >
                <RotateCcw className="w-5 h-5" />
                <span>{VI_LOCALES.lesson.reRecord}</span>
              </Button>
            </div>

            {uploadError && (
              <div className="flex flex-col items-center space-y-2 bg-red-50 text-red-700 border border-red-200 rounded-2xl p-4 text-sm w-full">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
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
                {uploadError ? 'Thử gửi lại giọng đọc' : 'Gửi giọng đọc của bé'}
              </Button>
            ) : (
              <div className="text-emerald-600 font-bold flex items-center space-x-1">
                <Check className="w-5 h-5" />
                <span>{VI_LOCALES.lesson.uploadSuccess}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
