import { useState, useRef, useCallback, useEffect } from 'react';
import { api } from './api.js';

export interface UseAudioRecorderReturn {
  isRecording: boolean;
  isPlaying: boolean;
  audioBlob: Blob | null;
  audioUrl: string | null;
  durationSec: number;
  permissionStatus: 'prompt' | 'granted' | 'denied' | 'unsupported';
  errorMessage: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  clearRecording: () => void;
  playRecording: () => void;
  uploadRecording: (params: {
    childId: string;
    lessonId?: string;
    activityId?: string;
    wordOrPrompt?: string;
  }) => Promise<any>;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [durationSec, setDurationSec] = useState(0);
  const [permissionStatus, setPermissionStatus] = useState<
    'prompt' | 'granted' | 'denied' | 'unsupported'
  >('prompt');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      setPermissionStatus('unsupported');
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = useCallback(async () => {
    setErrorMessage(null);
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setDurationSec(0);
    audioChunksRef.current = [];

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPermissionStatus('unsupported');
      setErrorMessage('Trình duyệt chưa hỗ trợ ghi âm trực tiếp.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermissionStatus('granted');

      // Determine best supported mime type
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(finalBlob);
        setAudioBlob(finalBlob);
        setAudioUrl(url);
        setIsRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);

        // Stop all audio tracks to turn off microphone indicator
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start(200); // 200ms slice
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setDurationSec((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionStatus('denied');
        setErrorMessage('Không thể mở micro. Vui lòng cấp quyền micro để tiếp tục!');
      } else {
        setErrorMessage('Đã xảy ra sự cố khi khởi động micro.');
      }
      setIsRecording(false);
    }
  }, [audioUrl]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  }, [isRecording]);

  const clearRecording = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setDurationSec(0);
    setErrorMessage(null);
  }, [audioUrl]);

  const playRecording = useCallback(() => {
    if (!audioUrl) return;
    if (!audioElementRef.current) {
      audioElementRef.current = new Audio(audioUrl);
    } else {
      audioElementRef.current.src = audioUrl;
    }

    setIsPlaying(true);
    audioElementRef.current.play();
    audioElementRef.current.onended = () => setIsPlaying(false);
    audioElementRef.current.onerror = () => setIsPlaying(false);
  }, [audioUrl]);

  const uploadRecording = useCallback(
    async (params: {
      childId: string;
      lessonId?: string;
      activityId?: string;
      wordOrPrompt?: string;
    }) => {
      if (!audioBlob) {
        throw new Error('Chưa có bản ghi âm để tải lên');
      }

      const formData = new FormData();
      const ext = audioBlob.type.includes('mp4') ? 'mp4' : 'webm';
      formData.append('audio', audioBlob, `recording_${Date.now()}.${ext}`);
      formData.append('childId', params.childId);
      if (params.lessonId) formData.append('lessonId', params.lessonId);
      if (params.activityId) formData.append('activityId', params.activityId);
      if (params.wordOrPrompt) formData.append('wordOrPrompt', params.wordOrPrompt);
      formData.append('durationSec', durationSec.toString());

      const res = await api.post('/recordings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.data;
    },
    [audioBlob, durationSec]
  );

  return {
    isRecording,
    isPlaying,
    audioBlob,
    audioUrl,
    durationSec,
    permissionStatus,
    errorMessage,
    startRecording,
    stopRecording,
    clearRecording,
    playRecording,
    uploadRecording,
  };
}
