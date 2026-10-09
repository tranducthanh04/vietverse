import React from "react";
import type { StoryContent } from "./content.types.js";
import { TextField, NumberField, StringRows } from "./FormFields.js";
import { MediaFields } from "./MediaFields.js";
import { QuizEditor } from "./QuizEditor.js";
export function StoryEditor({
  value,
  onChange,
}: {
  value: StoryContent;
  onChange: (value: StoryContent) => void;
}) {
  const patch = (change: Partial<StoryContent>) =>
    onChange({ ...value, ...change });
  return (
    <div>
      <label className="cms-field">
        <span>Thể loại</span>
        <select
          name="type"
          value={value.type}
          onChange={(e) =>
            patch({ type: e.target.value as StoryContent["type"] })
          }
        >
          {Object.entries({
            dong_dao: "Đồng dao",
            co_tich: "Cổ tích",
            tho: "Thơ",
            ngu_ngon: "Ngụ ngôn",
          }).map(([key, title]) => (
            <option key={key} value={key}>
              {title}
            </option>
          ))}
        </select>
      </label>
      <TextField
        label="Tác giả / ghi công"
        name="author"
        value={value.author}
        onChange={(author) => patch({ author })}
      />
      <TextField
        label="Mô tả truyện"
        name="description"
        value={value.description}
        onChange={(description) => patch({ description })}
        multiline
      />
      <MediaFields
        value={{ audioUrl: value.audioUrl, imageUrl: value.coverImage }}
        onChange={(change) =>
          patch({
            ...(change.audioUrl !== undefined
              ? { audioUrl: change.audioUrl }
              : {}),
            ...(change.imageUrl !== undefined
              ? { coverImage: change.imageUrl }
              : {}),
          })
        }
      />
      <NumberField
        label="Thời lượng audio (giây)"
        name="durationSec"
        value={value.durationSec}
        onChange={(durationSec) => patch({ durationSec })}
      />
      <fieldset>
        <legend>Nhóm tuổi</legend>
        {(["5-6", "6-8"] as const).map((age) => (
          <label className="cms-row" key={age}>
            <input
              type="checkbox"
              checked={value.ageGroups.includes(age)}
              onChange={(e) =>
                patch({
                  ageGroups: e.target.checked
                    ? [...value.ageGroups, age]
                    : value.ageGroups.filter((old) => old !== age),
                })
              }
            />
            {age} tuổi
          </label>
        ))}
      </fieldset>
      <StringRows
        label="Từ truyện"
        name="vocab"
        value={value.vocab}
        onChange={(vocab) => patch({ vocab })}
      />
      <fieldset>
        <legend>Lời / dòng đọc</legend>
        {!value.audioUrl && (
          <p>
            Không có audio: đọc theo thứ tự dòng; mốc 0 không giả thời gian
            phát.
          </p>
        )}
        {value.lyrics.map((line, i) => (
          <fieldset key={i}>
            <TextField
              label={`Dòng lời ${i + 1}`}
              name={`lyrics.${i}.text`}
              value={line.text}
              onChange={(text) =>
                patch({
                  lyrics: value.lyrics.map((old, at) =>
                    at === i ? { ...old, text } : old,
                  ),
                })
              }
            />
            <NumberField
              label={`Mốc giây dòng ${i + 1}`}
              name={`lyrics.${i}.timeSec`}
              value={line.timeSec}
              onChange={(timeSec) =>
                patch({
                  lyrics: value.lyrics.map((old, at) =>
                    at === i ? { ...old, timeSec } : old,
                  ),
                })
              }
            />
            <div className="cms-actions">
              <button
                type="button"
                aria-label={`Đưa dòng ${i + 1} lên`}
                disabled={i === 0}
                onClick={() => {
                  const lyrics = [...value.lyrics];
                  [lyrics[i - 1], lyrics[i]] = [lyrics[i], lyrics[i - 1]];
                  patch({ lyrics });
                }}
              >
                Lên
              </button>
              <button
                type="button"
                onClick={() =>
                  patch({ lyrics: value.lyrics.filter((_, at) => at !== i) })
                }
              >
                Xóa dòng {i + 1}
              </button>
            </div>
          </fieldset>
        ))}
        <button
          type="button"
          disabled={value.lyrics.length >= 500}
          onClick={() =>
            patch({ lyrics: [...value.lyrics, { text: "", timeSec: 0 }] })
          }
        >
          Thêm dòng lời
        </button>
      </fieldset>
      <QuizEditor value={value.quiz} onChange={(quiz) => patch({ quiz })} />
    </div>
  );
}
