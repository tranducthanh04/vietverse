import React from "react";
import "./content.css";
import { FieldNotes } from "./EditorialNotes.js";
import { useNoteDescription } from "./editorialNotesContext.js";
export function TextField({
  label,
  name,
  value,
  onChange,
  multiline = false,
  readOnly = false,
}: {
  label: string;
  name: string;
  value: string | number;
  onChange?: (value: string) => void;
  multiline?: boolean;
  readOnly?: boolean;
}) {
  const noteId = useNoteDescription(name);
  const props = {
    name,
    "aria-describedby": noteId,
    value,
    readOnly,
    onChange: (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => onChange?.(event.target.value),
  };
  return (
    <div className="cms-field">
      <label className="cms-field-label">
        <span>{label}</span>
        {multiline ? <textarea {...props} rows={3} /> : <input {...props} />}
      </label>
      <FieldNotes field={name} id={noteId} />
    </div>
  );
}
export function NumberField({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const noteId = useNoteDescription(name);
  return (
    <div className="cms-field">
      <label className="cms-field-label">
        <span>{label}</span>
        <input
          name={name}
          aria-describedby={noteId}
          type="number"
          min="0"
          step="any"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </label>
      <FieldNotes field={name} id={noteId} />
    </div>
  );
}
export function StringRows({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: string[];
  onChange: (value: string[]) => void;
}) {
  return (
    <fieldset>
      <legend>{label}</legend>
      <FieldNotes field={name} />
      {value.map((text, i) => (
        <div key={i} className="cms-row">
          <TextField
            label={`${label} ${i + 1}`}
            name={`${name}.${i}`}
            value={text}
            onChange={(next) =>
              onChange(value.map((old, j) => (j === i ? next : old)))
            }
          />
          <button
            type="button"
            aria-label={`Đưa ${label} ${i + 1} lên`}
            disabled={i === 0}
            onClick={() => {
              const next = [...value];
              [next[i - 1], next[i]] = [next[i], next[i - 1]];
              onChange(next);
            }}
          >
            Lên
          </button>
          <button
            type="button"
            aria-label={`Xóa ${label} ${i + 1}`}
            onClick={() => onChange(value.filter((_, j) => i !== j))}
          >
            Xóa
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...value, ""])}>
        Thêm {label.toLocaleLowerCase("vi")}
      </button>
    </fieldset>
  );
}
