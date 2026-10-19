import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Sparkles,
  CircleCheck,
  Lightbulb,
  Pause,
  PartyPopper,
  BookOpen,
  LogIn,
  CircleAlert,
  Headphones,
} from '../../components/ui/icons.js';
import { api } from "../../lib/api.js";
import { formatPoints } from "../../lib/utils.js";
import { useChildStore } from "../../store/childStore.js";
import { useAuthStore } from "../../store/authStore.js";
import { Card } from "../../components/ui/Card.js";
import { Button } from "../../components/ui/Button.js";
import { QueryErrorState } from "../../components/ui/QueryErrorState.js";
import { CoverPlaceholder } from "../../components/ui/CoverPlaceholder.js";
import { SupportTranslation } from "../../components/ui/SupportTranslation.js";
import { useNarration } from "../../hooks/useNarration.js";
import { useT, useUiLanguage } from "../../i18n/index.js";

export const CultureDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const childId = useChildStore(state => state.activeChild?._id);
  const userId = useAuthStore(state => state.user?.id);
  return <CultureView key={`${userId}:${childId}:${id}`} id={id} childId={childId} userId={userId} />;
};

const CultureView: React.FC<{ id?: string; childId?: string; userId?: string }> = ({ id, childId, userId }) => {
  const navigate = useNavigate();
  const t = useT();
  const { language } = useUiLanguage();
  const { activeChild, updatePointsLocally } = useChildStore();
  const queryClient = useQueryClient();
  const [viewId] = useState(() => crypto.randomUUID());
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const isCurrentView = () => mounted.current
    && useAuthStore.getState().user?.id === userId
    && useChildStore.getState().activeChild?._id === childId;

  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, number>
  >({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [pointsResult, setPointsResult] = useState<number | null>(null);
  const [incorrectResult, setIncorrectResult] = useState<{ correct: number; total: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    data: article,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["cultureArticle", id, viewId],
    queryFn: async () => {
      const res = await api.get(`/culture/${id}`);
      return res.data.data;
    },
    enabled: !!id,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const narration = useNarration({
    audioUrl: article?.audioUrl,
    text: article
      ? [article.title, article.intro, ...(article.funFacts ?? [])]
      : "",
    contentKey: id,
  });

  if (error) {
    return (
      <div className="py-12 px-4 max-w-xl mx-auto">
        <QueryErrorState
          error={error}
          onRetry={() => refetch()}
          title={t("cultureDetail.loadErrorTitle")}
          message={t("cultureDetail.loadErrorMessage")}
        />
        <div className="text-center mt-4">
          <Button
            variant="outline"
            size="md"
            onClick={() => navigate("/van-hoa")}
          >
            {t("cultureDetail.back")}
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || !article) {
    return (
      <div className="min-h-dvh bg-cream flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-culture border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-stone-600 font-bold text-sm">
          {t("culture.loading")}
        </span>
      </div>
    );
  }

  const handleSelectOption = (questionIdx: number, optionIdx: number) => {
    if (quizSubmitted || isSubmitting) return;
    setIncorrectResult(null);
    setSelectedAnswers((prev) => ({ ...prev, [questionIdx]: optionIdx }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeChild?._id) {
      navigate(`/dang-nhap?redirect=/van-hoa/${id}`);
      return;
    }
    if (isSubmitting) return;

    const formattedAnswers = Object.entries(selectedAnswers).map(([k, v]) => ({
      questionIndex: Number(k),
      selectedAnswer: v,
    }));

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      const res = await api.post(`/culture/${id}/quiz`, {
        childId: activeChild._id,
        contentVersion: article.contentVersion,
        answers: formattedAnswers,
      });

      if (!isCurrentView()) return;
      const { pointsAwarded, totalPoints, isAllCorrect, correctCount, totalQuestions } = res.data.data;
      setPointsResult(pointsAwarded);
      setQuizSubmitted(isAllCorrect === true);
      setIncorrectResult(isAllCorrect ? null : { correct: correctCount, total: totalQuestions });
      void queryClient.invalidateQueries({ queryKey: ["childPoints"] });
      if (pointsAwarded > 0) {
        updatePointsLocally(totalPoints);
      }
    } catch (err: any) {
      if (!isCurrentView()) return;
      const msg =
        err.response?.data?.error?.message ||
        t("cultureDetail.submitError");
      setSubmitError(msg);
    } finally {
      if (isCurrentView()) setIsSubmitting(false);
    }
  };

  return (
    <div className="py-6 px-4 max-w-4xl mx-auto">
      {/* Real Audio Player element */}
      {narration.audioSrc && (
        <audio
          key={narration.audioSrc}
          ref={narration.audioRef}
          src={narration.audioSrc}
          preload="auto"
          {...narration.audioEvents}
        />
      )}

      {/* Top action row */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <button
          onClick={() => navigate("/van-hoa")}
          className="inline-flex items-center space-x-2 text-stone-600 hover:text-culture font-bold text-sm bg-white px-4 py-2.5 rounded-xl shadow-sm border border-cream-border transition-colors min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t("cultureDetail.back")}</span>
        </button>

        {/* Audio Narration Button */}
        <div className="flex items-center space-x-2">
          {narration.isPlaying && narration.mode === "tts" && (
            <span className="text-[11px] font-bold text-stone-500">
              ({t("storyDetail.deviceVoice")})
            </span>
          )}
          <button
            onClick={narration.toggle}
            disabled={!narration.canPlay}
            className={`inline-flex items-center space-x-2 px-5 py-2.5 rounded-full font-bold text-sm shadow-md transition-[box-shadow,filter] min-h-[44px] ${
              narration.isPlaying
                ? "bg-amber-500 text-white animate-pulse shadow-amber-300"
                : "bg-gradient-to-r from-culture-dark to-culture text-white hover:brightness-105"
            }`}
          >
            {narration.isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-white" />
                <span>
                  {narration.mode === "tts" ? t("storyDetail.stopReading") : t("cultureDetail.stopStory")}
                </span>
              </>
            ) : (
              <>
                <Headphones className="w-4 h-4" />
                <span>{t("cultureDetail.narrate")}</span>
              </>
            )}
          </button>
          {!narration.canPlay && (
            <span className="text-xs text-stone-600">
              {t("cultureDetail.noAudio")}
            </span>
          )}
          {narration.error && (
            <span role="status" className="text-xs text-stone-600 max-w-[16rem]">
              {narration.error}
            </span>
          )}
        </div>
      </div>

      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden mb-8 h-80 shadow-kid border-4 border-white">
        {article.coverImage ? (
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <CoverPlaceholder
            kind="culture"
            variant={article.category}
            className="w-full h-full"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col justify-end p-8 text-white">
          <div className="flex items-center space-x-2 mb-2">
            <span className="bg-accent text-stone-900 px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider">
              {article.category === "am_thuc"
                ? t("cultureDetail.badgeFood")
                : article.category === "le_hoi"
                  ? t("culture.catLeHoi")
                  : t("cultureDetail.badgeHeritage")}
            </span>
            {pointsResult !== null && (
              <span className="bg-emerald-500 text-white px-3 py-0.5 rounded-full text-xs font-bold flex items-center space-x-1">
                <CircleCheck className="w-3.5 h-3.5" />
                <span>{t("cultureDetail.explored")}</span>
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-black font-display drop-shadow-md">
            {article.title}
          </h1>
          <SupportTranslation
            translations={article.translations}
            select={(t: { title?: string }) => t.title}
            className="mt-1 block text-sm md:text-base font-semibold text-white/80 drop-shadow"
          />
        </div>
      </div>

      {/* Intro section */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border-2 border-cream-border mb-8 shadow-sm">
        <div className="flex items-center space-x-2 text-culture font-bold text-sm mb-3 uppercase tracking-wider">
          <BookOpen className="w-4 h-4" />
          <span>{t("cultureDetail.intro")}</span>
        </div>
        <p className="text-stone-700 leading-relaxed text-base md:text-lg font-medium">
          {article.intro}
        </p>
        <SupportTranslation
          translations={article.translations}
          select={(t: { intro?: string }) => t.intro}
          className="mt-3 block text-sm md:text-base leading-relaxed text-stone-500"
        />
      </div>

      {/* Fun Facts Section */}
      {article.funFacts && article.funFacts.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-bold font-display text-stone-800 mb-4 flex items-center space-x-2">
            <Lightbulb className="w-6 h-6 text-amber-500" />
            <span>{t("cultureDetail.funFacts")}</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {article.funFacts.map((fact: string, idx: number) => (
              <div
                key={idx}
                className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex items-start space-x-3"
              >
                <div className="w-7 h-7 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <div className="min-w-0">
                  <p className="text-stone-700 text-sm leading-relaxed">{fact}</p>
                  <SupportTranslation
                    translations={article.translations}
                    select={(t: { funFacts?: string[] }) => t.funFacts?.[idx]}
                    className="mt-1 block text-xs leading-relaxed text-stone-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Culture Quiz Section */}
      {article.quiz && article.quiz.length > 0 && (
        <div className="bg-gradient-to-br from-cream to-white border-3 border-culture/30 rounded-3xl p-6 md:p-8 shadow-kid relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-6 h-6 text-culture" />
              <h2 className="text-xl font-black font-display text-stone-800">
                {t("cultureDetail.quizTitle")}
              </h2>
            </div>
            <span className="text-xs font-bold bg-culture-light/50 text-culture-dark px-3 py-1 rounded-full">
              {t("cultureDetail.quizReward")}
            </span>
          </div>

          <p className="text-stone-600 text-sm mb-6">
            {t("cultureDetail.quizIntro")}
          </p>

          <div className="space-y-6">
            {article.quiz.map((q: any, qIdx: number) => (
              <div
                key={qIdx}
                className="bg-white rounded-2xl p-5 border border-cream-border"
              >
                <h3 className="font-bold text-stone-800 mb-3 text-base">
                  {t("cultureDetail.question", { n: qIdx + 1 })} {q.question}
                </h3>
                <div className="space-y-2">
                  {q.options.map((opt: string, optIdx: number) => {
                    const isSelected = selectedAnswers[qIdx] === optIdx;
                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectOption(qIdx, optIdx)}
                        disabled={quizSubmitted || isSubmitting}
                        className={`w-full text-left p-3.5 rounded-xl border-2 text-sm font-semibold transition-colors flex items-center justify-between min-h-[44px] ${
                          isSelected
                            ? "bg-culture/10 border-culture text-culture-dark font-bold"
                            : "bg-white border-cream-border hover:border-culture/60 hover:bg-emerald-50/40 text-stone-700"
                        }`}
                      >
                        <span>{opt}</span>
                        {isSelected && (
                          <CircleCheck className="w-4 h-4 text-culture" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {submitError && (
            <div role="alert" className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-3 mt-4 text-sm flex items-center space-x-2">
              <CircleAlert className="w-5 h-5 shrink-0 text-red-500" />
              <span>{submitError}</span>
            </div>
          )}

          {incorrectResult && (
            <p role="status" className="mt-4 rounded-xl bg-amber-50 p-4 text-amber-900 font-semibold">
              {t("cultureDetail.partialResult", { correct: incorrectResult.correct, total: incorrectResult.total })}
            </p>
          )}

          {/* Submission action */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            {!quizSubmitted ? (
              <>
                <span className="text-xs text-stone-500">
                  {activeChild
                    ? t("cultureDetail.answering", { done: Object.keys(selectedAnswers).length, total: article.quiz.length })
                    : t("cultureDetail.loginHint")}
                </span>

                {activeChild ? (
                  <Button
                    variant="primary"
                    size="kid"
                    onClick={handleSubmitQuiz}
                    disabled={
                      Object.keys(selectedAnswers).length <
                        article.quiz.length || isSubmitting
                    }
                    isLoading={isSubmitting}
                  >
                    <span>{t("cultureDetail.submit")}</span>
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() =>
                      navigate(`/dang-nhap?redirect=/van-hoa/${id}`)
                    }
                    className="flex items-center space-x-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{t("storyDetail.loginForPoints")}</span>
                  </Button>
                )}
              </>
            ) : (
              <div className="w-full bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <PartyPopper className="w-8 h-8 text-emerald-600" />
                  <div>
                    <h3 className="font-bold text-emerald-800 text-base">
                      {t("cultureDetail.doneTitle")}
                    </h3>
                    <p className="text-xs text-emerald-600">
                      {pointsResult && pointsResult > 0
                        ? t("cultureDetail.pointsEarned", { points: formatPoints(pointsResult, language) })
                        : t("cultureDetail.noNewPoints")}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/van-hoa")}
                >
                  {t("cultureDetail.exploreMore")}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
