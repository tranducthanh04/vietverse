import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Heart, HelpCircle, X, Check, ArrowRight } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useChildStore } from '../../store/childStore.js';
import { useLessonSessionStore, ActivityAnswer } from '../../store/lessonSessionStore.js';
import { getActivityComponent } from './activityRegistry.js';
import { ProgressBar } from '../../components/ui/ProgressBar.js';
import { Button } from '../../components/ui/Button.js';
import { VictoryModal } from '../../components/ui/VictoryModal.js';
import { VI_LOCALES } from '../../locales/vi.js';

export const LessonPlayerPage: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { activeChild, updatePointsLocally } = useChildStore();
  const {
    currentSession,
    initSession,
    saveStepProgress,
    loseHeart,
    clearSession,
  } = useLessonSessionStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [answers, setAnswers] = useState<ActivityAnswer[]>([]);
  const [stepAnswered, setStepAnswered] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  const [victoryData, setVictoryData] = useState<{
    stars: number;
    pointsEarned: number;
    totalPoints: number;
  }>({ stars: 3, pointsEarned: 10, totalPoints: 0 });

  // Fetch lesson details
  const { data: lesson, isLoading, error } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: async () => {
      const res = await api.get(`/lessons/${lessonId}`);
      return res.data.data;
    },
    enabled: !!lessonId,
  });

  // Restore session from IndexedDB if available
  useEffect(() => {
    if (lessonId && activeChild) {
      initSession(lessonId, activeChild._id).then((session) => {
        if (session) {
          setCurrentStep(session.currentStepIndex || 0);
          setHearts(session.hearts ?? 3);
          setAnswers(session.answers || []);
        }
      });
    }
  }, [lessonId, activeChild]);

  if (isLoading) {
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

  const handleActivityComplete = (isCorrect: boolean) => {
    setLastAnswerCorrect(isCorrect);
    setStepAnswered(true);

    if (!isCorrect) {
      loseHeart().then((remHearts) => setHearts(remHearts));
    }

    const currentAnswer: ActivityAnswer = {
      activityId: currentActivity.id,
      isCorrect,
    };

    const newAnswers = [...answers.filter((a) => a.activityId !== currentActivity.id), currentAnswer];
    setAnswers(newAnswers);
    saveStepProgress(currentStep, currentAnswer);
  };

  const handleNextStep = async () => {
    if (isLastStep) {
      // Calculate results and finish lesson
      const correctCount = answers.filter((a) => a.isCorrect).length;
      const scorePercent = activities.length > 0 ? Math.round((correctCount / activities.length) * 100) : 100;

      try {
        const res = await api.post(`/lessons/${lesson._id}/complete`, {
          childId: activeChild?._id,
          scorePercent,
          answers,
        });

        const { stars, pointsEarned, totalPoints } = res.data.data;
        updatePointsLocally(totalPoints);
        if (activeChild) {
          await clearSession(lesson._id, activeChild._id);
        }

        setVictoryData({ stars, pointsEarned, totalPoints });
        setShowVictory(true);
      } catch (err) {
        // Fallback for offline completion
        setShowVictory(true);
      }
    } else {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setStepAnswered(false);
      setLastAnswerCorrect(null);
      saveStepProgress(nextStep);
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
            activity={currentActivity}
            childId={activeChild._id}
            lessonId={lesson._id}
            onComplete={handleActivityComplete}
          />
        )}
      </main>

      {/* Bottom Sticky Action Footer */}
      <footer className="p-4 bg-white border-t-2 border-cream-border sticky bottom-0 z-30">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex-1">
            {stepAnswered && (
              <div className="flex items-center space-x-2">
                {lastAnswerCorrect ? (
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
            disabled={!stepAnswered && currentActivity?.type !== 'word_card'}
            className="flex items-center space-x-2 px-8"
          >
            <span>{isLastStep ? 'Hoàn thành bài' : VI_LOCALES.lesson.continueBtn}</span>
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
        onBackToMap={() => navigate('/kham-pha')}
        onPlayAgain={() => {
          setShowVictory(false);
          setCurrentStep(0);
          setAnswers([]);
          setStepAnswered(false);
        }}
      />
    </div>
  );
};
