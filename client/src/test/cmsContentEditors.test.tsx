import React, { useState } from "react";
import { afterEach, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { StoryEditor } from "../features/admin/content/StoryEditor.js";
import { CultureEditor } from "../features/admin/content/CultureEditor.js";
import { QuizEditor } from "../features/admin/content/QuizEditor.js";
import type {
  StoryContent,
  CultureContent,
  Quiz,
} from "../features/admin/content/content.types.js";
import { ContentCreatePage } from "../features/admin/content/ContentCreatePage.js";
import { ContentEditorPage } from "../features/admin/content/ContentEditorPage.js";
import { ContentPreviewPage } from "../features/admin/content/ContentPreviewPage.js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { api } from "../lib/api.js";
afterEach(cleanup);
const story: StoryContent = {
  title: "Rồng rắn lên mây",
  type: "dong_dao",
  author: "",
  description: "",
  coverImage: "",
  audioUrl: "",
  durationSec: 0,
  ageGroups: ["5-6"],
  vocab: [],
  quiz: [],
  lyrics: [
    { text: "Rồng rắn lên mây", timeSec: 0 },
    { text: "Có cây xúc sắc", timeSec: 0 },
  ],
};
it("edits and reorders exact lyric lines without inventing timestamps or audio", () => {
  function Form() {
    const [value, setValue] = useState(story);
    return (
      <>
        <StoryEditor value={value} onChange={setValue} />
        <output>{JSON.stringify(value)}</output>
      </>
    );
  }
  render(<Form />);
  expect(
    screen.getByText(/Không có audio: đọc theo thứ tự dòng/),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Đưa dòng 2 lên" }));
  const value = JSON.parse(screen.getByRole("status").textContent!);
  expect(value.lyrics).toEqual([
    { text: "Có cây xúc sắc", timeSec: 0 },
    { text: "Rồng rắn lên mây", timeSec: 0 },
  ]);
  expect(value.audioUrl).toBe("");
});
it("preserves the selected quiz option across insertion/reorder and clears it when removed", () => {
  function Form() {
    const [value, setValue] = useState<Quiz[]>([
      { question: "Chọn", options: ["Mẹ", "Bà", "Bố"], correctAnswer: 1 },
    ]);
    return (
      <>
        <QuizEditor value={value} onChange={setValue} />
        <output>{JSON.stringify(value)}</output>
      </>
    );
  }
  render(<Form />);
  fireEvent.click(screen.getByRole("button", { name: "Thêm đáp án câu 1" }));
  expect(
    JSON.parse(screen.getByRole("status").textContent!)[0].correctAnswer,
  ).toBe(1);
  fireEvent.click(screen.getByRole("button", { name: "Đưa đáp án 1.2 lên" }));
  expect(JSON.parse(screen.getByRole("status").textContent!)[0]).toMatchObject({
    options: ["Bà", "Mẹ", "Bố", ""],
    correctAnswer: 0,
  });
  fireEvent.click(screen.getByRole("button", { name: "Xóa đáp án 1.1" }));
  expect(
    JSON.parse(screen.getByRole("status").textContent!)[0].correctAnswer,
  ).toBe(-1);
  expect(screen.getByText(/Chưa chọn đáp án đúng/)).toBeInTheDocument();
});
it("shows legacy categories without silently rewriting them and allows correction", () => {
  function Form() {
    const [value, setValue] = useState<CultureContent>({
      title: "Bài cũ",
      category: "legacy",
      intro: "",
      coverImage: "",
      audioUrl: "",
      tags: [],
      funFacts: [],
      quiz: [],
    });
    return (
      <>
        <CultureEditor value={value} onChange={setValue} />
        <output>{JSON.stringify(value)}</output>
      </>
    );
  }
  render(<Form />);
  expect(screen.getByLabelText("Chủ đề văn hóa")).toHaveValue("legacy");
  expect(screen.getByText(/Chủ đề cũ chưa hợp lệ/)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Chủ đề văn hóa"), {
    target: { value: "tet" },
  });
  expect(JSON.parse(screen.getByRole("status").textContent!).category).toBe(
    "tet",
  );
});
it("retries draft creation with the same request identity and opens the editor", async () => {
  const original = api.defaults.adapter;
  const bodies: { requestId: string }[] = [];
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  api.defaults.adapter = async (config) => {
    bodies.push(JSON.parse(config.data));
    if (bodies.length === 1) throw new Error("Lost response");
    return {
      data: { data: { contentId: "new-id" } },
      status: 201,
      statusText: "Created",
      headers: {},
      config,
    };
  };
  try {
    const router = createMemoryRouter(
      [
        { path: "/new", element: <ContentCreatePage kind="story" /> },
        { path: "/admin/truyen/:id", element: <p>Đã mở editor</p> },
      ],
      { initialEntries: ["/new"] },
    );
    render(
      <QueryClientProvider client={client}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );
    fireEvent.change(screen.getByLabelText("Tiêu đề mới"), {
      target: { value: "Truyện mới" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Tạo bản nháp" }));
    await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: "Tạo bản nháp" }));
    expect(await screen.findByText("Đã mở editor")).toBeInTheDocument();
    expect(bodies[0].requestId).toBe(bodies[1].requestId);
  } finally {
    cleanup();
    client.clear();
    api.defaults.adapter = original;
  }
});
it("shows imported variant/source notes and opens only the saved draft version in preview", async () => {
  const original = api.defaults.adapter;
  const calls: string[] = [];
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const draft = {
    kind: "story",
    contentId: "story",
    payload: story,
    state: "editing",
    draftVersion: 4,
    baseContentVersion: 0,
    updatedAt: "2026-10-09T00:00:00Z",
    updatedBy: "admin",
    source: {
      documentUrl: "https://docs.google.com/document/d/source/edit",
      tabId: "tab-one",
      heading: "Nguồn khách hàng",
      capturedAt: "2026-10-09",
      checksum: "abc",
    },
    editorialNotes: [
      {
        field: "lyrics",
        reason: "variant",
        message: "Chọn dị bản đầu tiên từ nguồn.",
      },
    ],
  };
  api.defaults.adapter = async (config) => {
    calls.push(config.url!);
    return {
      data: {
        data: config.url!.includes("/preview?")
          ? { ...draft, issues: [] }
          : { draft, live: null },
      },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    };
  };
  try {
    const router = createMemoryRouter(
      [
        {
          path: "/admin/truyen/:id",
          element: <ContentEditorPage kind="story" />,
        },
        {
          path: "/admin/truyen/:id/xem-truoc",
          element: <ContentPreviewPage kind="story" />,
        },
      ],
      { initialEntries: ["/admin/truyen/story"] },
    );
    render(
      <QueryClientProvider client={client}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );
    expect(await screen.findByLabelText("Dòng lời 2")).toHaveValue(
      "Có cây xúc sắc",
    );
    expect(screen.getByText(/Chọn dị bản đầu tiên/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Nguồn khách hàng" }),
    ).toHaveAttribute("href", expect.stringContaining("tab=tab-one"));
    fireEvent.click(screen.getByRole("button", { name: "Xem trước" }));
    expect(await screen.findByTestId("lyrics")).toHaveTextContent(
      "Có cây xúc sắc",
    );
    expect(calls).toContain(
      "/admin/content/stories/story/preview?draftVersion=4",
    );
  } finally {
    cleanup();
    client.clear();
    api.defaults.adapter = original;
  }
});
