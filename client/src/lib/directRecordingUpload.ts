import axios, { type AxiosRequestConfig } from 'axios';
import { api } from './api.js';

export type RecordingContext = { childId: string; lessonId?: string; activityId?: string; contentVersion?: number; wordOrPrompt?: string };
export type RecordingReceipt = { id: string; _id?: string; url?: string; durationSec?: number; contentVersion?: number };
export const recordingContextChanged = () => Object.assign(new Error('Phiên thu âm đã thay đổi. Vui lòng thu âm lại cho hồ sơ hiện tại.'), { code: 'RECORDING_CONTEXT_CHANGED' });
const assertCurrent = (isCurrent: () => boolean) => { if (!isCurrent()) throw recordingContextChanged(); };
// The child's voice can be large on slow links; allow more than the default 30s API timeout.
export const RECORDING_UPLOAD_TIMEOUT_MS = 60_000;
export const RECORDING_MAX_BYTES = 5 * 1024 * 1024;

// Guard dispatch, including refresh/queued retries, not only the api.post call.
export async function postCurrentRecordingRequest<T>(path: string, body: unknown, isCurrent: () => boolean, config: AxiosRequestConfig = {}): Promise<T> {
  assertCurrent(isCurrent);
  const adapter = axios.getAdapter(api.defaults.adapter);
  const response = await api.post<{ data: T }>(path, body, { ...config, adapter: async request => {
    assertCurrent(isCurrent);
    return adapter(request);
  } });
  assertCurrent(isCurrent);
  return response.data.data;
}

function recordingFilename(type: string) {
  if (type.includes('mp4') || type.includes('m4a')) return 'recording.m4a';
  if (type.includes('ogg')) return 'recording.ogg';
  if (type.includes('wav')) return 'recording.wav';
  if (type.includes('mpeg') || type.includes('mp3')) return 'recording.mp3';
  return 'recording.webm';
}

/**
 * A single multipart upload of the child's recording to the backend's own storage
 * (`POST /recordings/upload`). The server validates the format by magic bytes, enforces the size
 * limit and reads the true duration server-side, then returns the saved recording. There is no
 * Cloudinary intent/finalize round-trip any more.
 *
 * Safe retry: one in-flight request is shared, so repeated `submit()` calls never fire concurrent
 * duplicate uploads; a success is cached so a later submit returns the same receipt without
 * re-uploading. A failed attempt clears the in-flight promise, so the child can simply press
 * "send again" to retry with the same blob. Axios error codes (`ERR_NETWORK`, `ECONNABORTED`) and a
 * `503 AUDIO_STORAGE_UNAVAILABLE` response are surfaced unchanged for the UI to map to friendly copy.
 */
export function createDirectRecordingUpload(blob: Blob, context: RecordingContext & { durationSec?: number }, isCurrent: () => boolean) {
  let inFlight: Promise<RecordingReceipt> | undefined, receipt: RecordingReceipt | undefined;
  const run = async () => {
    assertCurrent(isCurrent);
    if (receipt) return receipt;
    if (!blob.size || blob.size > RECORDING_MAX_BYTES) throw new Error('Bản thu âm phải nhỏ hơn hoặc bằng 5 MiB.');
    if ((context.durationSec ?? 0) > 180) throw new Error('Bản thu âm không được vượt quá 180 giây.');
    const form = new FormData();
    form.append('audio', blob, recordingFilename(blob.type));
    form.append('childId', context.childId);
    if (context.lessonId) form.append('lessonId', context.lessonId);
    if (context.activityId) form.append('activityId', context.activityId);
    if (context.contentVersion !== undefined) form.append('contentVersion', String(context.contentVersion));
    if (context.wordOrPrompt) form.append('wordOrPrompt', context.wordOrPrompt);
    if (context.durationSec !== undefined) form.append('durationSec', String(context.durationSec));
    // The server returns { recording }; tolerate a bare receipt too so FE/BE phases stay decoupled.
    const payload = await postCurrentRecordingRequest<{ recording?: RecordingReceipt } & Partial<RecordingReceipt>>(
      '/recordings/upload', form, isCurrent,
      { headers: { 'Content-Type': 'multipart/form-data' }, timeout: RECORDING_UPLOAD_TIMEOUT_MS },
    );
    const result = (payload?.recording ?? payload) as RecordingReceipt | undefined;
    const id = result?.id ?? result?._id;
    if (!result || typeof id !== 'string' || !/^[a-f\d]{24}$/i.test(id)) throw new Error('Máy chủ chưa xác nhận bản thu âm.');
    receipt = { ...result, id };
    return receipt;
  };
  return {
    submit(): Promise<RecordingReceipt> {
      inFlight ??= run().finally(() => { inFlight = undefined; });
      return inFlight;
    },
  };
}
