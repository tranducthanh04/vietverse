import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Play,
  Pause,
  RotateCcw,
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
  Volume2,
  LogIn,
} from "lucide-react";
import { api } from "../../lib/api.js";
import { useChildStore } from "../../store/childStore.js";
import { Card } from "../../components/ui/Card.js";
import { Button } from "../../components/ui/Button.js";
import { QueryErrorState } from "../../components/ui/QueryErrorState.js";
import { CoverPlaceholder } from "../../components/ui/CoverPlaceholder.js";
import { VI_LOCALES } from "../../locales/vi.js";
import { useNarration } from "../../hooks/useNarration.js";

export const StoryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
          title="Không thể tải truyện"
          message="Bài đồng dao hoặc truyện này hiện chưa sẵn sàng. Bé và ba mẹ vui lòng thử lại nhé!"
        />
        <div className="text-center mt-4">
          <Button
            variant="outline"
            size="md"
            onClick={() => navigate("/kho-truyen")}
          >
            Quay lại kho truyện
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || !story) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-stone-600 font-bold text-sm">
          Đang mở trang truyện cho bé...
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
      {story.audioUrl && (
        <audio
          key={story.audioUrl}
          ref={narration.audioRef}
          src={story.audioUrl}
          preload="auto"
          {...narration.audioEvents}
        />
      )}

      {/* Back button */}
      <button
        onClick={() => navigate("/kho-truyen")}
        className="inline-flex items-center space-x-2 text-stone-600 hover:text-primary font-bold mb-6 min-h-[44px]"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Quay lại kho truyện</span>
      </button>

      {/* Main Story Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Side: Cover & Controls */}
        <div className="md:col-span-1 flex flex-col items-center">
          {story.coverImage ? (
            <img
              src={story.coverImage}
              alt={story.title}
              className="w-full max-w-xs rounded-3xl shadow-kid border-4 border-white mb-6 object-cover h-64"
            />
          ) : (
            <CoverPlaceholder
              kind="story"
              variant={story.type}
              className="w-full max-w-xs rounded-3xl shadow-kid border-4 border-white mb-6 h-64"
            />
          )}

          <h2 className="text-kid-lg font-bold font-display text-center text-stone-800 mb-1">
            {story.title}
          </h2>
          <span className="text-xs text-stone-500 font-semibold mb-4">
            Tác giả: {story.author || "Dân gian Việt Nam"}
          </span>

          {/* Audio Mode Badge */}
          <div className="mb-4">
            {audioUnavailable ? (
              <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full inline-flex items-center space-x-1">
                <span>Chế độ đọc: chưa có âm thanh khả dụng</span>
              </span>
            ) : narration.mode === "tts" ? (
              <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full inline-flex items-center space-x-1">
                <span>Giọng đọc thiết bị</span>
              </span>
            ) : (
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full inline-flex items-center space-x-1">
                <Volume2 className="w-3.5 h-3.5" />
                <span>Audio Studio Vietverse</span>
              </span>
            )}
          </div>

          {narration.error && (
            <p role="status" className="text-sm text-amber-800 mb-3">
              {narration.error}
            </p>
          )}

          {/* Karaoke Play / Pause Controls */}
          <div className="flex flex-col items-center space-y-3 w-full max-w-xs bg-white p-4 rounded-3xl border-2 border-cream-border shadow-sm">
            <div className="flex items-center justify-center space-x-4 w-full">
              <button
                onClick={narration.toggle}
                disabled={audioUnavailable}
                className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-kid-primary hover:scale-105 active:scale-95 transition-transform min-h-[56px] min-w-[56px]"
                aria-label={
                  narration.isPlaying
                    ? narration.mode === "tts"
                      ? "Dừng đọc"
                      : "Tạm dừng"
                    : "Bắt đầu nghe"
                }
              >
                {narration.isPlaying ? (
                  <Pause className="w-7 h-7" />
                ) : (
                  <Play className="w-7 h-7 fill-white ml-0.5" />
                )}
              </button>

              <button
                onClick={narration.reset}
                disabled={audioUnavailable}
                className="p-3 text-stone-500 hover:text-stone-800 rounded-full hover:bg-stone-100 transition-colors min-h-[44px] min-w-[44px]"
                aria-label="Nghe lại từ đầu"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>

            {/* Audio Seek Timeline */}
            <div className="w-full space-y-1">
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
                className="w-full accent-primary h-2 bg-stone-200 rounded-lg cursor-pointer"
                aria-label="Tua thời gian bài đồng dao"
              />
              {narration.mode === "asset" && narration.duration > 0 ? (
                <div className="flex justify-between text-[11px] font-mono font-bold text-stone-500">
                  <span>{Math.floor(narration.currentTime)}s</span>
                  <span>{Math.floor(narration.duration)}s</span>
                </div>
              ) : (
                <p className="text-xs text-stone-500">
                  {narration.mode === "tts"
                    ? "Đọc từng dòng; dừng rồi bấm nghe để đọc lại từ đầu."
                    : "Đang chờ thời lượng bản audio."}
                </p>
              )}
            </div>
          </div>

          {/* Vocabulary chips */}
          {story.vocab && story.vocab.length > 0 && (
            <div className="mt-6 w-full bg-white p-4 rounded-2xl border border-cream-border shadow-2xs">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-2">
                Từ vựng nổi bật
              </span>
              <div className="flex flex-wrap gap-2">
                {story.vocab.map((v: string, i: number) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-amber-50 text-stone-800 border border-amber-200 rounded-xl text-xs font-bold"
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
          <Card
            variant="kid"
            className="p-8 bg-white border-3 border-accent min-h-[360px] flex flex-col justify-center"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-accent-dark">
                {audioUnavailable || narration.mode === "tts"
                  ? "Cùng đọc truyện"
                  : VI_LOCALES.stories.karaokeMode}
              </span>
              {narration.isPlaying && narration.mode === "asset" && (
                <span className="flex items-center space-x-1 text-xs font-bold text-primary animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span>Đang phát lời theo nhạc</span>
                </span>
              )}
            </div>

            <div className="space-y-4">
              {story.lyrics.map((line: any, idx: number) => {
                const isActive = idx === currentLineIndex;

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl transition-all duration-300 ${
                      isActive
                        ? "bg-amber-100/90 text-primary scale-102 border-l-4 border-primary pl-4 font-black text-kid-lg shadow-sm"
                        : "text-stone-600 font-bold text-kid-base"
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
            <Card
              variant="default"
              className="p-6 bg-gradient-to-br from-cream to-white border-2 border-cream-border"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2 text-primary font-bold text-base">
                  <HelpCircle className="w-5 h-5" />
                  <span>{VI_LOCALES.stories.quizTitle}</span>
                </div>

                {!activeChild && (
                  <Link
                    to={`/dang-nhap?redirect=/kho-truyen/${id}`}
                    className="text-xs font-bold text-primary hover:underline flex items-center space-x-1"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Đăng nhập để nhận điểm</span>
                  </Link>
                )}
              </div>

              <h4 className="text-kid-base font-bold font-display text-stone-800 mb-4">
                {currentQuiz.question}
              </h4>

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
                      className={`w-full p-4 rounded-2xl font-bold font-display text-left border-2 transition-all flex items-center justify-between min-h-[50px] ${
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
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      )}
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
