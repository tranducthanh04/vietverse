import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  LogIn,
  AlertCircle,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { useChildStore } from '../../store/childStore.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { QueryErrorState } from '../../components/ui/QueryErrorState.js';
import { VI_LOCALES } from '../../locales/vi.js';

export const CultureDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeChild, updatePointsLocally } = useChildStore();
  const [viewId] = useState(() => crypto.randomUUID());

  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [pointsResult, setPointsResult] = useState<number | null>(null);
  const [isPlayingNarration, setIsPlayingNarration] = useState(false);
  const [narrationMode, setNarrationMode] = useState<'asset' | 'tts'>('asset');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const {
    data: article,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['cultureArticle', id, viewId],
    queryFn: async () => {
      const res = await api.get(`/culture/${id}`);
      return res.data.data;
    },
    enabled: !!id,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const handleToggleNarration = () => {
    // 1. If currently playing, stop whichever engine is active
    if (isPlayingNarration) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlayingNarration(false);
      return;
    }

    // 2. Try real audio asset first if available
    if (article?.audioUrl && audioRef.current && narrationMode === 'asset') {
      audioRef.current
        .play()
        .then(() => {
          setIsPlayingNarration(true);
        })
        .catch(() => {
          // If asset 404 or fails, fall back to Speech Synthesis
          setNarrationMode('tts');
          playTTS();
        });
      return;
    }

    // 3. Fallback to Speech Synthesis
    playTTS();
  };

  const playTTS = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !article) {
      alert('Trình duyệt không hỗ trợ phát giọng đọc tự động.');
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

  if (error) {
    return (
      <div className="py-12 px-4 max-w-xl mx-auto">
        <QueryErrorState
          error={error}
          onRetry={() => refetch()}
          title="Không thể tải bài văn hóa"
          message="Bài viết văn hóa này hiện chưa sẵn sàng. Bạn vui lòng thử lại nhé!"
        />
        <div className="text-center mt-4">
          <Button variant="outline" size="md" onClick={() => navigate('/van-hoa')}>
            Quay lại Góc Văn Hóa
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || !article) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-culture border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-stone-600 font-bold text-sm">Đang mở trang văn hóa...</span>
      </div>
    );
  }

  const handleSelectOption = (questionIdx: number, optionIdx: number) => {
    if (quizSubmitted) return;
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

      const { pointsAwarded, totalPoints } = res.data.data;
      setPointsResult(pointsAwarded);
      setQuizSubmitted(true);
      if (pointsAwarded > 0) {
        updatePointsLocally(totalPoints);
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        'Có lỗi kết nối khi gửi câu trả lời. Bé hãy thử bấm gửi lại nhé!';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-6 px-4 max-w-4xl mx-auto">
      {/* Real Audio Player element */}
      {article.audioUrl && (
        <audio
          ref={audioRef}
          src={article.audioUrl}
          preload="auto"
          onEnded={() => setIsPlayingNarration(false)}
          onError={() => {
            setNarrationMode('tts');
          }}
        />
      )}

      {/* Top action row */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <button
          onClick={() => navigate('/van-hoa')}
          className="inline-flex items-center space-x-2 text-stone-600 hover:text-culture font-bold text-sm bg-white px-4 py-2.5 rounded-xl shadow-sm border border-cream-border transition-colors min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Góc Văn Hóa</span>
        </button>

        {/* Audio Narration Button */}
        <div className="flex items-center space-x-2">
          {narrationMode === 'tts' && (
            <span className="text-[11px] font-bold text-stone-400 hidden sm:inline">
              (Giọng đọc trợ năng TTS)
            </span>
          )}
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
                <span>Sao Lí Lắc kể chuyện 🎧</span>
              </>
            )}
          </button>
        </div>
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
              {article.category === 'am_thuc'
                ? 'Ẩm thực truyền thống'
                : article.category === 'le_hoi'
                ? 'Lễ hội dân gian'
                : 'Di sản văn hóa'}
            </span>
            {pointsResult !== null && (
              <span className="bg-emerald-500 text-white px-3 py-0.5 rounded-full text-xs font-bold flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Đã khám phá</span>
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-black font-display drop-shadow-md">
            {article.title}
          </h1>
        </div>
      </div>

      {/* Intro section */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border-2 border-cream-border mb-8 shadow-sm">
        <div className="flex items-center space-x-2 text-culture font-bold text-sm mb-3 uppercase tracking-wider">
          <BookOpen className="w-4 h-4" />
          <span>Giới thiệu sự tích</span>
        </div>
        <p className="text-stone-700 leading-relaxed text-base md:text-lg font-medium">
          {article.intro}
        </p>
      </div>

      {/* Fun Facts Section */}
      {article.funFacts && article.funFacts.length > 0 && (
        <div className="mb-10">
          <h3 className="text-xl font-bold font-display text-stone-800 mb-4 flex items-center space-x-2">
            <Lightbulb className="w-6 h-6 text-amber-500" />
            <span>Có thể bé chưa biết?</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {article.funFacts.map((fact: string, idx: number) => (
              <div
                key={idx}
                className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex items-start space-x-3"
              >
                <div className="w-7 h-7 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <p className="text-stone-700 text-sm leading-relaxed">{fact}</p>
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
              <h3 className="text-xl font-black font-display text-stone-800">
                Thử Tài Khám Phá Văn Hóa
              </h3>
            </div>
            <span className="text-xs font-bold bg-culture-light/50 text-culture-dark px-3 py-1 rounded-full">
              Thưởng +5 ViVi Points
            </span>
          </div>

          <p className="text-stone-600 text-sm mb-6">
            Cùng trả lời các câu đố vui để kiểm tra sự am hiểu và rinh thêm điểm thưởng nhé!
          </p>

          <div className="space-y-6">
            {article.quiz.map((q: any, qIdx: number) => (
              <div key={qIdx} className="bg-white rounded-2xl p-5 border border-cream-border">
                <h4 className="font-bold text-stone-800 mb-3 text-base">
                  Câu {qIdx + 1}: {q.question}
                </h4>
                <div className="space-y-2">
                  {q.options.map((opt: string, optIdx: number) => {
                    const isSelected = selectedAnswers[qIdx] === optIdx;
                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectOption(qIdx, optIdx)}
                        disabled={quizSubmitted}
                        className={`w-full text-left p-3.5 rounded-xl border-2 text-sm font-semibold transition-all flex items-center justify-between min-h-[44px] ${
                          isSelected
                            ? 'bg-culture/10 border-culture text-culture-dark font-bold'
                            : 'bg-stone-50 border-transparent hover:border-stone-200 text-stone-700'
                        }`}
                      >
                        <span>{opt}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-culture" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {submitError && (
            <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-3 mt-4 text-sm flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Submission action */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            {!quizSubmitted ? (
              <>
                <span className="text-xs text-stone-400">
                  {activeChild
                    ? `Bé đang trả lời: ${Object.keys(selectedAnswers).length}/${article.quiz.length} câu`
                    : 'Đăng nhập tài khoản để nhận điểm thưởng vào kho báu'}
                </span>

                {activeChild ? (
                  <Button
                    variant="primary"
                    size="kid"
                    onClick={handleSubmitQuiz}
                    disabled={
                      Object.keys(selectedAnswers).length < article.quiz.length || isSubmitting
                    }
                    isLoading={isSubmitting}
                  >
                    <span>Gửi đáp án & Nhận điểm</span>
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => navigate(`/dang-nhap?redirect=/van-hoa/${id}`)}
                    className="flex items-center space-x-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Đăng nhập để nhận điểm</span>
                  </Button>
                )}
              </>
            ) : (
              <div className="w-full bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <PartyPopper className="w-8 h-8 text-emerald-600" />
                  <div>
                    <h4 className="font-bold text-emerald-800 text-base">
                      Tuyệt vời! Bé đã hoàn thành phần khám phá
                    </h4>
                    <p className="text-xs text-emerald-600">
                      {pointsResult && pointsResult > 0
                        ? `Bé nhận được +${pointsResult} ViVi Points!`
                        : 'Bé đã từng nhận thưởng cho câu đố này trước đây.'}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/van-hoa')}>
                  Khám phá thêm
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
