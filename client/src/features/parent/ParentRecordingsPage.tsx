import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Mic,
  Play,
  Pause,
  Calendar,
  Clock,
  CircleAlert,
} from '../../components/ui/icons.js';
import { api } from '../../lib/api.js';
import { useChildStore } from '../../store/childStore.js';
import { Card } from '../../components/ui/Card.js';
import { useT } from '../../i18n/index.js';
import { claimPlayback, releasePlayback } from '../../hooks/useNarration.js';
import { resolveMediaUrl } from '../../lib/mediaUrl.js';

export const ParentRecordingsPage: React.FC = () => {
  const { activeChild } = useChildStore();
  const t = useT();
  const [playingId, setPlayingId] = useState<string | null>(null);
  // Holds the id of a recording the browser could not decode (e.g. a Chrome WebM/Opus
  // take opened in Safari/iOS), so the parent gets a clear reason instead of silence.
  const [playbackErrorId, setPlaybackErrorId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Stable identity: registered as the single active player shared with narration.
  const stopPlayback = useCallback(() => {
    const audio = audioRef.current;
    audioRef.current = null;
    if (audio) {
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
    }
    releasePlayback(stopPlayback);
    setPlayingId(null);
  }, []);
  useEffect(() => () => stopPlayback(), [stopPlayback]);

  const { data: recordings = [], isLoading } = useQuery({
    queryKey: ['childRecordings', activeChild?._id],
    queryFn: async () => {
      const res = await api.get(`/recordings/children/${activeChild?._id}`);
      return res.data.data;
    },
    enabled: !!activeChild?._id,
  });

  const handleTogglePlay = (id: string, url: string) => {
    if (playingId === id) {
      stopPlayback();
      return;
    }
    stopPlayback();
    setPlaybackErrorId(null);
    claimPlayback(stopPlayback); // Stops narration or any other active reader.
    // Recording URLs are stored app-relative with a signed token; rebase onto the API origin.
    const audio = new Audio(resolveMediaUrl(url));
    audioRef.current = audio;
    setPlayingId(id);
    const ended = () => {
      if (audioRef.current === audio) stopPlayback();
    };
    // A decode/network failure is distinct from reaching the end: tell the parent why.
    const failed = () => {
      const active = audioRef.current === audio;
      if (active) stopPlayback();
      if (active) setPlaybackErrorId(id);
    };
    audio.onended = ended;
    audio.onerror = failed;
    try {
      void audio.play().catch(failed);
    } catch {
      failed();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold font-display text-stone-800">
          {t('parentPortal.recordingsTitle')}
        </h2>
        <p className="text-sm text-stone-500">
          {t('parentPortal.recordingsDesc')}
        </p>
      </div>

      {isLoading ? (
        <div className="py-12 text-center" role="status" aria-live="polite">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" aria-hidden="true" />
          <p className="font-bold text-stone-600">{t('parentPortal.recordingsLoading')}</p>
        </div>
      ) : recordings.length === 0 ? (
        <Card className="p-8 bg-white border-cream-border text-center">
          <Mic className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <p className="text-stone-600 font-bold mb-1">
            {t('parentPortal.noRecordings')}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {recordings.map((rec: any) => {
            const isPlaying = playingId === rec._id;
            const dateStr = new Date(rec.createdAt).toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <Card
                key={rec._id}
                className="p-4 bg-white border border-cream-border hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleTogglePlay(rec._id, rec.url)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-[color,background-color,box-shadow] ${
                      isPlaying
                        ? 'bg-primary text-white shadow-md animate-pulse'
                        : 'bg-primary-light/50 text-primary hover:bg-primary hover:text-white'
                    }`}
                    aria-label={isPlaying ? t('parentPortal.stopPlayback') : t('parentPortal.playRecordingAria')}
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
                  </button>

                  <div>
                    <h4 className="font-bold text-stone-800 text-base font-display">
                      {rec.wordOrPrompt ? t('parentPortal.recordingLabel', { word: rec.wordOrPrompt }) : t('parentPortal.recordingDefault')}
                    </h4>
                    <div className="flex items-center space-x-3 text-xs text-stone-500 mt-0.5">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{dateStr}</span>
                      </span>
                      {rec.durationSec > 0 && (
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{rec.durationSec}s</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {rec.lessonId && (
                  <span className="text-xs font-bold px-3 py-1 bg-cream-muted border border-cream-border rounded-full text-stone-600">
                    {rec.lessonId.title || t('parentPortal.lessonFallback')}
                  </span>
                )}
                </div>
                {playbackErrorId === rec._id && (
                  <div className="mt-3 flex items-center space-x-2 bg-red-50 text-red-700 border border-red-200 rounded-xl p-2.5 text-xs" role="alert">
                    <CircleAlert className="w-4 h-4 shrink-0" />
                    <span>{t('parentPortal.playbackError')}</span>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
