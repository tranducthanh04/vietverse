import axios, { type AxiosRequestConfig } from 'axios';
import { api } from './api.js';

export type RecordingContext = { childId: string; lessonId?: string; activityId?: string; contentVersion?: number; wordOrPrompt?: string };
export type RecordingReceipt = { id: string; _id?: string; url?: string; durationSec?: number; contentVersion?: number };
type UploadIntent = { intentId: string; expiresAt: string; upload: { url: string; fields: Record<string,string> } };
export const recordingContextChanged = () => Object.assign(new Error('Phiên thu âm đã thay đổi. Vui lòng thu âm lại cho hồ sơ hiện tại.'), { code: 'RECORDING_CONTEXT_CHANGED' });
const assertCurrent = (isCurrent: () => boolean) => { if (!isCurrent()) throw recordingContextChanged(); };

// Guard dispatch, including refresh/queued retries, not only the api.post call.
export async function postCurrentRecordingRequest<T>(path: string, body: unknown, isCurrent: () => boolean, config: AxiosRequestConfig = {}): Promise<T> {
  assertCurrent(isCurrent);
  const adapter = axios.getAdapter(api.defaults.adapter);
  const response = await api.post<{ data: T }>(path,body,{ ...config, adapter: async request => {
    assertCurrent(isCurrent);
    return adapter(request);
  } });
  assertCurrent(isCurrent);
  return response.data.data;
}
function validateIntent(intent: UploadIntent) {
  const url = new URL(intent.upload.url);
  if (!/^[a-f\d]{24}$/i.test(intent.intentId) || url.protocol !== 'https:' || url.hostname !== 'api.cloudinary.com'
    || url.username || url.password || url.port || url.search || url.hash
    || !/^\/v1_1\/[a-z\d_-]+\/video\/upload$/i.test(url.pathname)) throw new Error('Địa chỉ gửi thu âm không hợp lệ.');
  const allowed = new Set(['public_id','timestamp','overwrite','upload_preset','api_key','signature']);
  if (!intent.upload.fields || intent.upload.fields.overwrite !== 'false'
    || [...allowed].some(key => typeof intent.upload.fields[key] !== 'string' || !intent.upload.fields[key])
    || Object.keys(intent.upload.fields).some(key => !allowed.has(key))) throw new Error('Quyền gửi thu âm không hợp lệ.');
}
export function createDirectRecordingUpload(blob: Blob, context: RecordingContext & { durationSec?: number }, isCurrent: () => boolean) {
  const requestId = crypto.randomUUID();
  let intent: UploadIntent | undefined, inFlight: Promise<RecordingReceipt> | undefined, receipt: RecordingReceipt | undefined;
  let uploaded = false, attemptedProvider = false;
  const finalize = async () => {
    const result = await postCurrentRecordingRequest<RecordingReceipt>('/recordings/finalize',{ intentId: intent!.intentId },isCurrent);
    if (!result || !/^[a-f\d]{24}$/i.test(result.id)) throw new Error('Máy chủ chưa xác nhận bản thu âm.');
    receipt = result; return result;
  };
  const run = async () => {
    assertCurrent(isCurrent);
    if (receipt) return receipt;
    if (!blob.size || blob.size > 5 * 1024 * 1024) throw new Error('Bản thu âm phải nhỏ hơn hoặc bằng 5 MiB.');
    if ((context.durationSec ?? 0) > 180) throw new Error('Bản thu âm không được vượt quá 180 giây.');
    if (!intent) {
      const received = await postCurrentRecordingRequest<UploadIntent>('/recordings/upload-intent',{
        ...context, durationSec: context.durationSec ?? 0, requestId, byteLength: blob.size, mimeType: blob.type,
      },isCurrent);
      validateIntent(received); intent = received;
    }
    if (uploaded) return finalize();
    if (attemptedProvider) {
      try { return await finalize(); } catch (error) {
        const failure = error as { response?: { data?: { error?: { code?: string } } } };
        if (failure.response?.data?.error?.code !== 'UPLOAD_ASSET_NOT_FOUND') throw error;
      }
    }
    assertCurrent(isCurrent);
    const form = new FormData();
    for (const [key,value] of Object.entries(intent.upload.fields)) form.append(key,value);
    const extension = blob.type.includes('mp4') ? 'mp4' : blob.type.includes('ogg') ? 'ogg' : 'webm';
    form.append('file',blob,`recording.${extension}`); attemptedProvider = true;
    try {
      const response = await fetch(intent.upload.url,{ method:'POST',body:form,credentials:'omit',redirect:'error' });
      assertCurrent(isCurrent);
      if (!response.ok) throw new Error('Provider rejected upload');
      uploaded = true;
    } catch {
      assertCurrent(isCurrent);
      throw new Error('Không gửi được bản thu âm. Vui lòng thử lại; bản thu vẫn được giữ.');
    }
    return finalize();
  };
  return { submit(): Promise<RecordingReceipt> {
    inFlight ??= run().finally(() => { inFlight = undefined; }); return inFlight;
  } };
}
