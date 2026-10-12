import { useCallback, useEffect, useRef, useState } from "react";

let activeStop: (() => void) | undefined;

export function useNarration({
  audioUrl,
  text = "",
  lang = "vi-VN",
  contentKey = "",
}: {
  audioUrl?: string;
  text?: string | string[];
  lang?: string;
  contentKey?: string;
}) {
  const textKey = JSON.stringify(text);
  const audioRef = useRef<HTMLAudioElement>(null);
  const session = useRef(0);
  const running = useRef(false);
  const failedAsset = useRef(false);
  const usingSpeech = useRef(false);
  const cancelVoiceWait = useRef<(() => void) | undefined>(undefined);
  const [isPlaying, setPlaying] = useState(false);
  const [mode, setMode] = useState<"asset" | "tts">(audioUrl ? "asset" : "tts");
  const [error, setError] = useState("");
  const [segmentIndex, setSegmentIndex] = useState(-1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const speechAvailable =
    typeof window.speechSynthesis !== "undefined" &&
    typeof window.SpeechSynthesisUtterance !== "undefined";
  const hasText = (Array.isArray(text) ? text : [text]).some((part) =>
    part.trim(),
  );

  const stop = useCallback(() => {
    session.current += 1;
    running.current = false;
    cancelVoiceWait.current?.();
    cancelVoiceWait.current = undefined;
    audioRef.current?.pause();
    // An old component must never cancel the voice now owned by another reader.
    if (activeStop === stop) {
      activeStop = undefined;
      if (usingSpeech.current) window.speechSynthesis?.cancel();
    }
    setPlaying(false);
    setSegmentIndex(-1);
  }, []);

  useEffect(() => {
    failedAsset.current = false;
    usingSpeech.current = false;
    setMode(audioUrl ? "asset" : "tts");
    setError("");
    setCurrentTime(0);
    const audio = audioRef.current;
    setDuration(audio && Number.isFinite(audio.duration) ? audio.duration : 0);
    if (audio) audio.currentTime = 0;
    return () => {
      stop();
      audio?.pause();
    };
  }, [audioUrl, textKey, lang, contentKey, stop]);

  const speak = (token: number) => {
    if (token !== session.current || !running.current || usingSpeech.current)
      return;
    usingSpeech.current = true;
    audioRef.current?.pause();
    setMode("tts");
    setCurrentTime(0);
    const fail = (message: string) => {
      if (token !== session.current) return;
      stop();
      setError(message);
    };
    if (!speechAvailable || !hasText) {
      fail(
        "Chưa có âm thanh khả dụng. Thiết bị không hỗ trợ đọc nội dung này.",
      );
      return;
    }
    const synth = window.speechSynthesis;
    const parts: string | string[] = JSON.parse(textKey);
    const lines = Array.isArray(parts) ? parts : [parts];
    // Short chunks avoid browser limits; retain the source line for honest highlighting.
    const chunks = lines.flatMap((line, index) =>
      (line.match(/.{1,180}(?:\s|$)|\S{1,180}/gu) ?? [])
        .filter((part) => part.trim())
        .map((part) => ({ text: part.trim(), index })),
    );
    const readWithVoice = (voice: SpeechSynthesisVoice) => {
      const read = (index: number) => {
        if (token !== session.current || !running.current) return;
        if (index >= chunks.length) {
          stop();
          return;
        }
        const utterance = new SpeechSynthesisUtterance(chunks[index].text);
        utterance.lang = lang;
        utterance.voice = voice;
        utterance.rate = 0.85;
        utterance.onstart = () => {
          if (token === session.current) setSegmentIndex(chunks[index].index);
        };
        utterance.onend = () => read(index + 1);
        utterance.onerror = () =>
          fail("Không phát được giọng đọc thiết bị. Hãy thử lại.");
        try {
          synth.speak(utterance);
        } catch {
          fail("Không phát được giọng đọc thiết bị.");
        }
      };
      read(0);
    };
    const findVoice = () => {
      const voices = synth.getVoices();
      const locale = lang.toLowerCase();
      return (
        voices.find((voice) => voice.lang.toLowerCase() === locale) ??
        voices.find(
          (voice) =>
            voice.lang.toLowerCase().split("-")[0] === locale.split("-")[0],
        )
      );
    };
    const voice = findVoice();
    if (voice) {
      readWithVoice(voice);
      return;
    }
    // Voice inventories load asynchronously in some browsers. Never use a wrong-language default.
    const cleanup = () => {
      clearTimeout(timer);
      synth.removeEventListener("voiceschanged", onVoices);
      cancelVoiceWait.current = undefined;
    };
    const onVoices = () => {
      if (token !== session.current) return;
      const readyVoice = findVoice();
      if (readyVoice) {
        cleanup();
        readWithVoice(readyVoice);
      }
    };
    const timer = setTimeout(() => {
      cleanup();
      fail(
        `Thiết bị chưa có giọng đọc ${lang}. Hãy cài giọng đọc phù hợp hoặc dùng bản audio.`,
      );
    }, 1500);
    cancelVoiceWait.current = cleanup;
    synth.addEventListener("voiceschanged", onVoices);
  };

  const onError = () => {
    failedAsset.current = true;
    setMode("tts");
    if (running.current) speak(session.current);
    else
      setError(
        "Chưa phát được audio. Bé có thể dùng giọng đọc thiết bị nếu có hoặc đọc nội dung trên màn hình.",
      );
  };
  const toggle = () => {
    if (running.current) {
      stop();
      return;
    }
    activeStop?.();
    activeStop = stop;
    const token = ++session.current;
    running.current = true;
    usingSpeech.current = false;
    setPlaying(true);
    setError("");
    const audio = audioRef.current;
    if (audioUrl && audio && !failedAsset.current) {
      setMode("asset");
      try {
        void audio.play().catch(() => {
          if (token === session.current) onError();
        });
      } catch {
        if (token === session.current) onError();
      }
    } else {
      speak(token);
    }
  };
  const reset = () => {
    stop();
    if (audioRef.current) audioRef.current.currentTime = 0;
    setCurrentTime(0);
  };
  const seek = (time: number) => {
    if (mode !== "asset" || !audioRef.current || !Number.isFinite(time)) return;
    audioRef.current.currentTime = Math.max(0, Math.min(time, duration));
    setCurrentTime(audioRef.current.currentTime);
  };

  return {
    audioRef,
    mode,
    isPlaying,
    error,
    segmentIndex,
    currentTime,
    duration,
    canPlay: (mode === "asset" && !!audioUrl) || (speechAvailable && hasText),
    toggle,
    stop,
    reset,
    seek,
    audioEvents: {
      onError,
      onEnded: () => {
        if (!usingSpeech.current) reset();
      },
      onTimeUpdate: () => {
        if (!usingSpeech.current)
          setCurrentTime(audioRef.current?.currentTime ?? 0);
      },
      onLoadedMetadata: () => {
        const value = audioRef.current?.duration;
        setDuration(value && Number.isFinite(value) ? value : 0);
      },
    },
  };
}
