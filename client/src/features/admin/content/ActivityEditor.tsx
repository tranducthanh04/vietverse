import React from "react";
import type { Activity } from "./content.types.js";
import { TextField, StringRows } from "./FormFields.js";
import { MediaFields } from "./MediaFields.js";
import { FieldNotes } from "./EditorialNotes.js";
import { useNoteDescription } from "./editorialNotesContext.js";
export function ActivityEditor({
  value,
  onChange,
  index,
}: {
  value: Activity;
  onChange: (value: Activity) => void;
  index: number;
}) {
  const path = `activities.${index}`;
  const answerNoteId = useNoteDescription(`${path}.correctAnswer`);
  const n = index + 1;
  const patch = (change: Partial<Activity>) =>
    onChange({ ...value, ...change });
  return (
    <div>
      <p>
        Loại: {value.type} · ID: {value.id || "Cấp khi lưu"}
      </p>
      <TextField
        label={`Hướng dẫn ${n}`}
        name={`${path}.prompt`}
        value={value.prompt}
        onChange={(prompt) => patch({ prompt })}
        multiline
      />
      <TextField
        label={`Hướng dẫn phụ ${n}`}
        name={`${path}.subPrompt`}
        value={value.subPrompt ?? ""}
        onChange={(subPrompt) => patch({ subPrompt })}
      />
      <MediaFields value={value} prefix={`${path}.`} onChange={patch} />
      {["word_card", "record_voice"].includes(value.type) && (
        <>
          <TextField
            label={`Từ cần đọc ${n}`}
            name={`${path}.targetWord`}
            value={value.targetWord ?? ""}
            onChange={(targetWord) => patch({ targetWord })}
          />
          <TextField
            label={`Phiên âm hoạt động ${n}`}
            name={`${path}.targetPhonetic`}
            value={value.targetPhonetic ?? ""}
            onChange={(targetPhonetic) => patch({ targetPhonetic })}
          />
        </>
      )}
      {["listen_choose", "fill_blank", "review"].includes(value.type) && (
        <fieldset>
          <legend>Lựa chọn {n}</legend>
          {(value.options ?? []).map((option, i) => (
            <fieldset key={option.id}>
              <TextField
                label={`Lựa chọn ${n}.${i + 1}`}
                name={`${path}.options.${i}.text`}
                value={option.text ?? ""}
                onChange={(text) =>
                  patch({
                    options: value.options!.map((old, at) =>
                      at === i ? { ...old, text } : old,
                    ),
                  })
                }
              />
              <MediaFields
                prefix={`${path}.options.${i}.`}
                value={option}
                onChange={(change) =>
                  patch({
                    options: value.options!.map((old, at) =>
                      at === i ? { ...old, ...change } : old,
                    ),
                  })
                }
              />
              <button
                type="button"
                onClick={() =>
                  patch({
                    options: value.options!.filter((_, at) => at !== i),
                    correctAnswer:
                      value.correctAnswer === option.id
                        ? ""
                        : value.correctAnswer,
                  })
                }
              >
                Xóa lựa chọn {n}.{i + 1}
              </button>
            </fieldset>
          ))}
          <button
            type="button"
            disabled={(value.options?.length ?? 0) >= 8}
            onClick={() =>
              patch({
                options: [
                  ...(value.options ?? []),
                  {
                    id: crypto.randomUUID(),
                    text: "",
                    audioUrl: "",
                    imageUrl: "",
                  },
                ],
              })
            }
          >
            Thêm lựa chọn {n}
          </button>
          <label className="cms-field">
            <span>Đáp án {n}</span>
            <select
              name={`${path}.correctAnswer`}
              aria-describedby={answerNoteId}
              value={
                typeof value.correctAnswer === "string"
                  ? value.correctAnswer
                  : ""
              }
              onChange={(e) => patch({ correctAnswer: e.target.value })}
            >
              <option value="">Chọn đáp án</option>
              {value.options?.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.text || option.id}
                </option>
              ))}
            </select>
          </label>
          <FieldNotes field={`${path}.correctAnswer`} id={answerNoteId} />
        </fieldset>
      )}
      {value.type === "fill_blank" && (
        <>
          <TextField
            label={`Câu có ô trống ${n}`}
            name={`${path}.blanks`}
            value={value.blanks?.[0]?.sentence ?? ""}
            onChange={(sentence) =>
              patch({
                blanks: [
                  { sentence, missing: value.blanks?.[0]?.missing ?? "" },
                ],
              })
            }
          />
          <TextField
            label={`Từ còn thiếu ${n}`}
            name={`${path}.blanks.0.missing`}
            value={value.blanks?.[0]?.missing ?? ""}
            onChange={(missing) =>
              patch({
                blanks: [
                  { sentence: value.blanks?.[0]?.sentence ?? "", missing },
                ],
              })
            }
          />
        </>
      )}
      {value.type === "drag_match" && (
        <fieldset>
          <legend>Cặp ghép {n}</legend>
          {(value.pairs ?? []).map((pair, i) => (
            <div className="cms-row" key={i}>
              {(["left", "right"] as const).map((side) => (
                <TextField
                  key={side}
                  label={`${side === "left" ? "Vế trái" : "Vế phải"} ${n}.${i + 1}`}
                  name={`${path}.pairs.${i}.${side}`}
                  value={pair[side]}
                  onChange={(text) =>
                    patch({
                      pairs: value.pairs!.map((old, at) =>
                        at === i ? { ...old, [side]: text } : old,
                      ),
                    })
                  }
                />
              ))}
              <button
                type="button"
                onClick={() =>
                  patch({ pairs: value.pairs!.filter((_, at) => at !== i) })
                }
              >
                Xóa cặp {n}.{i + 1}
              </button>
            </div>
          ))}
          <button
            type="button"
            disabled={(value.pairs?.length ?? 0) >= 12}
            onClick={() =>
              patch({
                pairs: [...(value.pairs ?? []), { left: "", right: "" }],
              })
            }
          >
            Thêm cặp {n}
          </button>
        </fieldset>
      )}
      {value.type === "sort_order" && (
        <StringRows
          label={`Thành phần ${n}`}
          name={`${path}.orderedItems`}
          value={value.orderedItems ?? []}
          onChange={(orderedItems) =>
            patch({ orderedItems, correctAnswer: [...orderedItems] })
          }
        />
      )}
      <StringRows
        label={`Gợi ý ${n}`}
        name={`${path}.hints`}
        value={value.hints ?? []}
        onChange={(hints) => patch({ hints })}
      />
    </div>
  );
}
