import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Play,
  Pause,
  RotateCcw,
  ArrowLeft,
  CircleCheck,
  CircleX,
  CircleHelp,
  Volume2,
  LogIn,
  Lightbulb,
} from '../../components/ui/icons.js';
import { api } from "../../lib/api.js";
import { useChildStore } from "../../store/childStore.js";
import { Card } from "../../components/ui/Card.js";
import { Button } from "../../components/ui/Button.js";
import { QueryErrorState } from "../../components/ui/QueryErrorState.js";
import { CoverPlaceholder } from "../../components/ui/CoverPlaceholder.js";
import { SupportTranslation } from "../../components/ui/SupportTranslation.js";
import { useNarration } from "../../hooks/useNarration.js";
import { useT } from "../../i18n/index.js";

export const StoryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const t = useT();
  const { activeChild } = useChildStore();

  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(
    null,
  );
  const [isQuizChecked, setIsQuizChecked] = useState(false);

  const {
    data: story,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["story", id],
    queryFn: async () => {
      const res = await api.get(`/stories/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });

  const narration = useNarration({
    audioUrl: story?.audioUrl,
    text: story?.lyrics?.map((line: any) => line.text) ?? "",
    contentKey: id,
  });

  // Mark exploration log if child is active
  useEffect(() => {
    if (id && activeChild?._id) {
      api
        .post(`/stories/${id}/explored`, { childId: activeChild._id })
        .catch(() => {});
    }
  }, [id, activeChild]);

  if (error) {
    return (
      <div className="py-12 px-4 max-w-xl mx-auto">
        <QueryErrorState
          error={error}
          onRetry={() => refetch()}
          title={t("storyDetail.loadErrorTitle")}
          message={t("storyDetail.loadErrorMessage")}
        />
        <div className="text-center mt-4">
          <Button
            variant="outline"
            size="md"
            onClick={() => navigate("/kho-truyen")}
          >
            {t("storyDetail.back")}
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || !story) {
    return (
      <div className="min-h-dvh bg-cream flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-stone-600 font-bold text-sm">
          {t("storyDetail.loading")}
        </span>
      </div>
    );
  }

  const currentLineIndex =
    narration.mode === "tts"
      ? narration.segmentIndex
      : story.lyrics.findLastIndex(
          (l: any) => narration.currentTime >= l.timeSec,
        );
  const audioUnavailable = !narration.canPlay;
  const currentQuiz = story.quiz?.[0];

  return (
    <div className="py-6 px-4 max-w-4xl mx-auto">
      {/* Real HTMLAudioElement for true audio playback */}
      {narration.audioSrc && (
        <audio
          key={narration.audioSrc}
          ref={narration.audioRef}
          src={narration.audioSrc}
          preload="auto"
          {...narration.audioEvents}
        />
      )}

      {/* Back button */}
      <button
        onClick={() => navigate("/kho-truyen")}
        className="inline-flex items-center gap-2 text-stone-600 hover:text-primary font-bold mb-4 min-h-[44px] transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>{t("storyDetail.back")}</span>
      </button>

      <div className="flex flex-col gap-6">
        {/* Player header: cover, title and narration controls */}
        <Card variant="elevated" className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] md:grid-cols-[240px_1fr] gap-5 sm:gap-8 items-center">
            {story.coverImage ? (
              <img
                src={story.coverImage}
                alt={story.title}
                className="w-full aspect-video sm:aspect-square rounded-kid object-cover shadow-sm"
              />
            ) : (
              <CoverPlaceholder
                kind="story"
                variant={story.type}
                className="w-full aspect-video sm:aspect-square rounded-kid"
              />
            )}

            <div className="flex flex-col items-start min-w-0">
              {/* Audio Mode Badge: label the source only when it is actually in use,
                  so a freshly loaded page does not greet readers with a warning. */}
              {audioUnavailable ? (
                <span className="px-3 py-1 bg-stone-100 text-stone-600 text-xs font-bold rounded-full">
                  {t("storyDetail.readOnlyMode")}
                </span>
              ) : narration.mode === "asset" ? (
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full inline-flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Audio Studio Vietverse</span>
                </span>
              ) : narration.isPlaying ? (
                <span className="px-3 py-1 bg-stone-100 text-stone-600 text-xs font-bold rounded-full">
                  {t("storyDetail.deviceVoice")}
                </span>
              ) : null}

              <h1 className="mt-3 text-kid-xl sm:text-kid-2xl font-black font-display text-stone-800 text-balance">
                {story.title}
              </h1>
              <SupportTranslation
                translations={story.translations}
                select={(t: { title?: string }) => t.title}
                className="mt-1 block text-sm sm:text-base font-semibold text-stone-500"
              />
              <span className="mt-1 text-sm text-stone-500 font-semibold">
                {t("storyDetail.author", { author: story.author || t("storyDetail.folkAuthor") })}
              </span>

              {story.description?.trim() && (
                <div className="mt-3 max-w-prose">
                  <p className="text-kid-base text-stone-700 leading-relaxed text-pretty">
                    {story.description}
                  </p>
                  <SupportTranslation
                    translations={story.translations}
                    select={(t: { description?: string }) => t.description}
                    className="mt-1 block text-sm sm:text-base text-stone-500 leading-relaxed"
                  />
                </div>
              )}

              {/* Karaoke Play / Pause Controls */}
              <div className="mt-5 w-full flex items-center gap-3 sm:gap-4 bg-cream-muted/70 border border-cream-border rounded-kid p-3 sm:p-4">
                <button
                  onClick={narration.toggle}
                  disabled={audioUnavailable}
                  className="shrink-0 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-kid-primary hover:bg-primary-hover active:translate-y-1 active:shadow-none transition-[background-color,box-shadow,transform,opacity] motion-reduce:transition-none disabled:opacity-50 disabled:pointer-events-none"
                  aria-label={
                    narration.isPlaying
                      ? narration.mode === "tts"
                        ? t("storyDetail.stopReading")
                        : t("storyDetail.pause")
                      : t("storyDetail.play")
                  }
                >
                  {narration.isPlaying ? (
                    <Pause className="w-7 h-7" />
                  ) : (
                    <Play className="w-7 h-7 fill-white ml-0.5" />
                  )}
                </button>

                {/* Audio Seek Timeline */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <input
                    type="range"
                    disabled={
                      audioUnavailable ||
                      narration.mode === "tts" ||
                      !narration.duration
                    }
                    min={0}
                    max={narration.duration || 0}
                    value={narration.currentTime}
                    onChange={(event) => narration.seek(Number(event.target.value))}
                    className="w-full accent-primary h-2 bg-stone-200 rounded-lg cursor-pointer disabled:cursor-default"
                    aria-label={t("storyDetail.seek")}
                  />
                  {narration.mode === "asset" && narration.duration > 0 ? (
                    <div className="flex justify-between text-xs font-mono font-bold text-stone-600">
                      <span>{Math.floor(narration.currentTime)}s</span>
                      <span>{Math.floor(narration.duration)}s</span>
                    </div>
                  ) : (
                    <p className="text-xs text-stone-600">
                      {narration.mode === "tts"
                        ? t("storyDetail.ttsHint")
                        : t("storyDetail.waitingDuration")}
                    </p>
                  )}
                </div>

                <button
                  onClick={narration.reset}
                  disabled={audioUnavailable}
                  className="shrink-0 flex items-center justify-center text-stone-500 hover:text-stone-800 rounded-full hover:bg-white transition-colors min-h-[44px] min-w-[44px] disabled:opacity-50"
                  aria-label={t("storyDetail.restart")}
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>

              {narration.error && (
                <p role="status" className="mt-3 text-sm text-stone-700 bg-cream-muted border border-cream-border rounded-xl px-3 py-2">
                  {narration.error}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Reading / karaoke lines */}
        <Card variant="elevated" className="p-5 sm:p-8 border-2 border-accent/70">
          <div className="flex items-center justify-between gap-3 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-accent-dark">
              {audioUnavailable || narration.mode === "tts"
                ? t("storyDetail.readTogether")
                : t("stories.karaokeMode")}
            </span>
            {narration.isPlaying && narration.mode === "asset" && (
              <span className="flex items-center gap-1 text-xs font-bold text-primary animate-pulse">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span>{t("storyDetail.playingLyrics")}</span>
              </span>
            )}
          </div>

          <div className="space-y-2">
            {story.lyrics.map((line: any, idx: number) => {
              const isActive = idx === currentLineIndex;

              return (
                <div key={idx}>
                  <p
                    className={`px-4 py-3 rounded-2xl border-l-4 transition-colors duration-300 text-kid-base sm:text-kid-lg ${
                      isActive
                        ? "bg-amber-100/90 text-primary border-primary font-black"
                        : "border-transparent text-stone-700 font-bold"
                    }`}
                  >
                    {line.text}
                  </p>
                  <SupportTranslation
                    translations={story.translations}
                    select={(t: { lyrics?: string[] }) => t.lyrics?.[idx]}
                    className="block px-4 pb-1 text-sm text-stone-500"
                  />
                </div>
              );
            })}
          </div>

          {/* Vocabulary chips */}
          {story.vocab && story.vocab.length > 0 && (
            <div className="mt-6 pt-5 border-t border-cream-border">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-2">
                {t("storyDetail.vocab")}
              </span>
              <div className="flex flex-wrap gap-2">
                {story.vocab.map((v: string, i: number) => (
                  <span
                    key={i}
                    className="inline-flex flex-col items-start px-3 py-1.5 bg-amber-50 text-stone-800 border border-amber-200 rounded-xl text-sm font-bold"
                  >
                    <span>{v}</span>
                    <SupportTranslation
                      translations={story.translations}
                      select={(t: { vocab?: string[] }) => t.vocab?.[i]}
                      className="text-xs font-normal text-stone-500"
                    />
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Interactive Story Quiz */}
        {currentQuiz && (
          <Card
            variant="default"
            className="p-6 bg-gradient-to-br from-cream to-white border-2 border-cream-border"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2 text-primary font-bold text-base">
                <CircleHelp className="w-5 h-5" />
                <span>{t("stories.quizTitle")}</span>
              </div>

              {!activeChild && (
                <Link
                  to={`/dang-nhap?redirect=/kho-truyen/${id}`}
                  className="text-xs font-bold text-primary hover:underline flex items-center space-x-1"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{t("storyDetail.loginForPoints")}</span>
                </Link>
              )}
            </div>

            <h2 className="text-kid-base font-bold font-display text-stone-800 mb-4">
              {currentQuiz.question}
            </h2>

            <div className="space-y-3 mb-4">
              {currentQuiz.options.map((opt: string, idx: number) => {
                const isSelected = selectedQuizAnswer === idx;
                const isCorrect =
                  isQuizChecked && idx === currentQuiz.correctAnswer;
                const isWrong =
                  isQuizChecked &&
                  isSelected &&
                  idx !== currentQuiz.correctAnswer;

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedQuizAnswer(idx);
                      setIsQuizChecked(true);
                    }}
                    className={`w-full p-4 rounded-2xl font-bold font-display text-left border-2 transition-colors flex items-center justify-between min-h-[50px] ${
                      isCorrect
                        ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                        : isWrong
                          ? "bg-red-50 border-red-400 text-red-800"
                          : isSelected
                            ? "bg-accent/30 border-accent text-stone-900"
                            : "bg-white border-cream-border hover:border-accent text-stone-700"
                    }`}
                  >
                    <span>{opt}</span>
                    {isCorrect && (
                      <CircleCheck className="w-5 h-5 shrink-0 text-emerald-600" />
                    )}
                    {isWrong && (
                      <CircleX className="w-5 h-5 shrink-0 text-red-600" />
                    )}
                    {(isCorrect || isWrong) && (
                      <span className="sr-only">{isCorrect ? t("storyDetail.correct") : t("storyDetail.incorrect")}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {isQuizChecked && currentQuiz.explanation && (
              <p className="text-xs text-stone-600 italic mt-2 flex items-start gap-1.5">
                <Lightbulb className="w-4 h-4 shrink-0 text-amber-600 not-italic" />
                <span>{currentQuiz.explanation}</span>
              </p>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};
