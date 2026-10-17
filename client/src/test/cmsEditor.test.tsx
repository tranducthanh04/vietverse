import React from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import { ContentEditorPage } from "../features/admin/content/ContentEditorPage.js";
import { ContentListPage } from "../features/admin/content/ContentListPage.js";
import { AdminLayout } from "../app/layouts/AdminLayout.js";
import { useAuthStore } from "../store/authStore.js";

const adapter = api.defaults.adapter;
let client: QueryClient;
let requests: { method: string; url: string; body: Record<string, unknown> }[];
let respond: (
  method: string,
  url: string,
  body: Record<string, unknown>,
) => unknown;
const payload = {
  title: "Bài một",
  description: "",
  stageId: "stage1",
  order: 1,
  freeInStarterPlan: true,
  vocabulary: [],
  activities: [],
  totalActivities: 0,
};
const draft = () => ({
  kind: "lesson",
  contentId: "one",
  payload: structuredClone(payload),
  draftVersion: 1,
  baseContentVersion: 0,
  state: "editing",
  updatedAt: "2026-10-09T00:00:00Z",
  updatedBy: "admin",
  editorialNotes: [],
});
const culturePayload = {
  title: "Văn hoá",
  category: "tet",
  intro: "",
  coverImage: "",
  audioUrl: "",
  funFacts: [],
  tags: [],
  quiz: [],
  translations: {},
};
const storyPayload = {
  title: "Truyện",
  description: "",
  author: "",
  type: "co_tich",
  coverImage: "",
  audioUrl: "",
  durationSec: 0,
  ageGroups: [],
  vocab: [],
  lyrics: [],
  quiz: [],
  translations: {},
};
const cultureDraft = () => ({
  ...draft(),
  kind: "culture",
  payload: structuredClone(culturePayload),
});
const storyDraft = () => ({
  ...draft(),
  kind: "story",
  payload: structuredClone(storyPayload),
});
beforeEach(() => {
  client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  requests = [];
  respond = (_method, _url) => ({ live: null, draft: draft() });
  api.defaults.adapter = async (config) => {
    const body = config.data ? JSON.parse(config.data) : {};
    requests.push({ method: config.method!, url: config.url!, body });
    return {
      data: {
        data:
          config.url === "/stages"
            ? []
            : await respond(config.method!, config.url!, body),
      },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    };
  };
});
afterEach(() => {
  cleanup();
  client.clear();
  api.defaults.adapter = adapter;
  vi.restoreAllMocks();
});
function show(element = <ContentEditorPage kind="lesson" />) {
  const router = createMemoryRouter(
    [
      { path: "/admin/bai-hoc/:id", element },
      { path: "/away", element: <p>Trang khác</p> },
      { path: "/kham-pha", element: <p>Không gian bé</p> },
    ],
    { initialEntries: ["/admin/bai-hoc/one"] },
  );
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}
it("saves only a draft and preserves the exact edited value on conflict", async () => {
  respond = (method) => {
    if (method === "put")
      throw {
        response: {
          status: 409,
          data: { error: { code: "CONTENT_CONFLICT" } },
        },
      };
    return { live: null, draft: draft() };
  };
  show();
  fireEvent.change(await screen.findByLabelText("Tiêu đề"), {
    target: { value: "Bản đang sửa" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Lưu nháp" }));
  expect(
    await screen.findByText("Nội dung đã được người khác sửa."),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("Tiêu đề")).toHaveValue("Bản đang sửa");
  expect(requests.filter((r) => r.method === "put")[0].body).toMatchObject({
    expectedDraftVersion: 1,
    payload: { title: "Bản đang sửa" },
  });
  expect(requests.some((r) => r.url.endsWith("/publish"))).toBe(false);
});
it("keeps typing made while a save is in flight and blocks unsaved preview", async () => {
  let finish!: (result: unknown) => void;
  respond = (method) =>
    method === "put"
      ? new Promise((resolve) => {
          finish = resolve;
        })
      : { live: null, draft: draft() };
  show();
  fireEvent.change(await screen.findByLabelText("Tiêu đề"), {
    target: { value: "Gửi đi" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Lưu nháp" }));
  await waitFor(() => expect(finish).toBeTypeOf("function"));
  fireEvent.change(screen.getByLabelText("Tiêu đề"), {
    target: { value: "Gõ tiếp" },
  });
  await act(async () =>
    finish({
      ...draft(),
      draftVersion: 2,
      payload: { ...payload, title: "Gửi đi" },
    }),
  );
  expect(screen.getByLabelText("Tiêu đề")).toHaveValue("Gõ tiếp");
  expect(screen.getByRole("button", { name: "Xem trước" })).toBeDisabled();
});
it("focuses the first invalid field without losing form data", async () => {
  respond = (method) => {
    if (method === "put")
      throw {
        response: {
          status: 400,
          data: {
            error: {
              message: "Invalid",
              details: [{ field: "payload.title", message: "Too long" }],
            },
          },
        },
      };
    return { live: null, draft: draft() };
  };
  show();
  fireEvent.change(await screen.findByLabelText("Tiêu đề"), {
    target: { value: "Bản dài" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Lưu nháp" }));
  await waitFor(() => expect(screen.getByLabelText("Tiêu đề")).toHaveFocus());
  expect(screen.getByText(/Too long/)).toBeInTheDocument();
});
it("blocks navigation and reload while dirty and cleans the reload handler on unmount", async () => {
  const router = show();
  fireEvent.change(await screen.findByLabelText("Tiêu đề"), {
    target: { value: "Chưa lưu" },
  });
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  expect(event.defaultPrevented).toBe(true);
  await act(async () => {
    void router.navigate("/away");
  });
  expect(
    await screen.findByRole("dialog", { name: "Rời trang chưa lưu?" }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Ở lại" }));
  expect(screen.getByLabelText("Tiêu đề")).toHaveValue("Chưa lưu");
  cleanup();
  const next = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(next);
  expect(next.defaultPrevented).toBe(false);
});
it("reads without creating a draft and retries failed detail loading", async () => {
  respond = () => {
    throw new Error("offline");
  };
  show();
  fireEvent.click(await screen.findByRole("button", { name: "Thử lại" }));
  respond = () => ({
    live: {
      kind: "lesson",
      contentId: "one",
      contentVersion: 0,
      payload,
      visibility: "published",
    },
    draft: null,
  });
  fireEvent.click(await screen.findByRole("button", { name: "Thử lại" }));
  expect(
    await screen.findByRole("button", { name: "Bắt đầu biên tập" }),
  ).toBeInTheDocument();
  expect(requests.every((r) => r.method === "get")).toBe(true);
});
it("lists empty/error/retry states and requests the next page", async () => {
  respond = () => {
    throw new Error("offline");
  };
  show(<ContentListPage kind="lesson" />);
  await screen.findByRole("button", { name: "Thử lại" });
  respond = () => ({ items: [], total: 0, page: 1, pageSize: 20 });
  fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
  expect(
    await screen.findByText("Chưa có nội dung phù hợp."),
  ).toBeInTheDocument();
  respond = () => ({
    items: [
      {
        kind: "lesson",
        contentId: "one",
        title: "Bài mới",
        state: "draft",
        hasDraft: true,
        contentVersion: 0,
        draftVersion: 1,
      },
    ],
    total: 21,
    page: 1,
    pageSize: 20,
  });
  await act(async () => {
    await client.invalidateQueries();
  });
  fireEvent.click(await screen.findByRole("button", { name: "Trang sau" }));
  await waitFor(() =>
    expect(requests.some((request) => request.url.includes("page=2"))).toBe(
      true,
    ),
  );
});
it("does not mount admin content for a parent", async () => {
  useAuthStore.setState({
    user: { id: "p", role: "parent", displayName: "Parent", email: "p@test" },
    isLoading: false,
  });
  show(<AdminLayout />);
  expect(screen.queryByRole("main")).not.toBeInTheDocument();
});
it("focuses nested activity errors after save unlocks the form", async () => {
  respond = (method) => {
    if (method === "put")
      throw {
        response: {
          status: 400,
          data: {
            error: {
              details: [
                {
                  field: "payload.activities.0.prompt",
                  message: "Invalid prompt",
                },
              ],
            },
          },
        },
      };
    return {
      live: null,
      draft: {
        ...draft(),
        payload: {
          ...payload,
          activities: [
            {
              id: "a",
              type: "word_card",
              prompt: "Đọc",
              targetWord: "mẹ",
              audioUrl: "",
              imageUrl: "",
            },
          ],
        },
      },
    };
  };
  show();
  fireEvent.change(await screen.findByLabelText("Hướng dẫn 1"), {
    target: { value: "Sửa" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Lưu nháp" }));
  await screen.findByText(/Invalid prompt/);
  expect(screen.getByLabelText("Hướng dẫn 1")).toHaveFocus();
});
it("validates the saved version and requires explicit confirmation before publishing it", async () => {
  respond = (_method, url) =>
    url.endsWith("/validate")
      ? { issues: [], draftVersion: 1 }
      : url.endsWith("/publish")
        ? { contentVersion: 1 }
        : { live: null, draft: draft() };
  show();
  fireEvent.click(await screen.findByRole("button", { name: "Xuất bản" }));
  expect(
    await screen.findByRole("dialog", { name: "Xác nhận thay đổi" }),
  ).toHaveTextContent("nháp 1");
  expect(requests.some((request) => request.url.endsWith("/publish"))).toBe(
    false,
  );
  fireEvent.click(screen.getByRole("button", { name: "Xác nhận" }));
  await screen.findByText("Đã xuất bản phiên bản 1.");
  expect(
    requests.find((request) => request.url.endsWith("/publish"))?.body,
  ).toEqual({ expectedDraftVersion: 1, baseContentVersion: 0 });
});
it("locks editing during validation so confirmation cannot publish behind new unsaved typing", async () => {
  let finish!: (value: unknown) => void;
  respond = (_method, url) =>
    url.endsWith("/validate")
      ? new Promise((resolve) => {
          finish = resolve;
        })
      : { live: null, draft: draft() };
  show();
  fireEvent.click(await screen.findByRole("button", { name: "Xuất bản" }));
  await waitFor(() => expect(finish).toBeTypeOf("function"));
  expect(screen.getByLabelText("Tiêu đề")).toBeDisabled();
  await act(async () => finish({ issues: [], draftVersion: 1 }));
});

it("keeps keyboard focus in confirmation and Escape cancels without a mutation", async () => {
  show();
  const opener = await screen.findByRole("button", { name: "Bỏ nháp" });
  opener.focus();
  fireEvent.click(opener);
  const dialog = await screen.findByRole("dialog", {
    name: "Xác nhận thay đổi",
  });
  const cancel = within(dialog).getByRole("button", { name: "Hủy" });
  const confirm = within(dialog).getByRole("button", { name: "Xác nhận" });
  expect(cancel).toHaveFocus();
  fireEvent.keyDown(cancel, { key: "Tab", shiftKey: true });
  expect(confirm).toHaveFocus();
  fireEvent.keyDown(confirm, { key: "Tab" });
  expect(cancel).toHaveFocus();
  fireEvent.keyDown(cancel, { key: "Escape" });
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  expect(opener).toHaveFocus();
  expect(requests.every((request) => request.method === "get")).toBe(true);
});

it("Escape dismisses the unsaved navigation dialog and preserves local typing", async () => {
  show();
  const title = await screen.findByLabelText("Tiêu đề");
  fireEvent.change(title, { target: { value: "Chưa lưu" } });
  const opener = screen.getByRole("link", { name: "Về danh sách" });
  opener.focus();
  fireEvent.click(opener);
  const dialog = await screen.findByRole("dialog", {
    name: "Rời trang chưa lưu?",
  });
  fireEvent.keyDown(within(dialog).getByRole("button", { name: "Ở lại" }), {
    key: "Escape",
  });
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  expect(title).toHaveValue("Chưa lưu");
  expect(opener).toHaveFocus();
});

it("associates source notes with fields and empty activity/vocabulary groups without changing label names", async () => {
  respond = () => ({
    live: null,
    draft: {
      ...draft(),
      editorialNotes: [
        {
          field: "payload.description",
          reason: "normalization",
          message: "Đối chiếu mô tả nguồn",
        },
        {
          field: "activities",
          reason: "unsupported_activity",
          message: "Cần hoạt động phù hợp",
        },
        {
          field: "vocabulary",
          reason: "missing_source",
          message: "Cần nghĩa từ nguồn",
        },
      ],
    },
  });
  show();
  const description = await screen.findByRole("textbox", {
    name: "Mô tả",
  });
  expect(description).toHaveAccessibleDescription(/Đối chiếu mô tả nguồn/);
  expect(
    within(screen.getByRole("group", { name: "Hoạt động (0)" })).getByRole(
      "note",
      { name: "Ghi chú nguồn: activities" },
    ),
  ).toHaveTextContent("Cần hoạt động phù hợp");
  expect(
    within(screen.getByRole("group", { name: "Từ vựng" })).getByRole("note", {
      name: "Ghi chú nguồn: vocabulary",
    }),
  ).toHaveTextContent("Cần nghĩa từ nguồn");
  expect(requests.every((request) => request.method === "get")).toBe(true);
});

it("renders each save error as an anchor link that focuses the matching field", async () => {
  respond = (method) => {
    if (method === "put")
      throw {
        response: {
          status: 400,
          data: {
            error: { details: [{ field: "payload.title", message: "Quá dài" }] },
          },
        },
      };
    return { live: null, draft: draft() };
  };
  show();
  const title = await screen.findByLabelText("Tiêu đề");
  fireEvent.change(title, { target: { value: "Bản dài" } });
  fireEvent.click(screen.getByRole("button", { name: "Lưu nháp" }));
  const link = await screen.findByRole("link", { name: /Quá dài/ });
  expect(link).toHaveAttribute("href", "#cms-field-title");
  expect(title).toHaveAttribute("id", "cms-field-title");
  expect(title).toHaveAttribute("aria-invalid", "true");
  expect(title).toHaveAccessibleDescription(/Quá dài/);
  // Bỏ focus tự động để chứng minh chính cú bấm link mới là thứ đưa focus về ô.
  (document.activeElement as HTMLElement | null)?.blur();
  fireEvent.click(link);
  expect(title).toHaveFocus();
});

it("links nested activity errors to the right field via a sanitized anchor id", async () => {
  respond = (method) => {
    if (method === "put")
      throw {
        response: {
          status: 400,
          data: {
            error: {
              details: [
                { field: "payload.activities.0.prompt", message: "Thiếu hướng dẫn" },
              ],
            },
          },
        },
      };
    return {
      live: null,
      draft: {
        ...draft(),
        payload: {
          ...payload,
          activities: [
            {
              id: "a",
              type: "word_card",
              prompt: "Đọc",
              targetWord: "mẹ",
              audioUrl: "",
              imageUrl: "",
            },
          ],
        },
      },
    };
  };
  show();
  fireEvent.change(await screen.findByLabelText("Hướng dẫn 1"), {
    target: { value: "x" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Lưu nháp" }));
  const link = await screen.findByRole("link", { name: /Thiếu hướng dẫn/ });
  expect(link).toHaveAttribute("href", "#cms-field-activities-0-prompt");
  const prompt = screen.getByLabelText("Hướng dẫn 1");
  expect(prompt).toHaveAttribute("id", "cms-field-activities-0-prompt");
  expect(prompt).toHaveAttribute("aria-invalid", "true");
  (document.activeElement as HTMLElement | null)?.blur();
  fireEvent.click(link);
  expect(prompt).toHaveFocus();
});

it("links a <select> error (culture category) to the field and focuses it", async () => {
  respond = (method) => {
    if (method === "put")
      throw {
        response: {
          status: 400,
          data: {
            error: {
              details: [
                { field: "payload.category", message: "Chọn chủ đề hợp lệ" },
              ],
            },
          },
        },
      };
    return { live: null, draft: cultureDraft() };
  };
  show(<ContentEditorPage kind="culture" />);
  fireEvent.change(await screen.findByLabelText("Tiêu đề"), {
    target: { value: "Văn hoá mới" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Lưu nháp" }));
  const link = await screen.findByRole("link", { name: /Chọn chủ đề hợp lệ/ });
  expect(link).toHaveAttribute("href", "#cms-field-category");
  const select = screen.getByLabelText("Chủ đề văn hóa");
  expect(select).toHaveAttribute("id", "cms-field-category");
  expect(select).toHaveAttribute("aria-invalid", "true");
  expect(select).toHaveAccessibleDescription(/Chọn chủ đề hợp lệ/);
  (document.activeElement as HTMLElement | null)?.blur();
  fireEvent.click(link);
  expect(select).toHaveFocus();
});

it("links an ageGroups checkbox-group error to the group and focuses a real control", async () => {
  respond = (method) => {
    if (method === "put")
      throw {
        response: {
          status: 400,
          data: {
            error: {
              details: [
                { field: "payload.ageGroups", message: "Chọn ít nhất một nhóm tuổi" },
              ],
            },
          },
        },
      };
    return { live: null, draft: storyDraft() };
  };
  show(<ContentEditorPage kind="story" />);
  fireEvent.change(await screen.findByLabelText("Tiêu đề"), {
    target: { value: "Truyện mới" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Lưu nháp" }));
  const link = await screen.findByRole("link", {
    name: /Chọn ít nhất một nhóm tuổi/,
  });
  expect(link).toHaveAttribute("href", "#cms-field-ageGroups");
  const group = screen.getByRole("group", { name: "Nhóm tuổi" });
  expect(group).toHaveAttribute("id", "cms-field-ageGroups");
  expect(group).toHaveAttribute("aria-invalid", "true");
  // Nhóm checkbox neo id, nhưng focus phải tới được một ô thật (checkbox đầu).
  (document.activeElement as HTMLElement | null)?.blur();
  fireEvent.click(link);
  expect(screen.getByLabelText("5-6 tuổi")).toHaveFocus();
});

it("keeps a single field's multiple errors as distinct anchors described together", async () => {
  respond = (method) => {
    if (method === "put")
      throw {
        response: {
          status: 400,
          data: {
            error: {
              details: [
                { field: "payload.title", message: "Lỗi một" },
                { field: "payload.title", message: "Lỗi hai" },
              ],
            },
          },
        },
      };
    return { live: null, draft: draft() };
  };
  show();
  const title = await screen.findByLabelText("Tiêu đề");
  fireEvent.change(title, { target: { value: "Bản sửa" } });
  fireEvent.click(screen.getByRole("button", { name: "Lưu nháp" }));
  const first = await screen.findByRole("link", { name: /Lỗi một/ });
  const second = screen.getByRole("link", { name: /Lỗi hai/ });
  expect(first).toHaveAttribute("id", "cms-field-title-error-0");
  expect(second).toHaveAttribute("id", "cms-field-title-error-1");
  expect(title.getAttribute("aria-describedby")).toContain("cms-field-title-error-0");
  expect(title.getAttribute("aria-describedby")).toContain("cms-field-title-error-1");
  expect(title).toHaveAccessibleDescription(/Lỗi một.*Lỗi hai/s);
});
