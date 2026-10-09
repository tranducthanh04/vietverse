import React, { useState } from "react";
import { afterEach, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { LessonEditor } from "../features/admin/content/LessonEditor.js";
import { MediaFields } from "../features/admin/content/MediaFields.js";
import type { LessonContent } from "../features/admin/content/content.types.js";
afterEach(cleanup);
const initial: LessonContent = {
  title: "Bài một",
  description: "",
  stageId: "stage1",
  order: 1,
  freeInStarterPlan: true,
  totalActivities: 2,
  vocabulary: [],
  activities: [
    {
      id: "a",
      type: "word_card",
      prompt: "Đọc",
      targetWord: "mẹ",
      audioUrl: "",
      imageUrl: "",
      pointsWeight: 3,
    },
    {
      id: "b",
      type: "sort_order",
      prompt: "Xếp",
      orderedItems: ["bé", "đọc"],
      correctAnswer: ["bé", "đọc"],
      audioUrl: "",
      imageUrl: "",
    },
  ],
};
function Form() {
  const [value, setValue] = useState(initial);
  return (
    <>
      <LessonEditor value={value} onChange={setValue} />
      <output data-testid="value">{JSON.stringify(value)}</output>
    </>
  );
}
it("keeps catalog and activity identity while moving/removing rows, preserving unedited metadata", () => {
  render(<Form />);
  expect(screen.getByLabelText("Thứ tự bài")).toHaveAttribute("readonly");
  fireEvent.click(screen.getByRole("button", { name: "Đưa hoạt động 2 lên" }));
  let value = JSON.parse(screen.getByTestId("value").textContent!);
  expect(value.activities.map((a: { id: string }) => a.id)).toEqual(["b", "a"]);
  expect(value.activities[1].pointsWeight).toBe(3);
  fireEvent.click(screen.getByRole("button", { name: "Xóa hoạt động 1" }));
  value = JSON.parse(screen.getByTestId("value").textContent!);
  expect(value.activities.map((a: { id: string }) => a.id)).toEqual(["a"]);
});
it("adds vocabulary and all seven activity form types without fabricating server IDs", () => {
  render(<Form />);
  fireEvent.click(screen.getByRole("button", { name: "Thêm từ vựng" }));
  fireEvent.change(screen.getByLabelText("Từ 1"), { target: { value: "bà" } });
  for (const type of [
    "listen_choose",
    "word_card",
    "drag_match",
    "fill_blank",
    "sort_order",
    "record_voice",
    "review",
  ]) {
    fireEvent.change(screen.getByLabelText("Loại hoạt động mới"), {
      target: { value: type },
    });
    fireEvent.click(screen.getByRole("button", { name: "Thêm hoạt động" }));
  }
  const value = JSON.parse(screen.getByTestId("value").textContent!);
  expect(value.vocabulary[0].word).toBe("bà");
  expect(value.activities.slice(2).map((a: { id: string }) => a.id)).toEqual([
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  expect(screen.getByLabelText("Câu có ô trống 6")).toBeInTheDocument();
  expect(screen.getByLabelText("Từ cần đọc 8")).toBeInTheDocument();
});
it("distinguishes unsafe media syntax from an asset load failure", () => {
  const { rerender } = render(
    <MediaFields
      value={{ audioUrl: "javascript:alert(1)" }}
      onChange={() => {}}
    />,
  );
  expect(screen.getByText(/URL không hợp lệ/)).toBeInTheDocument();
  expect(screen.queryByLabelText("Nghe thử audio")).not.toBeInTheDocument();
  rerender(
    <MediaFields
      value={{ audioUrl: "https://example.test/a.mp3" }}
      onChange={() => {}}
    />,
  );
  fireEvent.error(screen.getByLabelText("Nghe thử audio"));
  expect(screen.getByText(/Không tải được audio/)).toBeInTheDocument();
});
