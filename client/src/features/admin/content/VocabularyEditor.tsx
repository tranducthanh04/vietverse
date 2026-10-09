import React from "react";
import type { Vocabulary } from "./content.types.js";
import { TextField } from "./FormFields.js";
import { MediaFields } from "./MediaFields.js";
import { FieldNotes } from "./EditorialNotes.js";
export function VocabularyEditor({
  value,
  onChange,
}: {
  value: Vocabulary[];
  onChange: (value: Vocabulary[]) => void;
}) {
  const patch = (i: number, change: Partial<Vocabulary>) =>
    onChange(
      value.map((word, at) => (at === i ? { ...word, ...change } : word)),
    );
  return (
    <fieldset>
      <legend>Từ vựng</legend>
      <FieldNotes field="vocabulary" />
      {value.map((word, i) => (
        <fieldset key={i}>
          <legend>Từ vựng {i + 1}</legend>
          <TextField
            label={`Từ ${i + 1}`}
            name={`vocabulary.${i}.word`}
            value={word.word}
            onChange={(word) => patch(i, { word })}
          />
          <TextField
            label={`Nghĩa ${i + 1}`}
            name={`vocabulary.${i}.meaning`}
            value={word.meaning}
            onChange={(meaning) => patch(i, { meaning })}
            multiline
          />
          <TextField
            label={`Phiên âm ${i + 1}`}
            name={`vocabulary.${i}.phonetic`}
            value={word.phonetic ?? ""}
            onChange={(phonetic) => patch(i, { phonetic })}
          />
          <MediaFields
            prefix={`vocabulary.${i}.`}
            value={word}
            onChange={(change) => patch(i, change)}
          />
          <button
            type="button"
            onClick={() => onChange(value.filter((_, at) => at !== i))}
          >
            Xóa từ {i + 1}
          </button>
        </fieldset>
      ))}
      <button
        type="button"
        disabled={value.length >= 100}
        onClick={() =>
          onChange([
            ...value,
            { word: "", meaning: "", audioUrl: "", imageUrl: "" },
          ])
        }
      >
        Thêm từ vựng
      </button>
    </fieldset>
  );
}
