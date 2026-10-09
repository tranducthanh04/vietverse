import React from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { api } from "../lib/api.js";
import { LessonPreview } from "../features/admin/content/LessonPreview.js";
import { StoryPreview } from "../features/admin/content/StoryPreview.js";
import { CulturePreview } from "../features/admin/content/CulturePreview.js";
import { useChildStore } from "../store/childStore.js";
import { useLessonSessionStore } from "../store/lessonSessionStore.js";
import type { LessonContent } from "../features/admin/content/content.types.js";
const session = {
  childId: "child",
  lessonId: "live",
  contentVersion: 0,
  currentStepIndex: 2,
  answers: [{ activityId: "a", isCorrect: true }],
  hearts: 3,
  startTime: 1,
};
beforeEach(() => {
  useChildStore.setState({
    activeChild: {
      _id: "child",
      parentId: "parent",
      name: "An",
      ageGroup: "5-6",
      companionLanguage: "en",
      avatarId: "",
      viviPoints: 12,
      level: 1,
      badges: [],
      ownedItemIds: [],
      screenTimeLimit: 15,
    },
  });
  useLessonSessionStore.setState({ currentSession: structuredClone(session) });
  localStorage.setItem("vietverse_offline_completions", '[{"id":"keep"}]');
  vi.spyOn(api, "post").mockRejectedValue(
    new Error("No learning mutation allowed"),
  );
  vi.stubGlobal(
    "MediaRecorder",
    vi.fn(() => {
      throw new Error("No recording allowed");
    }),
  );
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: { getUserMedia: vi.fn() },
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
});
const lesson: LessonContent = {
  title: "Preview",
  description: "",
  stageId: "s",
  order: 1,
  freeInStarterPlan: true,
  vocabulary: [],
  activities: [
    {
      id: "a",
      type: "record_voice",
      prompt: "Đọc cùng bé",
      targetWord: "mẹ",
      audioUrl: "",
      imageUrl: "",
    },
  ],
};
it("simulates recording without touching the active child, session, outbox, API or microphone", () => {
  render(<LessonPreview payload={lesson} issues={[]} />);
  expect(screen.getByText("Xem trước — không lưu tiến độ")).toBeInTheDocument();
  expect(
    screen.getByText("Thu âm bị tắt trong chế độ xem trước."),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Tiếp tục xem trước" }));
  expect(
    screen.getByText("Đã xem hết bản nháp. Không cộng điểm."),
  ).toBeInTheDocument();
  expect(api.post).not.toHaveBeenCalled();
  expect(navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();
  expect(useLessonSessionStore.getState().currentSession).toEqual(session);
  expect(useChildStore.getState().activeChild?.viviPoints).toBe(12);
  expect(localStorage.getItem("vietverse_offline_completions")).toBe(
    '[{"id":"keep"}]',
  );
});
it("renders invalid activity errors rather than executing fallback sample content", () => {
  render(
    <LessonPreview
      payload={{
        ...lesson,
        activities: [
          {
            id: "bad",
            type: "fill_blank",
            prompt: "",
            audioUrl: "",
            imageUrl: "",
          },
        ],
      }}
      issues={[{ field: "activities.0.blanks", message: "Thiếu câu nguồn" }]}
    />,
  );
  expect(screen.getByText(/Thiếu câu nguồn/)).toBeInTheDocument();
  expect(screen.queryByText("__úp bê")).not.toBeInTheDocument();
});
it('previews new multi interaction without learning writes and resets input between activities',()=>{
  const activity={...lesson.activities[0],id:'m',type:'multi_select' as const,prompt:'Chọn M',
    options:[{id:'m1',text:'M',audioUrl:'',imageUrl:''},{id:'m2',text:'M',audioUrl:'',imageUrl:''}],correctAnswer:['m1','m2']};
  render(<LessonPreview payload={{...lesson,activities:[activity,{...activity,id:'n'}]}} issues={[]}/>);
  fireEvent.click(screen.getByRole('checkbox',{name:'Chữ M, vị trí 1'}));
  fireEvent.click(screen.getByRole('button',{name:'Gửi câu trả lời'}));
  expect(screen.getByText('Đã ghi câu trả lời')).toBeInTheDocument();
  expect(api.post).not.toHaveBeenCalled();
  expect(useLessonSessionStore.getState().currentSession).toEqual(session);
  expect(navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();
  expect(localStorage.getItem('vietverse_offline_completions')).toBe('[{"id":"keep"}]');
  fireEvent.click(screen.getByRole('button',{name:'Tiếp tục xem trước'}));
  expect(screen.getByRole('checkbox',{name:'Chữ M, vị trí 1'})).not.toBeChecked();
  expect(screen.queryByText('Đã ghi câu trả lời')).not.toBeInTheDocument();
});
it('previews grouping, multiple blanks and self-report without altering the child session',()=>{
  const common={...lesson.activities[0]};
  render(<LessonPreview payload={{...lesson,activities:[
    {...common,id:'g',type:'group_sort',prompt:'Nhóm',options:[{id:'me',text:'mẹ',audioUrl:'',imageUrl:''},{id:'ba',text:'bà',audioUrl:'',imageUrl:''}],groups:[{id:'m',label:'M'},{id:'b',label:'B'}],correctAnswer:{me:'m',ba:'b'}},
    {...common,id:'f',type:'fill_blanks',prompt:'Điền',template:'Bé {{v}} {{o}}.',blankSlots:[{id:'v',label:'Hành động',acceptedAnswers:['đọc']},{id:'o',label:'Đồ vật',acceptedAnswers:['sách']}]},
    {...common,id:'s',type:'follow_steps',prompt:'Thực hiện',steps:[{id:'stand',text:'Đứng lên'}]},
  ]}}/>);
  fireEvent.change(screen.getByRole('combobox',{name:'Nhóm của mẹ, vị trí 1'}),{target:{value:'m'}});
  fireEvent.change(screen.getByRole('combobox',{name:'Nhóm của bà, vị trí 2'}),{target:{value:'m'}});
  fireEvent.click(screen.getByRole('button',{name:'Gửi câu trả lời'}));
  expect(screen.getByText('Đã ghi câu trả lời')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Tiếp tục xem trước'}));
  expect(screen.getByRole('textbox',{name:'Hành động'})).toHaveValue('');
  fireEvent.change(screen.getByRole('textbox',{name:'Hành động'}),{target:{value:'đọc'}});
  fireEvent.change(screen.getByRole('textbox',{name:'Đồ vật'}),{target:{value:'sách'}});
  fireEvent.click(screen.getByRole('button',{name:'Gửi câu trả lời'}));
  fireEvent.click(screen.getByRole('button',{name:'Tiếp tục xem trước'}));
  fireEvent.click(screen.getByRole('checkbox',{name:'Bước 1: Đứng lên'}));
  fireEvent.click(screen.getByRole('button',{name:'Gửi xác nhận'}));
  expect(screen.getByText('Đã ghi xác nhận của bé')).toBeInTheDocument();
  expect(api.post).not.toHaveBeenCalled();
  expect(useLessonSessionStore.getState().currentSession).toEqual(session);
  expect(navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();
  expect(localStorage.getItem('vietverse_offline_completions')).toBe('[{"id":"keep"}]');
});
it("allows real choice interaction across all non-recording activity renderers without learning writes", () => {
  const option = (id: string, text: string) => ({
    id,
    text,
    audioUrl: "",
    imageUrl: "",
  });
  render(
    <LessonPreview
      payload={{
        ...lesson,
        activities: [
          { ...lesson.activities[0], type: "word_card", prompt: "Thẻ chữ" },
          {
            ...lesson.activities[0],
            id: "b",
            type: "listen_choose",
            prompt: "Nghe",
            options: [option("yes", "mẹ"), option("no", "bà")],
            correctAnswer: "yes",
          },
          {
            ...lesson.activities[0],
            id: "c",
            type: "drag_match",
            prompt: "Ghép",
            pairs: [
              { left: "A", right: "a" },
              { left: "B", right: "b" },
            ],
          },
          {
            ...lesson.activities[0],
            id: "d",
            type: "fill_blank",
            prompt: "Điền",
            options: [option("yes", "c"), option("no", "b")],
            correctAnswer: "yes",
            blanks: [{ sentence: "______á", missing: "c" }],
          },
          {
            ...lesson.activities[0],
            id: "e",
            type: "sort_order",
            prompt: "Xếp",
            orderedItems: ["bé", "đọc"],
            correctAnswer: ["bé", "đọc"],
          },
          {
            ...lesson.activities[0],
            id: "f",
            type: "review",
            prompt: "Ôn tập",
            options: [option("yes", "mẹ"), option("no", "bà")],
            correctAnswer: "yes",
          },
        ],
      }}
      issues={[]}
    />,
  );
  for (const title of ["Thẻ chữ", "Nghe", "Ghép", "Điền", "Xếp", "Ôn tập"]) {
    expect(screen.getByText(title)).toBeInTheDocument();
    if (title === "Điền") expect(screen.getByText("á")).toBeInTheDocument();
    if (title === "Nghe" || title === "Ôn tập") {
      fireEvent.click(screen.getByRole("button", { name: /mẹ$/ }));
      expect(screen.getByText("Đúng trong bản xem trước.")).toBeInTheDocument();
    }
    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục xem trước" }));
  }
  expect(api.post).not.toHaveBeenCalled();
  expect(useLessonSessionStore.getState().currentSession).toEqual(session);
});
it("shows story text in line order without fake playback and culture quiz without rewards", () => {
  const { unmount } = render(
    <StoryPreview
      payload={{
        title: "Nguồn",
        author: "",
        description: "",
        type: "dong_dao",
        audioUrl: "",
        coverImage: "",
        durationSec: 0,
        ageGroups: ["5-6"],
        lyrics: [
          { text: "Rồng rắn lên mây", timeSec: 0 },
          { text: "Có cây xúc sắc", timeSec: 0 },
        ],
        vocab: [],
        quiz: [],
      }}
    />,
  );
  expect(screen.getByTestId("lyrics").textContent).toBe(
    "Rồng rắn lên mâyCó cây xúc sắc",
  );
  expect(screen.queryByLabelText("Nghe thử audio")).not.toBeInTheDocument();
  unmount();
  render(
    <CulturePreview
      payload={{
        title: "Tết",
        category: "tet",
        intro: "Giới thiệu",
        funFacts: ["Sự thật"],
        coverImage: "",
        audioUrl: "",
        tags: [],
        quiz: [{ question: "Chọn", options: ["Tết", "Hè"], correctAnswer: 0 }],
      }}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Tết" }));
  expect(screen.getByText(/Đúng trong bản xem trước/)).toBeInTheDocument();
  expect(api.post).not.toHaveBeenCalled();
});
