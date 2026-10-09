import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart, HelpCircle, X, Check, ArrowRight } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useChildStore } from '../../store/childStore.js';
import { useLessonSessionStore, readCachedSession, type CachedLessonSession, ActivityAnswer } from '../../store/lessonSessionStore.js';
import { useAuthStore } from '../../store/authStore.js';
import { enqueueOfflineCompletion } from '../../lib/offlineSync.js';
import { PendingSubmissions } from './PendingSubmissions.js';
import { getActivityComponent } from './activityRegistry.js';
import { ProgressBar } from '../../components/ui/ProgressBar.js';
import { Button } from '../../components/ui/Button.js';
import { VictoryModal } from '../../components/ui/VictoryModal.js';
import { VI_LOCALES } from '../../locales/vi.js';
import { isNewActivityType, type NewActivityInput, type NewActivitySubmission } from './activities/newActivity.types.js';

export const LessonPlayerPage: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const [searchParams] = useSearchParams();
  const childId = useChildStore(state => state.activeChild?._id);
  const userId = useAuthStore(state => state.user?.id);
  if (searchParams.get('preview') === 'true') return <div className="p-6">Xem trước nội dung qua CMS. <Link to="/admin/lessons">Về quản trị bài học</Link></div>;
  if (!lessonId || !childId || !userId) return <p className="p-6">Hãy chọn hồ sơ bé trước khi học.</p>;
  return <LearningSession key={`${userId}:${childId}:${lessonId}`} lessonId={lessonId} childId={childId} userId={userId} />;
};

