import { useCallback, useEffect, useRef, useState } from "react";
import { useT } from "../i18n/index.js";
import { resolveMediaUrl } from "../lib/mediaUrl.js";

let activeStop: (() => void) | undefined;
// Media players outside this hook (e.g. parent recordings) share the single-reader rule.
export function claimPlayback(stop: () => void) {
  if (activeStop !== stop) activeStop?.();
  activeStop = stop;
}
export function releasePlayback(stop: () => void) {
  if (activeStop === stop) activeStop = undefined;
}
// iOS blocks TTS that is not started inside a user gesture and then never fires onstart.
export const SPEECH_START_TIMEOUT_MS = 2500;
// Android reports "vi_VN"; BCP 47 uses "vi-VN".
export const normalizeVoiceLang = (value: string) =>
  value.replace(/_/g, "-").toLowerCase();
let speechUnlocked = false;
const isIOS = () =>
  typeof navigator !== "undefined" &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

export function useNarration({
  audioUrl,
  text = "",
  lang = "vi-VN",
  contentKey = "",
  autoPlay = false,
}: {
  audioUrl?: string;
  text?: string | string[];
  lang?: string;
  contentKey?: string;
  // When true, auto-read the primary source once each time the content identity changes. Blocked
  // playback stays silent (no error, speaker still tappable); it never fires from an asset error.
  autoPlay?: boolean;
}) {
  const t = useT();
  // DB stores app-relative media URLs ("/api/..."); rebase them onto the API origin so the <audio>
  // element loads from the right host when the SPA and API are on different domains.
  const resolvedAudioUrl = resolveMediaUrl(audioUrl);
  const textKey = JSON.stringify(text);
  const audioRef = useRef<HTMLAudioElement>(null);
  const session = useRef(0);
  const running = useRef(false);
  const failedAsset = useRef(false);
  const usingSpeech = useRef(false);
  // Set while an autoplay attempt is in flight so blocked/failed playback never surfaces an error
  // or a speech fallback. Reset by every manual start, so tapping the speaker reports errors again.
  const suppressErrors = useRef(false);
  // Holds the latest start() so the autoplay effect can call it without re-subscribing every render.
  const startRef = useRef<(options?: { silent?: boolean }) => void>(() => {});
  const cancelVoiceWait = useRef<(() => void) | undefined>(undefined);
  const speechWatchdog = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const [isPlaying, setPlaying] = useState(false);
  const [mode, setMode] = useState<"asset" | "tts">(resolvedAudioUrl ? "asset" : "tts");
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
  // Opening an activity auto-reads its primary source once, but only when there is something to read.
  const autoPlayable = !!resolvedAudioUrl || (speechAvailable && hasText);

  const stop = useCallback(() => {
    session.current += 1;
    running.current = false;
    cancelVoiceWait.current?.();
    cancelVoiceWait.current = undefined;
    clearTimeout(speechWatchdog.current);
    speechWatchdog.current = undefined;
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
    setMode(resolvedAudioUrl ? "asset" : "tts");
    setError("");
    setCurrentTime(0);
    const audio = audioRef.current;
    setDuration(audio && Number.isFinite(audio.duration) ? audio.duration : 0);
    if (audio) audio.currentTime = 0;
    return () => {
      stop();
      audio?.pause();
    };
  }, [resolvedAudioUrl, textKey, lang, contentKey, stop]);

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
      // A silently-blocked autoplay must not greet the child with an error.
      if (!suppressErrors.current) setError(message);
    };
    if (!speechAvailable || !hasText) {
      fail(t("audio.cantRead"));
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
        let started = false;
        const settle = () => {
          started = true;
          clearTimeout(speechWatchdog.current);
        };
        utterance.onstart = () => {
          settle();
          if (token === session.current) setSegmentIndex(chunks[index].index);
        };
        utterance.onend = () => {
          settle();
          read(index + 1);
        };
        utterance.onerror = () => {
          settle();
          fail(t("audio.tryAgain"));
        };
        try {
          synth.speak(utterance);
        } catch {
          fail(t("audio.tryAgain"));
          return;
        }
        // Watchdog: a blocked engine never starts; release the "Dừng đọc" state.
        if (!started) {
          clearTimeout(speechWatchdog.current);
          speechWatchdog.current = setTimeout(() => {
            if (!started && token === session.current) fail(t("audio.tryAgain"));
          }, SPEECH_START_TIMEOUT_MS);
        }
      };
      read(0);
    };
    const findVoice = () => {
      const voices = synth.getVoices();
      const locale = normalizeVoiceLang(lang);
      return (
        voices.find((voice) => normalizeVoiceLang(voice.lang) === locale) ??
        voices.find(
          (voice) =>
            normalizeVoiceLang(voice.lang).split("-")[0] ===
            locale.split("-")[0],
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
      fail(t("audio.cantRead"));
    }, 1500);
    cancelVoiceWait.current = cleanup;
    synth.addEventListener("voiceschanged", onVoices);
  };

  const onError = () => {
    failedAsset.current = true;
    setMode("tts");
    // Autoplay must never turn a blocked or failed asset into speech or an error: no autoplay from a
    // preload error, no fallback loop. Stay silent and leave the speaker ready for a tap.
    if (suppressErrors.current) {
      stop();
      return;
    }
    if (running.current) speak(session.current);
    else setError(t("audio.assetFailed"));
  };
  // Begin playback from the current position. Must run synchronously inside a user gesture so that
  // later speak() calls (voice discovery, asset fallback) are allowed by iOS Safari.
  const start = ({ silent = false }: { silent?: boolean } = {}) => {
    // Silent = autoplay with no user gesture: swallow blocked/failed playback instead of warning.
    suppressErrors.current = silent;
    claimPlayback(stop);
    if (!silent && !speechUnlocked && speechAvailable && hasText && isIOS()) {
      speechUnlocked = true;
      try {
        const unlock = new SpeechSynthesisUtterance("");
        unlock.volume = 0;
        window.speechSynthesis.speak(unlock);
      } catch {
        /* Unlock is best effort; the watchdog reports a blocked engine. */
      }
    }
    const token = ++session.current;
    running.current = true;
    usingSpeech.current = false;
    setPlaying(true);
    setError("");
    const audio = audioRef.current;
    if (resolvedAudioUrl && audio && !failedAsset.current) {
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
  startRef.current = start;
  // Auto-read the primary source once whenever the content identity changes. Rerenders with the same
  // content do not re-run this effect, so it never loops; the reset effect above already stops the
  // previous activity's audio on change or unmount, so no cleanup is needed here.
  useEffect(() => {
    if (!autoPlay || !autoPlayable) return;
    startRef.current({ silent: true });
  }, [autoPlay, autoPlayable, resolvedAudioUrl, textKey, lang, contentKey]);
  const toggle = () => {
    if (running.current) {
      stop();
      return;
    }
    start();
  };
  // Restart the question audio from the beginning, cancelling any in-flight playback first.
  // Used to replay the source audio once after a wrong answer; each call plays exactly once.
  const replay = () => {
    stop();
    if (audioRef.current) audioRef.current.currentTime = 0;
    start();
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
    // The resolved, origin-absolute URL to set on the <audio src>. Use this instead of the raw
    // audioUrl so playback works when the API lives on a different domain than the SPA.
    audioSrc: resolvedAudioUrl,
    mode,
    isPlaying,
    error,
    segmentIndex,
    currentTime,
    duration,
    canPlay: (mode === "asset" && !!resolvedAudioUrl) || (speechAvailable && hasText),
    toggle,
    replay,
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
