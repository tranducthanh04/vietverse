import React, { useState } from "react";
import type { Activity, LessonContent, FieldIssue } from "./content.types.js";
import { WordCardActivity } from "../../lesson-player/activities/WordCardActivity.js";
import { ListenChooseActivity } from "../../lesson-player/activities/ListenChooseActivity.js";
import { DragMatchActivity } from "../../lesson-player/activities/DragMatchActivity.js";
import { FillBlankActivity } from "../../lesson-player/activities/FillBlankActivity.js";
import { SortOrderActivity } from "../../lesson-player/activities/SortOrderActivity.js";
import { ReviewActivity } from "../../lesson-player/activities/ReviewActivity.js";
import { MultiSelectActivity } from '../../lesson-player/activities/MultiSelectActivity.js';
import { GroupSortActivity } from '../../lesson-player/activities/GroupSortActivity.js';
import { FillBlanksActivity } from '../../lesson-player/activities/FillBlanksActivity.js';
import { FollowStepsActivity } from '../../lesson-player/activities/FollowStepsActivity.js';
import { isNewActivityType, type NewActivityInput, type NewActivityProps, type NewLearnerActivity } from '../../lesson-player/activities/newActivity.types.js';

// Deliberately no activityRegistry import: it includes the live recording component.
function PureActivity({
  activity,
  onComplete,
  onSubmit,
}: {
  activity: Activity;
  onComplete: (correct: boolean) => void;
  onSubmit: (status: string) => void;
}) {
  const [value,setValue]=useState<NewActivityInput>(['multi_select','follow_steps'].includes(activity.type)?[]:{});
  const [submitted,setSubmitted]=useState(false);
  if(isNewActivityType(activity.type)) {
    const common={id:activity.id,prompt:activity.prompt,subPrompt:activity.subPrompt,audioUrl:activity.audioUrl};
    let visible:NewLearnerActivity;
    let Component:React.FC<NewActivityProps>;
    switch(activity.type){
      case 'multi_select': visible={...common,type:activity.type,options:activity.options??[]};Component=MultiSelectActivity;break;
      case 'group_sort': visible={...common,type:activity.type,options:activity.options??[],groups:activity.groups??[]};Component=GroupSortActivity;break;
      case 'fill_blanks': visible={...common,type:activity.type,template:activity.template??'',blankSlots:(activity.blankSlots??[]).map(slot=>({id:slot.id,label:slot.label}))};Component=FillBlanksActivity;break;
      case 'follow_steps': visible={...common,type:activity.type,steps:activity.steps??[]};Component=FollowStepsActivity;break;
    }
    return <Component activity={visible} value={value} onChange={setValue} disabled={submitted} onSubmit={result=>{
      setSubmitted(true);onSubmit(result.status==='self_reported'?'Đã ghi xác nhận của bé':'Đã ghi câu trả lời');
    }}/>;
  }
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
  const [acknowledgement,setAcknowledgement]=useState<string|null>(null);
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
                onSubmit={setAcknowledgement}
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
          {acknowledgement && <p role="status">{acknowledgement}</p>}
          {isNewActivityType(activity.type) && <details><summary>Đáp án dành cho admin — không phải dữ liệu gửi cho bé</summary>
            <pre className="whitespace-pre-wrap break-words">{JSON.stringify(activity.type==='fill_blanks'?activity.blankSlots?.map(slot=>({id:slot.id,acceptedAnswers:slot.acceptedAnswers})):
              activity.type==='follow_steps'?activity.steps?.map(step=>step.id):activity.correctAnswer,null,2)}</pre>
          </details>}
          <button
            onClick={() => {
              setStep(step + 1);
              setResult(null);
              setAcknowledgement(null);
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
          setAcknowledgement(null);
        }}
      >
        Hoạt động trước
      </button>
    </div>
  );
}
