import React, { useState } from "react";
import type { ActivityType, LessonContent } from "./content.types.js";
import { TextField } from "./FormFields.js";
import { VocabularyEditor } from "./VocabularyEditor.js";
import { ActivityEditor } from "./ActivityEditor.js";
import { FieldNotes } from "./EditorialNotes.js";
export function LessonEditor({
  value,
  onChange,
  busy = false,
}: {
  value: LessonContent;
  onChange: (value: LessonContent) => void;
  busy?: boolean;
}) {
  const [type, setType] = useState<ActivityType>("word_card");
  const move = (i: number, offset: number) => {
    const activities = [...value.activities];
    [activities[i], activities[i + offset]] = [
      activities[i + offset],
      activities[i],
    ];
    onChange({ ...value, activities });
  };
  return (
    <div>
      <TextField
        label="Chặng (ID cố định)"
        name="stageId"
        value={value.stageId}
        readOnly
      />
      <TextField label="Thứ tự bài" name="order" value={value.order} readOnly />
      <TextField
        label="Mô tả"
        name="description"
        value={value.description}
        onChange={(description) => onChange({ ...value, description })}
        multiline
      />
      <label className="cms-row">
        <input
          type="checkbox"
          checked={value.freeInStarterPlan}
          onChange={(e) =>
            onChange({ ...value, freeInStarterPlan: e.target.checked })
          }
        />
        Có trong gói Starter
      </label>
      <fieldset disabled={busy}>
        <VocabularyEditor
          value={value.vocabulary}
          onChange={(vocabulary) => onChange({ ...value, vocabulary })}
        />
        <legend>Hoạt động ({value.activities.length})</legend>
        <FieldNotes field="activities" />
        <FieldNotes field="audioUrl" />
        {value.activities.map((activity, i) => (
          <fieldset key={activity.id || `new-${i}`}>
            <legend>Hoạt động {i + 1}</legend>
            <div className="cms-actions">
              <button
                type="button"
                aria-label={`Đưa hoạt động ${i + 1} lên`}
                disabled={i === 0}
                onClick={() => move(i, -1)}
              >
                Lên
              </button>
              <button
                type="button"
                aria-label={`Đưa hoạt động ${i + 1} xuống`}
                disabled={i === value.activities.length - 1}
                onClick={() => move(i, 1)}
              >
                Xuống
              </button>
              <button
                type="button"
                aria-label={`Xóa hoạt động ${i + 1}`}
                onClick={() =>
                  onChange({
                    ...value,
                    activities: value.activities.filter((_, at) => at !== i),
                  })
                }
              >
                Xóa
              </button>
            </div>
            <ActivityEditor
              index={i}
              value={activity}
              onChange={(next) =>
                onChange({
                  ...value,
                  activities: value.activities.map((old, at) =>
                    at === i ? next : old,
                  ),
                })
              }
            />
          </fieldset>
        ))}
        <label className="cms-field">
          <span>Loại hoạt động mới</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ActivityType)}
          >
            {[
              "listen_choose",
              "word_card",
              "drag_match",
              "fill_blank",
              "sort_order",
              "record_voice",
              "review",
            ].map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={value.activities.length >= 50}
          onClick={() =>
            onChange({
              ...value,
              activities: [
                ...value.activities,
                { id: "", type, prompt: "", audioUrl: "", imageUrl: "" },
              ],
            })
          }
        >
          Thêm hoạt động
        </button>
      </fieldset>
    </div>
  );
}
