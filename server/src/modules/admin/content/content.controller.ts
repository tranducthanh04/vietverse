import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ContentService } from './content.service.js';
import { contentFiltersSchema } from './content.query.js';
import { sendSuccess } from '../../../utils/apiResponse.js';
import { publishContent, setContentVisibility } from './content.publish.js';

const kinds = { lessons: 'lesson', stories: 'story', culture: 'culture' } as const;
const kindSchema = z.enum(['lessons', 'stories', 'culture']);
const objectId = z.string().regex(/^[a-f\d]{24}$/i);
const version = z.number().int().positive();
const handler = (fn: (req: Request, res: Response) => Promise<unknown>) => async (req: Request, res: Response, next: NextFunction) => {
  try { await fn(req, res); } catch (error) { next(error); }
};
const target = (req: Request) => ({ kind: kinds[kindSchema.parse(req.params.kind)], id: objectId.parse(req.params.id) });
export const ContentController = {
  publish: handler(async (req, res) => {
    const { kind, id } = target(req);
    const body = z.object({ expectedDraftVersion: version, baseContentVersion: z.number().int().nonnegative().nullable() }).strict().parse(req.body);
    return sendSuccess(res, await publishContent(kind, id, body, req.user!.id));
  }),
  visibility: handler(async (req, res) => {
    const { kind, id } = target(req);
    const body = z.object({ visibility: z.enum(['published', 'withdrawn']), expectedContentVersion: z.number().int().nonnegative() }).strict().parse(req.body);
    return sendSuccess(res, await setContentVisibility(kind, id, body.visibility, body.expectedContentVersion, req.user!.id));
  }),
  list: handler(async (req, res) => sendSuccess(res, await ContentService.list(kinds[kindSchema.parse(req.params.kind)], contentFiltersSchema.parse(req.query)))),
  get: handler(async (req, res) => { const { kind, id } = target(req); return sendSuccess(res, await ContentService.get(kind, id)); }),
  start: handler(async (req, res) => {
    const { kind, id } = target(req);
    const body = z.object({ expectedDraftVersion: version.optional() }).strict().parse(req.body);
    return sendSuccess(res, await ContentService.startDraft(kind, id, req.user!.id, body.expectedDraftVersion));
  }),
  create: handler(async (req, res) => {
    const kind = kinds[kindSchema.parse(req.params.kind)];
    const body = z.object({ payload: z.unknown(), requestId: z.string().min(1).max(200) }).strict().parse(req.body);
    return sendSuccess(res, await ContentService.createDraft(kind, body.payload, body.requestId, req.user!.id), 201);
  }),
  save: handler(async (req, res) => {
    const { kind, id } = target(req);
    const body = z.object({ payload: z.unknown(), expectedDraftVersion: version }).strict().parse(req.body);
    return sendSuccess(res, await ContentService.saveDraft(kind, id, body.payload, body.expectedDraftVersion, req.user!.id));
  }),
  discard: handler(async (req, res) => {
    const { kind, id } = target(req);
    const body = z.object({ expectedDraftVersion: version }).strict().parse(req.body);
    return sendSuccess(res, await ContentService.discardDraft(kind, id, body.expectedDraftVersion, req.user!.id));
  }),
  preview: handler(async (req, res) => {
    const { kind, id } = target(req);
    const query = z.object({ draftVersion: z.coerce.number().int().positive() }).parse(req.query);
    return sendSuccess(res, await ContentService.preview(kind, id, query.draftVersion));
  }),
  validate: handler(async (req, res) => {
    const { kind, id } = target(req);
    const body = z.object({ expectedDraftVersion: version }).strict().parse(req.body);
    const preview = await ContentService.preview(kind, id, body.expectedDraftVersion);
    return sendSuccess(res, { issues: preview.issues, draftVersion: preview.draftVersion });
  }),
};
