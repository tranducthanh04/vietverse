import React, { useState } from "react";
import type { Activity, LessonContent, FieldIssue } from "./content.types.js";
import { WordCardActivity } from "../../lesson-player/activities/WordCardActivity.js";
import { ListenChooseActivity } from "../../lesson-player/activities/ListenChooseActivity.js";
import { DragMatchActivity } from "../../lesson-player/activities/DragMatchActivity.js";
import { FillBlankActivity } from "../../lesson-player/activities/FillBlankActivity.js";
import { SortOrderActivity } from "../../lesson-player/activities/SortOrderActivity.js";
import { ReviewActivity } from "../../lesson-player/activities/ReviewActivity.js";

// Deliberately no activityRegistry import: it includes the live recording component.
function PureActivity({
  activity,
  onComplete,
}: {
  activity: Activity;
  onComplete: (correct: boolean) => void;
}) {
  const correctAnswer =
    typeof activity.correctAnswer === "string" ? activity.correctAnswer : "";
  switch (activity.type) {
    case "word_card":
      return <WordCardActivity activity={activity} onComplete={onComplete} />;
    case "listen_choose":
      return (
        <ListenChooseActivity
          activity={{ ...activity, correctAnswer }}
          onComplete={onComplete}
        />
      );
    case "review":
      return (
        <ReviewActivity
          activity={{ ...activity, correctAnswer }}
          onComplete={onComplete}
        />
      );
    case "drag_match":
      return <DragMatchActivity activity={activity} onComplete={onComplete} />;
    case "fill_blank":
      return (
        <FillBlankActivity
          activity={{
            ...activity,
            correctAnswer,
            options: activity.options?.map((option) => ({
              ...option,
              text: option.text ?? "",
            })),
          }}
          onComplete={onComplete}
        />
      );
    case "sort_order":
      return (
        <SortOrderActivity
          activity={{
            ...activity,
            correctAnswer: Array.isArray(activity.correctAnswer)
              ? activity.correctAnswer
              : undefined,
          }}
          onComplete={onComplete}
        />
      );
    case "record_voice":
      return (
        <section aria-label="Xem trước thu âm">
          <h2>{activity.prompt}</h2>
          <p>{activity.targetWord}</p>
          <p>Thu âm bị tắt trong chế độ xem trước.</p>
        </section>
      );
    default:
      return <p role="alert">Loại hoạt động chưa được hỗ trợ.</p>;
  }
}
export function LessonPreview({
  payload,
  issues = [],
}: {
  payload: LessonContent;
  issues?: FieldIssue[];
}) {
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<boolean | null>(null);
  const activity = payload.activities[step];
  const errors = issues.filter(
    (issue) =>
      issue.field === "activities" ||
      issue.field.startsWith(`activities.${step}.`),
  );
  return (
    <div className="cms">
      <h2>Xem trước — không lưu tiến độ</h2>
      <p>
        {payload.title} · Hoạt động{" "}
        {Math.min(step + 1, payload.activities.length)}/
        {payload.activities.length}
      </p>
      {!activity ? (
        <p>Đã xem hết bản nháp. Không cộng điểm.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            {errors.length ? (
              <div role="alert">
                {errors.map((error, i) => (
                  <p key={i}>
                    {error.field}: {error.message}
                  </p>
                ))}
              </div>
            ) : (
              <PureActivity
                key={`${step}:${activity.id}`}
                activity={activity}
                onComplete={setResult}
              />
            )}
          </div>
          {result !== null && (
            <p role="status">
              {result
                ? "Đúng trong bản xem trước."
                : "Chưa đúng trong bản xem trước."}
            </p>
          )}
          <button
            onClick={() => {
              setStep(step + 1);
              setResult(null);
            }}
          >
            Tiếp tục xem trước
          </button>
        </>
      )}
      <button
        disabled={step === 0}
        onClick={() => {
          setStep(Math.max(0, step - 1));
          setResult(null);
        }}
      >
        Hoạt động trước
      </button>
    </div>
  );
}
