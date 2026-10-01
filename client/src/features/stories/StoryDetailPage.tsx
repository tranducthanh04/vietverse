import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Play, Pause, RotateCcw, ArrowLeft, CheckCircle2, HelpCircle } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useChildStore } from '../../store/childStore.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { VI_LOCALES } from '../../locales/vi.js';

export const StoryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeChild } = useChildStore();

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null);
  const [isQuizChecked, setIsQuizChecked] = useState(false);

  const timerRef = useRef<any>(null);

  const { data: story, isLoading } = useQuery({
    queryKey: ['story', id],
    queryFn: async () => {
      const res = await api.get(`/stories/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });

  // Mark exploration log for active child
  useEffect(() => {
    if (id && activeChild?._id) {
      api.post(`/stories/${id}/explored`, { childId: activeChild._id }).catch(() => {});
    }
  }, [id, activeChild]);

  // Audio / Karaoke simulation timer
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (story && prev >= story.durationSec) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, story]);

  if (isLoading || !story) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentLineIndex = story.lyrics.findLastIndex((l: any) => currentTime >= l.timeSec);

  const handlePlayToggle = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const currentQuiz = story.quiz?.[0];

  return (
    <div className="py-6 px-4 max-w-4xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate('/kho-truyen')}
        className="inline-flex items-center space-x-2 text-stone-600 hover:text-primary font-bold mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Quay lại kho truyện</span>
      </button>

      {/* Main Story Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Side: Cover & Controls */}
        <div className="md:col-span-1 flex flex-col items-center">
          <img
            src={story.coverImage || 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=400'}
            alt={story.title}
            className="w-full max-w-xs rounded-3xl shadow-kid border-4 border-white mb-6 object-cover h-64"
          />

          <h2 className="text-kid-lg font-bold font-display text-center text-stone-800 mb-2">
            {story.title}
          </h2>
          <span className="text-xs text-stone-500 font-semibold mb-6">
            Tác giả: {story.author || 'Dân gian Việt Nam'}
          </span>

          {/* Karaoke Play / Pause Controls */}
          <div className="flex items-center space-x-4 bg-white p-3 rounded-full border-2 border-cream-border shadow-sm">
            <button
              onClick={handlePlayToggle}
              className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-kid-primary hover:scale-105 active:scale-95 transition-transform"
              aria-label={isPlaying ? 'Tạm dừng' : 'Bắt đầu nghe'}
            >
              {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 fill-white ml-0.5" />}
            </button>

            <button
              onClick={handleReset}
              className="p-3 text-stone-500 hover:text-stone-800 rounded-full hover:bg-stone-100 transition-colors"
              aria-label="Nghe lại từ đầu"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <span className="font-mono text-sm font-bold text-stone-600 pr-3">
              {currentTime}s / {story.durationSec}s
            </span>
          </div>

          {/* Vocabulary chips */}
          {story.vocab && story.vocab.length > 0 && (
            <div className="mt-8 w-full bg-white p-4 rounded-2xl border border-cream-border">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-2">
                Từ vựng nổi bật
              </span>
              <div className="flex flex-wrap gap-2">
                {story.vocab.map((v: string, i: number) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-accent-light text-stone-800 rounded-xl text-xs font-bold"
                  >
                    {v}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Karaoke Lyrics Scroll */}
        <div className="md:col-span-2 flex flex-col space-y-6">
          <Card variant="kid" className="p-8 bg-white border-3 border-accent min-h-[360px] flex flex-col justify-center">
            <span className="text-xs font-bold uppercase tracking-wider text-accent-dark mb-4 block">
              {VI_LOCALES.stories.karaokeMode}
            </span>

            <div className="space-y-4">
              {story.lyrics.map((line: any, idx: number) => {
                const isActive = idx === currentLineIndex;

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl transition-all duration-300 ${
                      isActive
                        ? 'bg-amber-100/80 text-primary scale-102 border-l-4 border-primary pl-4 font-black text-kid-lg'
                        : 'text-stone-600 font-bold text-kid-base'
                    }`}
                  >
                    {line.text}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Interactive Story Quiz */}
          {currentQuiz && (
            <Card variant="default" className="p-6 bg-gradient-to-br from-cream to-white border-2 border-cream-border">
              <div className="flex items-center space-x-2 text-primary font-bold text-base mb-3">
                <HelpCircle className="w-5 h-5" />
                <span>{VI_LOCALES.stories.quizTitle}</span>
              </div>

              <h4 className="text-kid-base font-bold font-display text-stone-800 mb-4">
                {currentQuiz.question}
              </h4>

              <div className="space-y-3 mb-4">
                {currentQuiz.options.map((opt: string, idx: number) => {
                  const isSelected = selectedQuizAnswer === idx;
                  const isCorrect = isQuizChecked && idx === currentQuiz.correctAnswer;
                  const isWrong = isQuizChecked && isSelected && idx !== currentQuiz.correctAnswer;

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedQuizAnswer(idx);
                        setIsQuizChecked(true);
                      }}
                      className={`w-full p-4 rounded-2xl font-bold font-display text-left border-2 transition-all flex items-center justify-between min-h-[50px] ${
                        isCorrect
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                          : isWrong
                          ? 'bg-red-50 border-red-400 text-red-800'
                          : isSelected
                          ? 'bg-accent/30 border-accent text-stone-900'
                          : 'bg-white border-cream-border hover:border-accent text-stone-700'
                      }`}
                    >
                      <span>{opt}</span>
                      {isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                    </button>
                  );
                })}
              </div>

              {isQuizChecked && currentQuiz.explanation && (
                <p className="text-xs text-stone-500 italic mt-2">
                  💡 {currentQuiz.explanation}
                </p>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
