import React from "react";
import { categories, type CultureContent, type CultureTranslations } from "./content.types.js";
import { TextField, StringRows } from "./FormFields.js";
import { MediaFields } from "./MediaFields.js";
import { QuizEditor } from "./QuizEditor.js";
import { FieldNotes } from "./EditorialNotes.js";
import { TranslationEditor } from "./TranslationEditor.js";
import type { CoverUploadContext } from './CoverImageUpload.js';
export function CultureEditor({
  value,
  onChange,
  uploadContext,
  onUploadBusy,
  uploadDisabled,
}: {
  value: CultureContent;
  onChange: (value: CultureContent) => void;
  uploadContext?: CoverUploadContext;
  onUploadBusy?: (busy: boolean) => void;
  uploadDisabled?: boolean;
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
        uploadContext={uploadContext}
        onUploadBusy={onUploadBusy}
        uploadDisabled={uploadDisabled}
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
      <TranslationEditor
        translations={value.translations ?? {}}
        onChange={(translations) =>
          patch({ translations: translations as CultureTranslations })
        }
        sections={[
          { kind: "text", key: "title", label: "Tiêu đề" },
          { kind: "text", key: "intro", label: "Mở đầu", multiline: true },
          {
            kind: "list",
            key: "funFacts",
            label: "Thông tin thú vị",
            source: value.funFacts,
          },
        ]}
      />
    </div>
  );
}