const LearningSession: React.FC<{ lessonId: string; childId: string; userId: string }> = ({ lessonId, childId, userId }) => {
  const navigate = useNavigate();
  const { activeChild, updatePointsLocally } = useChildStore();
  const queryClient = useQueryClient();
  const {
    initSession,
    saveStepProgress,
    loseHeart,
    clearSession,
    savePartialInput,
  } = useLessonSessionStore();
  const [cached, setCached] = useState<CachedLessonSession | null | undefined>(undefined);
  const [sessionReady, setSessionReady] = useState(false);
  const [cacheError, setCacheError] = useState<string | null>(null);
  const [offlinePending, setOfflinePending] = useState(false);
  const [submissionId] = useState(() => crypto.randomUUID());
  const legacySession = !!cached && cached.contentVersion === undefined;

  const [currentStep, setCurrentStep] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [answers, setAnswers] = useState<ActivityAnswer[]>([]);
  const [stepAnswered, setStepAnswered] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);
  const [partialInputs, setPartialInputs] = useState<Record<string, NewActivityInput>>({});
  const [inputError, setInputError] = useState<string | null>(null);
  const [isSavingAnswer, setIsSavingAnswer] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [victoryData, setVictoryData] = useState<{
    stars: number;
    pointsEarned: number;
    totalPoints: number;
    isOfflinePending?: boolean;
  }>({ stars: 3, pointsEarned: 10, totalPoints: 0, isOfflinePending: false });

  // Fetch lesson details
  const { data: lesson, isLoading, error } = useQuery({
    queryKey: ['lesson', lessonId, childId, cached?.contentVersion ?? `current:${submissionId}`],
    queryFn: async () => {
      const url = `/lessons/${lessonId}?childId=${childId}&activityContract=2${cached?.contentVersion !== undefined ? `&contentVersion=${cached.contentVersion}` : ''}`;
      const res = await api.get(url);
      return res.data.data;
    },
    enabled: cached !== undefined && !legacySession && !cacheError,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Restore session from IndexedDB if available
  useEffect(() => {
    let cancelled = false;
    readCachedSession(lessonId, childId).then(session => { if (!cancelled) setCached(session ?? null); })
      .catch(() => { if (!cancelled) setCacheError('Chưa đọc được phiên học trên máy. Vui lòng tải lại trang.'); });
    return () => { cancelled = true; };
  }, [lessonId, childId]);

  useEffect(() => {
    if (!lesson || legacySession) return;
    let cancelled = false;
    initSession(lessonId, childId, lesson.contentVersion).then(session => {
      if (cancelled) return;
      if (session.contentVersion !== lesson.contentVersion) { setCacheError('Phiên học đã thay đổi ở tab khác. Vui lòng tải lại trang.'); return; }
      setCurrentStep(session.currentStepIndex || 0); setHearts(session.hearts ?? 3); setAnswers(session.answers || []); setSessionReady(true);
      setPartialInputs(session.partialInputs ?? {});
      const restoredAnswer = session.answers.find(answer => answer.activityId === lesson.activities?.[session.currentStepIndex || 0]?.id);
      setStepAnswered(Boolean(restoredAnswer)); setLastAnswerCorrect(restoredAnswer?.isCorrect ?? null);
    }).catch(() => { if (!cancelled) setCacheError('Chưa lưu được phiên học. Vui lòng kiểm tra bộ nhớ trình duyệt.'); });
    return () => { cancelled = true; };
  }, [lesson, lessonId, childId, legacySession, initSession]);

  const restart = async () => {
    try {
      await clearSession(lessonId, childId);
      setSessionReady(false); setCacheError(null); setCached(null);
      setCurrentStep(0); setHearts(3); setAnswers([]); setStepAnswered(false);
      setPartialInputs({}); setInputError(null);
    } catch { setCacheError('Chưa thể bắt đầu lại. Dữ liệu cũ vẫn được giữ.'); }
  };

  const activityUpdateRequired = (error as { response?: { data?: { error?: { code?: string } } } } | null)?.response?.data?.error?.code === 'ACTIVITY_CLIENT_UPDATE_REQUIRED';
  if (activityUpdateRequired) return <div role="alert" className="p-6 space-y-4">
    <p>Cập nhật trang để học hoạt động mới. Câu trả lời và phiên bản đang học vẫn được giữ.</p>
    <Button onClick={() => window.location.reload()}>Tải lại trang</Button>
  </div>;
  if (legacySession || cacheError || (error && cached)) return <div className="p-6 space-y-4" role="alert">
    <p>{legacySession ? 'Không xác định được phiên bản của bài đang làm. Câu trả lời cũ vẫn được giữ cho tới khi bạn chọn bắt đầu lại.' : cacheError ?? 'Chưa tải được phiên bản bài đang học. Bạn có thể tải lại trang hoặc bắt đầu lại bài hiện tại.'}</p>
    <p>Tiến độ và điểm đã lưu trên máy chủ không thay đổi.</p>
    <Button onClick={restart}>Bắt đầu lại bài học</Button>
  </div>;

  if (cached === undefined || isLoading || (!error && !sessionReady)) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-kid-base font-bold text-stone-700">Đang chuẩn bị bài học vui nhộn cho bé...</p>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-kid-xl font-bold text-primary mb-4">Không thể tải bài học</h2>
        <Button onClick={() => navigate('/kham-pha')}>Trở về bản đồ</Button>
      </div>
    );
  }

  const activities = lesson.activities || [];
  const currentActivity = activities[currentStep];
  const isLastStep = currentStep === activities.length - 1;
  const newActivity = currentActivity && isNewActivityType(currentActivity.type);
  const savedAnswer = answers.find(answer => answer.activityId === currentActivity?.id);
  const activityInput: NewActivityInput = partialInputs[currentActivity?.id] ?? savedAnswer?.userAnswer ??
    (['multi_select','follow_steps'].includes(currentActivity?.type) ? [] : {});
  const persistInput = async (value: NewActivityInput) => {
    try {
      await savePartialInput({ lessonId, childId, contentVersion: lesson.contentVersion }, currentActivity.id, value);
      setInputError(null);
    } catch { setInputError('Chưa lưu được câu trả lời trên máy. Dữ liệu đang nhập vẫn được giữ trên trang.'); }
  };
  const handleNewSubmit = async (result: NewActivitySubmission) => {
    if (isSavingAnswer || stepAnswered) return;
    setIsSavingAnswer(true); setInputError(null);
    const answer: ActivityAnswer = { activityId: currentActivity.id, userAnswer: result.userAnswer };
    try {
      await saveStepProgress(currentStep, answer);
      setAnswers(previous => [...previous.filter(a => a.activityId !== answer.activityId), answer]);
      setStepAnswered(true); setLastAnswerCorrect(null);
    } catch { setInputError('Chưa lưu được câu trả lời trên máy. Bé thử gửi lại, dữ liệu vẫn được giữ.'); }
    finally { setIsSavingAnswer(false); }
  };

  const handleActivityComplete = (isCorrect: boolean, userAnswer?: any) => {
    setLastAnswerCorrect(isCorrect);
    setStepAnswered(true);

    if (!isCorrect) {
      loseHeart().then((remHearts) => setHearts(remHearts));
    }

    const currentAnswer: ActivityAnswer = {
      activityId: currentActivity.id,
      isCorrect,
      userAnswer,
    };

    const newAnswers = [...answers.filter((a) => a.activityId !== currentActivity.id), currentAnswer];
    setAnswers(newAnswers);
    saveStepProgress(currentStep, currentAnswer);
  };

  const handleNextStep = async () => {
    // If current activity is word_card, make sure it is saved in answers
    let currentAnswers = [...answers];
    if (
      currentActivity?.type === 'word_card' &&
      !currentAnswers.some((a) => a.activityId === currentActivity.id)
    ) {
      const wordCardAnswer: ActivityAnswer = {
        activityId: currentActivity.id,
        isCorrect: true,
        userAnswer: true,
      };
      currentAnswers = [...currentAnswers, wordCardAnswer];
      setAnswers(currentAnswers);
      saveStepProgress(currentStep, wordCardAnswer);
    }

    if (isLastStep) {
      if (isSubmitting) return;
      try {
        setIsSubmitting(true);
        setSubmitError(null);
        const res = await api.post(`/lessons/${lesson._id}/complete`, {
          childId: activeChild?._id,
          answers: currentAnswers,
          contentVersion: lesson.contentVersion,
        });

        const { stars, pointsEarned, totalPoints } = res.data.data;
        updatePointsLocally(totalPoints);
        void queryClient.invalidateQueries({ queryKey: ['childPoints'] });
        if (activeChild) {
          await clearSession(lesson._id, activeChild._id);
        }

        setVictoryData({ stars, pointsEarned, totalPoints, isOfflinePending: false });
        setShowVictory(true);
      } catch (err: any) {
        const isNetworkError = !err.response || err.code === 'ERR_NETWORK';
        if (isNetworkError) {
          try {
            enqueueOfflineCompletion({
              id: submissionId, userId, contentVersion: lesson.contentVersion,
              lessonId: lesson._id,
              childId,
              answers: currentAnswers,
              savedAt: Date.now(),
            });
          } catch {
            setSubmitError('Chưa lưu được bài lên máy chủ hoặc bộ nhớ máy. Giữ trang này và thử nộp lại.');
            return;
          }

          if (activeChild) {
            await clearSession(lesson._id, activeChild._id);
          }

          setOfflinePending(true);
        } else {
          const msg = err.response?.data?.error?.message || 'Có lỗi khi lưu kết quả bài học. Bé bấm thử nộp lại nhé!';
          setSubmitError(msg);
        }
      } finally {
        setIsSubmitting(false);
      }
    } else {
      const nextStep = currentStep + 1;
      try {
        await saveStepProgress(nextStep);
        setCurrentStep(nextStep); setStepAnswered(false); setLastAnswerCorrect(null);
      }
      catch { setInputError('Chưa lưu được bước học. Vui lòng tải lại để tiếp tục phiên đã lưu.'); }
    }
  };

  const ActivityComponent = currentActivity ? getActivityComponent(currentActivity.type) : null;

  return (
    <div className="min-h-screen bg-cream flex flex-col justify-between">
      {/* Top Header Bar */}
      <header className="px-6 py-4 bg-white/80 backdrop-blur-md border-b-2 border-cream-border sticky top-0 z-30 flex items-center justify-between">
        <button
          onClick={() => navigate('/kham-pha')}
          className="p-2 text-stone-500 hover:text-primary rounded-full hover:bg-stone-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Thoát bài học"
        >
          <X className="w-7 h-7" />
        </button>

        {/* 5-Step Progress Bar */}
        <div className="w-1/2 max-w-md mx-4">
          <ProgressBar currentStep={currentStep} totalSteps={activities.length || 1} />
        </div>

        {/* Hearts and Hint */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full">
            <Heart className="w-6 h-6 text-red-500 fill-red-500 animate-pulse" />
            <span className="font-display font-bold text-red-700 text-lg">{hearts}</span>
          </div>

          {currentActivity?.hints && currentActivity.hints.length > 0 && (
            <button
              onClick={() => setShowHint(!showHint)}
              className="p-2 text-amber-500 hover:text-amber-600 rounded-full hover:bg-amber-50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Gợi ý"
            >
              <HelpCircle className="w-7 h-7" />
            </button>
          )}
        </div>
      </header>

      {/* Hint Alert */}
      {showHint && currentActivity?.hints && (
        <div className="bg-amber-100 border-b border-amber-300 px-6 py-3 text-center text-amber-900 font-bold animate-fade-in flex items-center justify-center space-x-2">
          <span>💡 Gợi ý: {currentActivity.hints[0]}</span>
        </div>
      )}

      {/* Main Activity Area */}
      <main className="flex-1 flex flex-col justify-center items-center py-6 px-4">
        {ActivityComponent && activeChild && (
          <ActivityComponent
            key={`${lesson.contentVersion}:${currentActivity.id}`}
            activity={currentActivity}
            childId={activeChild?._id || 'preview_child'}
            lessonId={lesson._id}
            contentVersion={lesson.contentVersion}
            onComplete={handleActivityComplete}
            {...(newActivity ? {
              value: activityInput, disabled: stepAnswered || isSavingAnswer,
              onChange: (value: NewActivityInput) => {
                setPartialInputs(previous => ({ ...previous, [currentActivity.id]: value }));
                void persistInput(value);
              },
              onSubmit: handleNewSubmit,
            } : {})}
          />
        )}
      </main>
      <PendingSubmissions childId={childId} />
      {inputError && <div role="alert" className="p-4 bg-amber-50 space-y-3">
        <p>{inputError}</p><Button onClick={() => void persistInput(activityInput)}>Thử lưu lại</Button>
      </div>}
      {offlinePending && <div role="status" className="p-4 bg-amber-50">Bài đã lưu trên máy, đang chờ đồng bộ. Chưa xác nhận điểm thưởng. <Button onClick={() => navigate('/kham-pha')}>Về bản đồ</Button></div>}

      {/* Error alert banner if submission failed */}
      {submitError && (
        <div role="alert" className="bg-red-50 border-t-2 border-red-200 px-6 py-3 flex items-center justify-between text-red-700 text-sm font-bold animate-fadeIn">
          <span>⚠️ {submitError}</span>
          <Button
            type="button"
            size="sm"
            variant="primary"
            onClick={handleNextStep}
            disabled={isSubmitting}
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-1.5 rounded-xl ml-4"
          >
            {isSubmitting ? 'Đang gửi...' : 'Thử lại'}
          </Button>
        </div>
      )}

      {/* Bottom Sticky Action Footer */}
      <footer className="p-4 bg-white border-t-2 border-cream-border sticky bottom-0 z-30">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex-1">
            {stepAnswered && (
              <div className="flex items-center space-x-2">
                {newActivity ? <span role="status" className="font-bold text-stone-700">
                  {currentActivity.type === 'follow_steps' ? 'Đã ghi xác nhận của bé' : 'Đã ghi câu trả lời'}
                </span> : lastAnswerCorrect ? (
                  <span className="flex items-center space-x-1 text-emerald-600 font-bold font-display text-kid-base animate-bounce-subtle">
                    <Check className="w-6 h-6 text-emerald-500" />
                    <span>{VI_LOCALES.lesson.correctPraise}</span>
                  </span>
                ) : (
                  <span className="text-amber-700 font-bold font-display text-kid-base">
                    {VI_LOCALES.lesson.tryAgain}
                  </span>
                )}
              </div>
            )}
          </div>

          <Button
            variant={stepAnswered ? 'primary' : 'outline'}
            size="kid"
            onClick={handleNextStep}
            disabled={isSubmitting || offlinePending || isSavingAnswer || Boolean(inputError) || (!stepAnswered && currentActivity?.type !== 'word_card')}
            className="flex items-center space-x-2 px-8"
          >
            <span>{isSubmitting ? 'Đang lưu...' : isLastStep ? 'Hoàn thành bài' : VI_LOCALES.lesson.continueBtn}</span>
            <ArrowRight className="w-6 h-6" />
          </Button>
        </div>
      </footer>

      {/* Victory Celebration Modal */}
      <VictoryModal
        isOpen={showVictory}
        stars={victoryData.stars}
        pointsEarned={victoryData.pointsEarned}
        totalPoints={victoryData.totalPoints}
        isOfflinePending={victoryData.isOfflinePending}
        onBackToMap={() => navigate('/kham-pha')}
        onPlayAgain={async () => {
          try {
            await initSession(lessonId, childId, lesson.contentVersion);
            setShowVictory(false); setCurrentStep(0); setHearts(3); setAnswers([]); setStepAnswered(false); setLastAnswerCorrect(null);
            setPartialInputs({}); setInputError(null);
          } catch { setShowVictory(false); setCacheError('Chưa lưu được phiên học mới. Vui lòng tải lại trang.'); }
        }}
      />
    </div>
  );
};
