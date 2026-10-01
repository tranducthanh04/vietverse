import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Award,
  Lightbulb,
  Volume2,
  Pause,
  PartyPopper,
  BookOpen,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { useChildStore } from '../../store/childStore.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { VI_LOCALES } from '../../locales/vi.js';

export const CultureDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeChild, updatePointsLocally } = useChildStore();

  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [pointsResult, setPointsResult] = useState<number | null>(null);
  const [isPlayingNarration, setIsPlayingNarration] = useState(false);

  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  const { data: article, isLoading } = useQuery({
    queryKey: ['cultureArticle', id],
    queryFn: async () => {
      const res = await api.get(`/culture/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleToggleNarration = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !article) {
      alert('Trình duyệt không hỗ trợ phát giọng đọc tự động.');
      return;
    }

    if (isPlayingNarration) {
      window.speechSynthesis.cancel();
      setIsPlayingNarration(false);
      return;
    }

    window.speechSynthesis.cancel();

    const fullText = `${article.title}. ${article.intro}. Sau đây là những điều thú vị: ${article.funFacts?.join('. ')}`;
    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.lang = 'vi-VN';
    utterance.rate = 0.9;
    utterance.pitch = 1.1;

    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find((v) => v.lang.includes('vi') || v.lang.includes('VN'));
    if (viVoice) {
      utterance.voice = viVoice;
    }

    utterance.onstart = () => setIsPlayingNarration(true);
    utterance.onend = () => setIsPlayingNarration(false);
    utterance.onerror = () => setIsPlayingNarration(false);

    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  if (isLoading || !article) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-culture border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleSelectOption = (questionIdx: number, optionIdx: number) => {
    if (quizSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionIdx]: optionIdx }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeChild?._id) return;

    const formattedAnswers = Object.entries(selectedAnswers).map(([k, v]) => ({
      questionIndex: Number(k),
      selectedAnswer: v,
    }));

    try {
      const res = await api.post(`/culture/${id}/quiz`, {
        childId: activeChild._id,
        answers: formattedAnswers,
      });

      const { pointsAwarded, totalPoints } = res.data.data;
      setPointsResult(pointsAwarded);
      setQuizSubmitted(true);
      if (pointsAwarded > 0) {
        updatePointsLocally(totalPoints);
      }
    } catch (err) {
      setQuizSubmitted(true);
    }
  };

  return (
    <div className="py-6 px-4 max-w-4xl mx-auto">
      {/* Top action row */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <button
          onClick={() => navigate('/van-hoa')}
          className="inline-flex items-center space-x-2 text-stone-600 hover:text-culture font-bold text-sm bg-white px-4 py-2.5 rounded-xl shadow-sm border border-cream-border transition-colors min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Góc Văn Hóa</span>
        </button>

        {/* Audio Narration Button for Kids */}
        <button
          onClick={handleToggleNarration}
          className={`inline-flex items-center space-x-2 px-5 py-2.5 rounded-full font-bold text-sm shadow-md transition-all min-h-[44px] ${
            isPlayingNarration
              ? 'bg-amber-500 text-white animate-pulse shadow-amber-300'
              : 'bg-gradient-to-r from-culture-dark to-culture text-white hover:brightness-105'
          }`}
        >
          {isPlayingNarration ? (
            <>
              <Pause className="w-4 h-4 fill-white" />
              <span>Dừng đọc chuyện</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4" />
              <span>Sao Lí Lắc kể chuyện bé nghe 🎧</span>
            </>
          )}
        </button>
      </div>

      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden mb-8 h-80 shadow-kid border-4 border-white">
        <img
          src={article.coverImage || 'https://images.unsplash.com/photo-1528127269322-539801943592?w=600'}
          alt={article.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col justify-end p-8 text-white">
          <div className="flex items-center space-x-2 mb-2">
            <span className="bg-accent text-stone-900 px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider">
              {article.category === 'am_thuc' ? 'Ẩm thực truyền thống' : article.category === 'le_hoi' ? 'Lễ hội dân gian' : 'Di sản văn hóa'}
            </span>
            {pointsResult !== null && (
              <span className="bg-emerald-500 text-white px-3 py-0.5 rounded-full text-xs font-bold flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Đã khám phá</span>
              </span>
            )}
          </div>
          <h1 className="text-kid-xl md:text-kid-2xl font-black font-display leading-tight drop-shadow-sm">
            {article.title}
          </h1>
          <p className="text-white/95 text-kid-sm mt-2 max-w-2xl leading-relaxed">
            {article.intro}
          </p>
        </div>
      </div>

      {/* 4 Fun Facts Cards */}
      <div className="mb-10">
        <div className="flex items-center space-x-2 text-culture font-bold text-kid-lg mb-4">
          <Lightbulb className="w-6 h-6 text-accent" />
          <span>{VI_LOCALES.culture.funFactsTitle}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {article.funFacts?.map((fact: string, idx: number) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-5 border-2 border-cream-border shadow-sm flex items-start space-x-3 hover:border-culture transition-all"
            >
              <span className="w-8 h-8 rounded-full bg-culture-light text-culture-dark font-black flex items-center justify-center flex-shrink-0 text-sm">
                {idx + 1}
              </span>
              <p className="text-stone-700 text-sm md:text-base font-semibold leading-relaxed">
                {fact}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Culture Quiz with Celebration */}
      {article.quiz && article.quiz.length > 0 && (
        <Card variant="kid" className="p-8 bg-white border-3 border-accent relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2 text-primary font-bold text-kid-lg">
              <Sparkles className="w-6 h-6 text-accent" />
              <span>Đố vui Văn hóa có thưởng</span>
            </div>
            <div className="bg-accent/30 text-stone-800 font-bold px-3 py-1 rounded-full text-xs flex items-center space-x-1">
              <Award className="w-4 h-4 text-accent-dark" />
              <span>+5 ViVi Points</span>
            </div>
          </div>

          <p className="text-stone-600 text-sm mb-6">
            {VI_LOCALES.culture.quizPrompt}
          </p>

          <div className="space-y-6 mb-6">
            {article.quiz.map((q: any, qIdx: number) => (
              <div key={qIdx} className="bg-cream-muted p-5 rounded-2xl border border-cream-border">
                <h4 className="font-bold text-stone-800 text-base mb-3 flex items-start space-x-2">
                  <span className="bg-accent/40 w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                    {qIdx + 1}
                  </span>
                  <span>{q.question}</span>
                </h4>

                <div className="space-y-2">
                  {q.options.map((opt: string, optIdx: number) => {
                    const isSelected = selectedAnswers[qIdx] === optIdx;
                    const isCorrect = quizSubmitted && optIdx === q.correctAnswer;
                    const isWrong = quizSubmitted && isSelected && optIdx !== q.correctAnswer;

                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectOption(qIdx, optIdx)}
                        disabled={quizSubmitted}
                        className={`w-full p-3.5 rounded-xl font-bold text-left text-sm border-2 transition-all flex items-center justify-between min-h-[48px] ${
                          isCorrect
                            ? 'bg-emerald-100 border-emerald-500 text-emerald-900 shadow-sm'
                            : isWrong
                            ? 'bg-red-100 border-red-500 text-red-800'
                            : isSelected
                            ? 'bg-accent/40 border-accent text-stone-900'
                            : 'bg-white border-cream-border hover:border-accent text-stone-700'
                        }`}
                      >
                        <span>{opt}</span>
                        {isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                      </button>
                    );
                  })}
                </div>

                {quizSubmitted && q.explanation && (
                  <div className="mt-3 p-3 bg-white rounded-xl text-xs text-stone-600 border border-emerald-200 flex items-start space-x-2">
                    <BookOpen className="w-4 h-4 text-culture flex-shrink-0 mt-0.5" />
                    <span><strong>Giải nghĩa:</strong> {q.explanation}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {!quizSubmitted ? (
            <Button
              variant="culture"
              size="lg"
              onClick={handleSubmitQuiz}
              disabled={Object.keys(selectedAnswers).length < article.quiz.length}
              className="w-full text-base font-bold shadow-md"
            >
              Gửi câu trả lời
            </Button>
          ) : (
            <div className="text-center p-6 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-300 rounded-3xl">
              <PartyPopper className="w-10 h-10 text-emerald-600 mx-auto mb-2 animate-bounce" />
              <span className="text-emerald-800 font-black text-lg block font-display">
                {pointsResult && pointsResult > 0
                  ? `🎉 Bé quá xuất sắc! Nhận được +${pointsResult} ViVi Points!`
                  : '🎉 Chúc mừng bé đã hoàn thành tìm hiểu di sản văn hóa!'}
              </span>
              <p className="text-emerald-700 text-xs mt-1">
                Điểm thưởng đã được cộng vào tài khoản của bé để đổi quà tại Tiệm ViVi!
              </p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
