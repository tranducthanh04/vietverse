import React from "react";
import { categories, type CultureContent } from "./content.types.js";
import { TextField, StringRows } from "./FormFields.js";
import { MediaFields } from "./MediaFields.js";
import { QuizEditor } from "./QuizEditor.js";
import { FieldNotes } from "./EditorialNotes.js";
export function CultureEditor({
  value,
  onChange,
}: {
  value: CultureContent;
  onChange: (value: CultureContent) => void;
}) {
  const patch = (change: Partial<CultureContent>) =>
    onChange({ ...value, ...change });
  const legacy = !(value.category in categories);
  return (
    <div>
      <label className="cms-field">
        <span>Chủ đề văn hóa</span>
        <select
          name="category"
          value={value.category}
          onChange={(e) => patch({ category: e.target.value })}
        >
          {legacy && (
            <option value={value.category}>
              {value.category || "(Chưa chọn)"}
            </option>
          )}
          {Object.entries(categories).map(([key, title]) => (
            <option key={key} value={key}>
              {title}
            </option>
          ))}
        </select>
      </label>
      <FieldNotes field="category" />
      {legacy && (
        <p role="alert">
          Chủ đề cũ chưa hợp lệ. Chọn một trong tám chủ đề trước xuất bản.
        </p>
      )}
      <TextField
        label="Mở đầu"
        name="intro"
        value={value.intro}
        onChange={(intro) => patch({ intro })}
        multiline
      />
      <StringRows
        label="Thông tin thú vị"
        name="funFacts"
        value={value.funFacts}
        onChange={(funFacts) => patch({ funFacts })}
      />
      <StringRows
        label="Thẻ chủ đề"
        name="tags"
        value={value.tags}
        onChange={(tags) => patch({ tags })}
      />
      <MediaFields
        imageName="coverImage"
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
      <QuizEditor value={value.quiz} onChange={(quiz) => patch({ quiz })} />
    </div>
  );
}
