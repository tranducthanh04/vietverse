import { z } from 'zod';
import { contentVersionSchema } from '../content/content.reader.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/i).transform(id => id.toLowerCase());
export const recordingContextSchema = z.object({
  childId: objectId,
  lessonId: objectId.optional(),
  activityId: z.string().min(1).max(500).optional(),
  contentVersion: contentVersionSchema.optional(),
  wordOrPrompt: z.string().max(5000).optional(),
});
export type RecordingContext = z.infer<typeof recordingContextSchema>;
export const uploadIntentSchema = recordingContextSchema.extend({
  requestId: z.string().uuid(),
  byteLength: z.number().int().positive().max(5 * 1024 * 1024),
  mimeType: z.string().max(200).transform(mime => mime.split(';')[0].trim().toLowerCase())
    .pipe(z.enum(['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/mpeg', 'audio/wav', 'audio/x-wav', 'application/ogg'])),
  durationSec: z.number().finite().min(0).max(180),
}).strict();
export type UploadIntentInput = z.infer<typeof uploadIntentSchema>;
export const finalizeSchema = z.object({ intentId: objectId }).strict();
