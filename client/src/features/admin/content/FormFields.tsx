import React from "react";
import "./content.css";
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
  const props = {
    name,
    value,
    readOnly,
    onChange: (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => onChange?.(event.target.value),
  };
  return (
    <label className="cms-field">
      <span>{label}</span>
      {multiline ? <textarea {...props} rows={3} /> : <input {...props} />}
    </label>
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
  return (
    <label className="cms-field">
      <span>{label}</span>
      <input
        name={name}
        type="number"
        min="0"
        step="any"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
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
