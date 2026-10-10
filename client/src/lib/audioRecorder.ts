import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuthStore } from '../store/authStore.js';
import { useChildStore } from '../store/childStore.js';
import { createDirectRecordingUpload, postCurrentRecordingRequest, recordingContextChanged, type RecordingContext, type RecordingReceipt } from './directRecordingUpload.js';

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
  uploadRecording: (params: RecordingContext) => Promise<RecordingReceipt>;
  restartExpiredUpload: () => void;
}
const identity = () => ({ userId: useAuthStore.getState().user?.id, childId: useChildStore.getState().activeChild?._id });

export function useAudioRecorder(sessionKey = ''): UseAudioRecorderReturn {
  const [isRecording,setIsRecording] = useState(false), [isPlaying,setIsPlaying] = useState(false);
  const [audioBlob,setAudioBlob] = useState<Blob | null>(null), [audioUrl,setAudioUrl] = useState<string | null>(null);
  const [durationSec,setDurationSec] = useState(0);
  const [permissionStatus,setPermissionStatus] = useState<UseAudioRecorderReturn['permissionStatus']>('prompt');
  const [errorMessage,setErrorMessage] = useState<string | null>(null);
  const mounted = useRef(false), generation = useRef(0), duration = useRef(0);
  const recorderRef = useRef<MediaRecorder | null>(null), streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const deadlineRef = useRef<ReturnType<typeof setTimeout> | null>(null), startedAt = useRef<number | null>(null);
  const urlRef = useRef<string | null>(null), playerRef = useRef<HTMLAudioElement | null>(null);
  const sessionRef = useRef(sessionKey), previousSession = useRef(sessionKey);
  sessionRef.current = sessionKey;
  const captured = useRef<{ userId?: string; childId?: string; generation: number; sessionKey: string } | null>(null);
  const taskRef = useRef<{ blob: Blob; key: string; task: ReturnType<typeof createDirectRecordingUpload> } | null>(null);

  const release = useCallback(() => {
    if (timerRef.current !== null) { clearInterval(timerRef.current); timerRef.current = null; }
    if (deadlineRef.current !== null) { clearTimeout(deadlineRef.current); deadlineRef.current = null; }
    startedAt.current = null;
    const recorder = recorderRef.current;
    if (recorder) {
      recorder.onstop = null; recorder.ondataavailable = null;
      if (recorder.state === 'recording' || recorder.state === 'paused') recorder.stop();
      recorderRef.current = null;
    }
    streamRef.current?.getTracks().forEach(track => track.stop()); streamRef.current = null;
    playerRef.current?.pause(); playerRef.current = null;
  },[]);
  const clearRecording = useCallback(() => {
    generation.current++; captured.current = null; taskRef.current = null; release();
    if (urlRef.current) URL.revokeObjectURL(urlRef.current); urlRef.current = null;
    setAudioBlob(null); setAudioUrl(null); setDurationSec(0); setIsRecording(false); setIsPlaying(false); setErrorMessage(null);
  },[release]);
  useEffect(() => {
    mounted.current = true;
    if (!navigator.mediaDevices || !window.MediaRecorder) setPermissionStatus('unsupported');
    const unsubscribeAuth = useAuthStore.subscribe((state,previous) => { if (state.user?.id !== previous.user?.id) clearRecording(); });
    const unsubscribeChild = useChildStore.subscribe((state,previous) => { if (state.activeChild?._id !== previous.activeChild?._id) clearRecording(); });
    return () => {
      mounted.current = false; generation.current++; unsubscribeAuth(); unsubscribeChild(); release();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  },[clearRecording,release]);
  useEffect(() => {
    if (previousSession.current !== sessionKey) clearRecording();
    previousSession.current = sessionKey;
  },[sessionKey,clearRecording]);
  useEffect(() => {
    const stopForBackground = () => { if (recorderRef.current?.state === 'recording') recorderRef.current.stop(); };
    const visibility = () => { if (document.visibilityState === 'hidden') stopForBackground(); };
    document.addEventListener('visibilitychange',visibility);
    window.addEventListener('pagehide',stopForBackground);
    return () => { document.removeEventListener('visibilitychange',visibility); window.removeEventListener('pagehide',stopForBackground); };
  },[]);
  const startRecording = useCallback(async () => {
    clearRecording(); duration.current = 0;
    const start = { ...identity(), generation: generation.current, sessionKey };
    const current = () => mounted.current && generation.current === start.generation && sessionRef.current === start.sessionKey && identity().userId === start.userId && identity().childId === start.childId;
    if (!navigator.mediaDevices?.getUserMedia) { setPermissionStatus('unsupported'); setErrorMessage('Trình duyệt chưa hỗ trợ ghi âm trực tiếp.'); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
      if (!current()) { stream.getTracks().forEach(track => track.stop()); return; }
      streamRef.current = stream; setPermissionStatus('granted'); captured.current = start;
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : 'audio/webm';
      const recorder = new MediaRecorder(stream,{ mimeType }); recorderRef.current = recorder;
      const chunks: Blob[] = [];
      recorder.ondataavailable = event => { if (current() && event.data.size > 0) chunks.push(event.data); };
      recorder.onstop = () => {
        if (!current()) return;
        duration.current = Math.ceil((performance.now() - (startedAt.current ?? performance.now())) / 1000);
        setDurationSec(duration.current);
        const blob = new Blob(chunks,{ type:mimeType });
        const url = URL.createObjectURL(blob); urlRef.current = url;
        setAudioBlob(blob); setAudioUrl(url); setIsRecording(false);
        if (blob.size > 5 * 1024 * 1024) setErrorMessage('Bản thu âm vượt quá 5 MiB. Bé hãy thu âm ngắn hơn nhé!');
        if (duration.current > 180) setErrorMessage('Trình duyệt đã trì hoãn dừng micro; bản thu vượt 180 giây. Vui lòng thu âm lại.');
        release();
      };
      recorder.start(200); startedAt.current = performance.now(); setIsRecording(true);
      // One-second margin for container/stop latency; server still enforces180s.
      deadlineRef.current = setTimeout(() => { if (current() && recorder.state === 'recording') recorder.stop(); },179000);
      timerRef.current = setInterval(() => {
        duration.current = Math.floor((performance.now() - startedAt.current!) / 1000); setDurationSec(duration.current);
        if (duration.current >= 179 && recorder.state === 'recording') recorder.stop();
      },250);
    } catch (error) {
      if (!current()) return;
      release(); setIsRecording(false);
      const name = (error as { name?: string }).name;
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') { setPermissionStatus('denied'); setErrorMessage('Không thể mở micro. Vui lòng cấp quyền micro để tiếp tục!'); }
      else setErrorMessage('Đã xảy ra sự cố khi khởi động micro.');
    }
  },[clearRecording,release,sessionKey]);
  const stopRecording = useCallback(() => { if (recorderRef.current?.state === 'recording') recorderRef.current.stop(); },[]);
  const playRecording = useCallback(() => {
    if (!audioUrl) return;
    playerRef.current?.pause();
    const player = new Audio(audioUrl); playerRef.current = player; setIsPlaying(true);
    player.onended = player.onerror = () => { if (mounted.current) setIsPlaying(false); };
    void player.play().catch(() => { if (mounted.current) setIsPlaying(false); });
  },[audioUrl]);
  const uploadRecording = useCallback(async (params: RecordingContext) => {
    if (!audioBlob) throw new Error('Chưa có bản ghi âm để tải lên');
    const owner = captured.current;
    const current = () => !!owner?.userId && mounted.current && owner.generation === generation.current && owner.sessionKey === sessionRef.current && owner.userId === identity().userId && owner.childId === identity().childId && owner.childId === params.childId;
    if (!current()) throw recordingContextChanged();
    const direct = import.meta.env.PROD || import.meta.env.VITE_DIRECT_RECORDING_UPLOAD === 'true';
    const limit = (direct ? 5 : 2) * 1024 * 1024;
    if (!audioBlob.size || audioBlob.size > limit) throw new Error(`Bản thu âm vượt giới hạn ${direct ? 5 : 2} MiB.`);
    if (direct) {
      const context = { ...params,durationSec }, key = JSON.stringify(context);
      if (taskRef.current?.blob !== audioBlob || taskRef.current?.key !== key) taskRef.current = { blob:audioBlob,key,task:createDirectRecordingUpload(audioBlob,context,current) };
      return taskRef.current.task.submit();
    }
    const form = new FormData();
    form.append('audio',audioBlob,audioBlob.type.includes('mp4') ? 'recording.mp4' : 'recording.webm');
    for (const [key,value] of Object.entries(params)) if (value !== undefined) form.append(key,String(value));
    form.append('durationSec',String(durationSec));
    return postCurrentRecordingRequest<RecordingReceipt>('/recordings',form,current,{ headers:{ 'Content-Type':'multipart/form-data' } });
  },[audioBlob,durationSec]);
  const restartExpiredUpload = useCallback(() => {
    if (!taskRef.current || taskRef.current.blob !== audioBlob) throw recordingContextChanged();
    taskRef.current.task.restartExpired();
  },[audioBlob]);
  return { isRecording,isPlaying,audioBlob,audioUrl,durationSec,permissionStatus,errorMessage,startRecording,stopRecording,clearRecording,playRecording,uploadRecording,restartExpiredUpload };
}
