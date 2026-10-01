import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Sparkles, CheckCircle2, Award, Lightbulb } from 'lucide-react';
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

  const { data: article, isLoading } = useQuery({
    queryKey: ['cultureArticle', id],
    queryFn: async () => {
      const res = await api.get(`/culture/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });

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
      {/* Back button */}
      <button
        onClick={() => navigate('/van-hoa')}
        className="inline-flex items-center space-x-2 text-stone-600 hover:text-culture font-bold mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Quay lại Góc Văn Hóa</span>
      </button>

      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden mb-8 h-72 shadow-kid">
        <img
          src={article.coverImage || 'https://images.unsplash.com/photo-1528127269322-539801943592?w=600'}
          alt={article.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-8 text-white">
          <span className="text-xs font-bold uppercase tracking-wider text-accent mb-2">
            Di sản Văn hóa Việt Nam
          </span>
          <h1 className="text-kid-xl md:text-kid-2xl font-black font-display leading-tight">
            {article.title}
          </h1>
          <p className="text-white/90 text-kid-sm mt-2 max-w-2xl">
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
              className="bg-white rounded-2xl p-5 border-2 border-cream-border shadow-sm flex items-start space-x-3"
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

      {/* Culture Quiz */}
      {article.quiz && article.quiz.length > 0 && (
        <Card variant="kid" className="p-8 bg-white border-3 border-accent">
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
                <h4 className="font-bold text-stone-800 text-base mb-3">
                  Câu {qIdx + 1}: {q.question}
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
                        className={`w-full p-3.5 rounded-xl font-bold text-left text-sm border-2 transition-all flex items-center justify-between min-h-[46px] ${
                          isCorrect
                            ? 'bg-emerald-100 border-emerald-500 text-emerald-800'
                            : isWrong
                            ? 'bg-red-100 border-red-500 text-red-800'
                            : isSelected
                            ? 'bg-accent/40 border-accent text-stone-900'
                            : 'bg-white border-cream-border hover:border-accent text-stone-700'
                        }`}
                      >
                        <span>{opt}</span>
                        {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {!quizSubmitted ? (
            <Button
              variant="culture"
              size="lg"
              onClick={handleSubmitQuiz}
              disabled={Object.keys(selectedAnswers).length < article.quiz.length}
              className="w-full"
            >
              Gửi câu trả lời
            </Button>
          ) : (
            <div className="text-center p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <span className="text-emerald-700 font-bold text-base block">
                {pointsResult && pointsResult > 0
                  ? `🎉 Xuất sắc! Bé đã nhận được +${pointsResult} ViVi Points!`
                  : 'Bé đã hoàn thành phần đố vui văn hóa!'}
              </span>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
