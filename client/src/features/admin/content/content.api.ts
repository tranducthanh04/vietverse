import { api } from "../../../lib/api.js";
import type {
  ContentKind,
  ContentDetail,
  ContentList,
  DraftView,
  Payload,
  FieldIssue,
} from "./content.types.js";
const root = (kind: ContentKind, id = "") =>
  `/admin/content/${{ lesson: "lessons", story: "stories", culture: "culture" }[kind]}${id ? `/${id}` : ""}`;
const post = async <T>(url: string, body: unknown): Promise<T> =>
  (await api.post(url, body)).data.data;
export const contentApi = {
  list: async (
    kind: ContentKind,
    filters: Record<string, string | number>,
  ): Promise<ContentList> =>
    (
      await api.get(
        `${root(kind)}?${new URLSearchParams(
          Object.entries(filters)
            .filter(([, v]) => v !== "")
            .map(([k, v]) => [k, String(v)]),
        )}`,
      )
    ).data.data,
  get: async (kind: ContentKind, id: string): Promise<ContentDetail> =>
    (await api.get(root(kind, id))).data.data,
  start: (kind: ContentKind, id: string, expectedDraftVersion?: number) =>
    post<DraftView>(`${root(kind, id)}/draft`, { expectedDraftVersion }),
  create: (kind: ContentKind, payload: Partial<Payload>, requestId: string) =>
    post<DraftView>(`${root(kind)}/drafts`, { payload, requestId }),
  save: async (
    kind: ContentKind,
    id: string,
    payload: Payload,
    expectedDraftVersion: number,
  ): Promise<DraftView> =>
    (
      await api.put(`${root(kind, id)}/draft`, {
        payload,
        expectedDraftVersion,
      })
    ).data.data,
  validate: (kind: ContentKind, id: string, expectedDraftVersion: number) =>
    post<{ issues: FieldIssue[]; draftVersion: number }>(
      `${root(kind, id)}/validate`,
      { expectedDraftVersion },
    ),
  preview: async (
    kind: ContentKind,
    id: string,
    version: number,
  ): Promise<DraftView & { issues: FieldIssue[] }> =>
    (await api.get(`${root(kind, id)}/preview?draftVersion=${version}`)).data
      .data,
  publish: (
    kind: ContentKind,
    id: string,
    expectedDraftVersion: number,
    baseContentVersion: number | null,
  ) =>
    post<{ contentVersion: number }>(`${root(kind, id)}/publish`, {
      expectedDraftVersion,
      baseContentVersion,
    }),
  discard: (kind: ContentKind, id: string, expectedDraftVersion: number) =>
    post<DraftView>(`${root(kind, id)}/discard-draft`, {
      expectedDraftVersion,
    }),
  setVisibility: async (
    kind: ContentKind,
    id: string,
    visibility: "published" | "withdrawn",
    expectedContentVersion: number,
  ) =>
    (
      await api.patch(`${root(kind, id)}/visibility`, {
        visibility,
        expectedContentVersion,
      })
    ).data.data,
};
export function contentFailure(error: unknown) {
  const e = error as {
    response?: {
      status?: number;
      data?: { error?: { message?: string; details?: FieldIssue[] } };
    };
  };
  return {
    conflict: e.response?.status === 409,
    message:
      e.response?.status === 409
        ? "Nội dung đã được người khác sửa."
        : e.response?.data?.error?.message ||
          "Không tải hoặc lưu được nội dung. Hãy thử lại.",
    issues: e.response?.data?.error?.details ?? [],
  };
}
