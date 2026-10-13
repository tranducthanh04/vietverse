import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Mic,
  Play,
  Pause,
  Calendar,
  Clock,
} from '../../components/ui/icons.js';
import { api } from '../../lib/api.js';
import { useChildStore } from '../../store/childStore.js';
import { Card } from '../../components/ui/Card.js';
import { VI_LOCALES } from '../../locales/vi.js';
import { claimPlayback, releasePlayback } from '../../hooks/useNarration.js';

export const ParentRecordingsPage: React.FC = () => {
  const { activeChild } = useChildStore();
  const [playingId, setPlayingId] = useState<string | null>(null);
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
    claimPlayback(stopPlayback); // Stops narration or any other active reader.
    const audio = new Audio(url);
    audioRef.current = audio;
    setPlayingId(id);
    const ended = () => {
      if (audioRef.current === audio) stopPlayback();
    };
    audio.onended = ended;
    audio.onerror = ended;
    try {
      void audio.play().catch(ended);
    } catch {
      ended();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold font-display text-stone-800">
          {VI_LOCALES.parentPortal.recordingsTitle}
        </h2>
        <p className="text-sm text-stone-500">
          {VI_LOCALES.parentPortal.recordingsDesc}
        </p>
      </div>

      {isLoading ? (
        <div className="py-12 text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="font-bold text-stone-600">Đang tải danh sách giọng đọc của bé...</p>
        </div>
      ) : recordings.length === 0 ? (
        <Card className="p-8 bg-white border-cream-border text-center">
          <Mic className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <p className="text-stone-600 font-bold mb-1">
            {VI_LOCALES.parentPortal.noRecordings}
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
                className="p-4 bg-white border border-cream-border flex items-center justify-between hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleTogglePlay(rec._id, rec.url)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      isPlaying
                        ? 'bg-primary text-white shadow-md animate-pulse'
                        : 'bg-primary-light/50 text-primary hover:bg-primary hover:text-white'
                    }`}
                    aria-label={isPlaying ? 'Dừng' : 'Phát bản ghi âm'}
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
                  </button>

                  <div>
                    <h4 className="font-bold text-stone-800 text-base font-display">
                      {rec.wordOrPrompt ? `Phát âm: "${rec.wordOrPrompt}"` : 'Bản đọc của bé'}
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
                    {rec.lessonId.title || 'Bài học'}
                  </span>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
