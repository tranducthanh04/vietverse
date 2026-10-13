import { v2 as cloudinary } from 'cloudinary';
import { Types, type ClientSession } from 'mongoose';
import { env } from '../config/env.js';
import { AudioCleanupTask } from '../models/AudioCleanupTask.js';
import { Recording } from '../models/Recording.js';
import { RecordingUploadIntent } from '../models/RecordingUploadIntent.js';
import { logger } from '../utils/logger.js';
import { providerHttpCode } from './directAudioStorage.js';

export type AudioAsset = { publicId: string; resourceType?: string };
type CleanupSource = 'child_deletion' | 'legacy_compensation';
export type CleanupOutcome = { deleted: string[]; queued: string[] };

const RESOURCE_TYPES = ['video', 'raw', 'image'] as const;
const CONCURRENCY = 4;
const DEFAULT_BUDGET_MS = 8000;

function resourceTypeFromUrl(url?: string): string | undefined {
  const match = /^https:\/\/res\.cloudinary\.com\/[^/]+\/(video|image|raw)\/upload\//.exec(url ?? '');
  return match?.[1];
}

// Data URI fallback (local/dev) and recordings without a provider ID have nothing to destroy.
export function audioAssetFromRecording(recording: { publicId?: string | null; url?: string | null; resourceType?: string | null }): AudioAsset | undefined {
  if (!recording.publicId || recording.url?.startsWith('data:')) return undefined;
  return { publicId: recording.publicId, resourceType: recording.resourceType ?? resourceTypeFromUrl(recording.url ?? undefined) };
}

/** Reads every provider asset owned by a child inside the deleting transaction, so the list matches what is removed. */
export async function collectChildAudioAssets(childId: Types.ObjectId, session: ClientSession): Promise<AudioAsset[]> {
  // Sequential: operations on one transaction session must not run in parallel.
  const recordings = await Recording.find({ childId }).select('publicId url resourceType').session(session).lean();
  // Direct uploads always target resource_type=video; unfinalized intents may still own an uploaded asset.
  const intents = await RecordingUploadIntent.find({ childId, status: { $ne: 'completed' } }).select('publicId').session(session).lean();
  const assets = new Map<string, AudioAsset>();
  for (const recording of recordings) {
    const asset = audioAssetFromRecording(recording);
    if (asset) assets.set(asset.publicId, asset);
  }
  for (const intent of intents) if (!assets.has(intent.publicId)) assets.set(intent.publicId, { publicId: intent.publicId, resourceType: 'video' });
  return [...assets.values()];
}

function configured() {
  return env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET
    ? { cloud_name: env.CLOUDINARY_CLOUD_NAME, api_key: env.CLOUDINARY_API_KEY, api_secret: env.CLOUDINARY_API_SECRET }
    : undefined;
}

// Unknown legacy type: try each; "not found" for all types means the asset is already gone.
async function destroyOne(asset: AudioAsset, config: NonNullable<ReturnType<typeof configured>>) {
  const types = asset.resourceType ? [asset.resourceType] : [...RESOURCE_TYPES];
  for (const resourceType of types) {
    const response = await cloudinary.uploader.destroy(asset.publicId, { ...config, resource_type: resourceType, invalidate: true });
    if (response?.result === 'ok') return;
    if (response?.result !== 'not found') throw new Error(`Unexpected destroy result: ${String(response?.result)}`);
  }
}

function describe(error: unknown): string {
  const code = providerHttpCode(error);
  if (code) return `http_${code}`;
  return String((error as Error)?.message ?? 'unknown').slice(0, 200);
}

export async function queueAudioCleanup(assets: AudioAsset[], source: CleanupSource, reason: string, childId?: Types.ObjectId | string) {
  if (!assets.length) return;
  try {
    await AudioCleanupTask.bulkWrite(assets.map(asset => ({ updateOne: {
      filter: { publicId: asset.publicId, status: 'pending' },
      update: { $set: { resourceType: asset.resourceType, source, childId: childId ? new Types.ObjectId(String(childId)) : undefined, lastError: reason }, $inc: { attempts: 1 } },
      upsert: true,
    } })));
  } catch (error) {
    // Last resort: the IDs stay in logs for manual reconciliation.
    logger.error({ err: describe(error), publicIds: assets.map(asset => asset.publicId), source }, 'Failed to record audio cleanup backlog');
  }
}

/**
 * Best-effort physical deletion after the DB commit. Never throws: failures,
 * missing configuration and work beyond the time budget go to AudioCleanupTask.
 */
export async function destroyAudioAssets(assets: AudioAsset[], meta: { source: CleanupSource; childId?: Types.ObjectId | string },
  budgetMs = DEFAULT_BUDGET_MS): Promise<CleanupOutcome> {
  const outcome: CleanupOutcome = { deleted: [], queued: [] };
  try {
    if (!assets.length) return outcome;
    const config = configured();
    if (!config) {
      await queueAudioCleanup(assets, meta.source, 'storage_not_configured', meta.childId);
      outcome.queued.push(...assets.map(asset => asset.publicId));
      return outcome;
    }
    const deadline = Date.now() + budgetMs;
    const failed: AudioAsset[] = [];
    const reasons = new Map<string, string>();
    let next = 0;
    const worker = async () => {
      while (next < assets.length) {
        const asset = assets[next++];
        if (Date.now() > deadline) { failed.push(asset); reasons.set(asset.publicId, 'deferred_time_budget'); continue; }
        try {
          await destroyOne(asset, config);
          outcome.deleted.push(asset.publicId);
        } catch (error) {
          failed.push(asset); reasons.set(asset.publicId, describe(error));
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, assets.length) }, worker));
    if (failed.length) {
      logger.warn({ count: failed.length, source: meta.source }, 'Audio assets queued for reconciliation');
      for (const asset of failed) await queueAudioCleanup([asset], meta.source, reasons.get(asset.publicId) ?? 'unknown', meta.childId);
      outcome.queued.push(...failed.map(asset => asset.publicId));
    }
  } catch (error) {
    logger.error({ err: describe(error), source: meta.source, publicIds: assets.map(asset => asset.publicId) }, 'Audio cleanup aborted unexpectedly');
  }
  return outcome;
}
