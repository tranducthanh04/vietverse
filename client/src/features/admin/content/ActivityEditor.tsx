import React, { useState } from "react";
import type { Activity, ActivityPromptTranslations, SupportLanguage } from "./content.types.js";
import { activityTypeLabels, type ActivityType } from './content.types.js';
import { TextField, StringRows } from "./FormFields.js";
import { MediaFields } from "./MediaFields.js";
import { FieldNotes } from "./EditorialNotes.js";
import { useNoteDescription } from "./editorialNotesContext.js";
import { useFieldErrorA11y } from "./fieldIssuesContext.js";
import { MultiSelectEditor } from './MultiSelectEditor.js';
import { GroupSortEditor } from './GroupSortEditor.js';
import { FillBlanksEditor } from './FillBlanksEditor.js';
import { FollowStepsEditor } from './FollowStepsEditor.js';
import { ConfirmationDialog } from './ConfirmationDialog.js';
import { TranslationEditor, type Translations } from './TranslationEditor.js';

// Activity types that grade an answer immediately, so a "when wrong" hint and audio replay apply.
const WRONG_FEEDBACK_TYPES: ActivityType[] = ['listen_choose', 'review', 'fill_blank', 'sort_order'];

// `promptTranslations` is a flat { lang: string } map, but TranslationEditor edits nested entries.
// Wrap each language's prompt into a one-key entry for editing and unwrap on save (dropping blanks),
// so the saved payload matches the model: absent when empty, a plain trimmed string per language.
function promptTranslationsToEditor(value?: ActivityPromptTranslations): Translations {
  return Object.fromEntries(
    Object.entries(value ?? {}).map(([lang, prompt]) => [lang, { prompt }]),
  ) as Translations;
}
function editorToPromptTranslations(next: Translations): ActivityPromptTranslations | undefined {
  const out: ActivityPromptTranslations = {};
  for (const [lang, entry] of Object.entries(next)) {
    const prompt = typeof entry?.prompt === 'string' ? entry.prompt.trim() : '';
    if (prompt) out[lang as SupportLanguage] = prompt;
  }
  return Object.keys(out).length ? out : undefined;
}
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
  const answerA11y = useFieldErrorA11y(`${path}.correctAnswer`, answerNoteId);
  const [pendingType, setPendingType] = useState<ActivityType | null>(null);
  const n = index + 1;
  const patch = (change: Partial<Activity>) =>
    onChange({ ...value, ...change });
  return (
    <div>
      <p>
        Loại: {value.type} · ID: {value.id || "Cấp khi lưu"}
      </p>
      <label className="cms-field"><span>Loại hoạt động {n}</span>
        <select value={value.type} onChange={event => {
          const type=event.target.value as ActivityType;
          if(type!==value.type) setPendingType(type);
        }}>{Object.entries(activityTypeLabels).map(([type,label])=><option key={type} value={type}>{label}</option>)}</select>
      </label>
      {pendingType && <ConfirmationDialog title="Đổi loại hoạt động" onCancel={()=>setPendingType(null)}>
        <p>Đổi loại sẽ bỏ dữ liệu riêng của loại cũ (lựa chọn, đáp án, nhóm, ô hoặc bước). Giữ hướng dẫn, media và gợi ý.</p>
        <div className="cms-actions"><button type="button" onClick={()=>setPendingType(null)}>Hủy</button>
          <button type="button" onClick={()=>{
            onChange({id:value.id,type:pendingType,prompt:value.prompt,promptTranslations:value.promptTranslations,subPrompt:value.subPrompt,
              audioUrl:value.audioUrl,imageUrl:value.imageUrl,hints:value.hints,
              wrongHint:value.wrongHint,wrongHintTranslations:value.wrongHintTranslations,pointsWeight:value.pointsWeight});
            setPendingType(null);
          }}>Đổi loại</button>
        </div>
      </ConfirmationDialog>}
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
      <fieldset>
        <legend>Bản dịch câu hỏi {n}</legend>
        <p className="cms-meta">
          Bản dịch câu hỏi (hướng dẫn) cho từng ngôn ngữ hỗ trợ, tối đa 300 ký tự mỗi ngôn ngữ. Hiện
          ngay dưới câu hỏi tiếng Việt cho bé theo ngôn ngữ đã chọn; tiếng Việt vẫn là chính và audio
          vẫn đọc tiếng Việt. Để trống nếu chưa có bản dịch được duyệt.
        </p>
        <TranslationEditor
          translations={promptTranslationsToEditor(value.promptTranslations)}
          onChange={(next) => patch({ promptTranslations: editorToPromptTranslations(next) })}
          sections={[{ kind: 'text', key: 'prompt', label: 'Câu hỏi', multiline: true }]}
        />
      </fieldset>
      <MediaFields value={value} prefix={`${path}.`} onChange={patch} />
      {value.type==='multi_select' && <MultiSelectEditor activity={value} onChange={onChange} index={index}/>}
      {value.type==='group_sort' && <GroupSortEditor activity={value} onChange={onChange} index={index}/>}
      {value.type==='fill_blanks' && <FillBlanksEditor activity={value} onChange={onChange} index={index}/>}
      {value.type==='follow_steps' && <FollowStepsEditor activity={value} onChange={onChange} index={index}/>}
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
              {...answerA11y}
              name={`${path}.correctAnswer`}
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
      {WRONG_FEEDBACK_TYPES.includes(value.type) && (
        <fieldset>
          <legend>Gợi ý khi trả lời sai {n}</legend>
          <p className="cms-meta">
            Hiện ngay dưới câu hỏi khi bé chọn sai. Với hoạt động có audio, audio nguồn sẽ tự phát lại.
            Để trống thì dùng lời động viên chung. Ví dụ: “mèo” với bản dịch cat / 고양이 / 猫 / chat / 猫.
          </p>
          <TextField
            label={`Gợi ý khi sai ${n}`}
            name={`${path}.wrongHint`}
            value={value.wrongHint ?? ''}
            onChange={(wrongHint) => patch({ wrongHint })}
            multiline
          />
          <TranslationEditor
            translations={(value.wrongHintTranslations ?? {}) as Translations}
            onChange={(next) =>
              patch({ wrongHintTranslations: Object.keys(next).length ? next : undefined })
            }
            sections={[{ kind: 'text', key: 'wrongHint', label: 'Gợi ý khi sai' }]}
          />
        </fieldset>
      )}
    </div>
  );
}
