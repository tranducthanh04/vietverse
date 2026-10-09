import React, { useRef } from "react";
import { TextField } from "./FormFields.js";
import type { Quiz } from "./content.types.js";
import { FieldNotes } from "./EditorialNotes.js";
function QuestionEditor({
  value,
  onChange,
  index,
}: {
  value: Quiz;
  onChange: (value: Quiz) => void;
  index: number;
}) {
  const ids = useRef<string[]>([]);
  while (ids.current.length < value.options.length)
    ids.current.push(crypto.randomUUID());
  ids.current = ids.current.slice(0, value.options.length);
  const rows = value.options.map((text, i) => ({ id: ids.current[i], text }));
  const correctId = rows[value.correctAnswer]?.id ?? "";
  const update = (next: typeof rows) => {
    ids.current = next.map((row) => row.id);
    onChange({
      ...value,
      options: next.map((row) => row.text),
      correctAnswer: next.findIndex((row) => row.id === correctId),
    });
  };
  const n = index + 1;
  const path = `quiz.${index}`;
  return (
    <>
      <TextField
        label={`Câu hỏi ${n}`}
        name={`${path}.question`}
        value={value.question}
        onChange={(question) => onChange({ ...value, question })}
        multiline
      />
      {rows.map((row, i) => (
        <div className="cms-row" key={row.id}>
          <TextField
            label={`Đáp án ${n}.${i + 1}`}
            name={`${path}.options.${i}`}
            value={row.text}
            onChange={(text) =>
              update(
                rows.map((old) => (old.id === row.id ? { ...old, text } : old)),
              )
            }
          />
          <button
            type="button"
            aria-label={`Đưa đáp án ${n}.${i + 1} lên`}
            disabled={i === 0}
            onClick={() => {
              const next = [...rows];
              [next[i - 1], next[i]] = [next[i], next[i - 1]];
              update(next);
            }}
          >
            Lên
          </button>
          <button
            type="button"
            aria-label={`Xóa đáp án ${n}.${i + 1}`}
            onClick={() => update(rows.filter((old) => old.id !== row.id))}
          >
            Xóa
          </button>
        </div>
      ))}
      <button
        type="button"
        disabled={rows.length >= 8}
        onClick={() => update([...rows, { id: crypto.randomUUID(), text: "" }])}
      >
        Thêm đáp án câu {n}
      </button>
      <label className="cms-field">
        <span>Đáp án đúng câu {n}</span>
        <select
          name={`${path}.correctAnswer`}
          value={correctId}
          onChange={(event) =>
            onChange({
              ...value,
              correctAnswer: rows.findIndex(
                (row) => row.id === event.target.value,
              ),
            })
          }
        >
          <option value="">Chọn đáp án đúng</option>
          {rows.map((row, i) => (
            <option key={row.id} value={row.id}>
              {i + 1}. {row.text || "(trống)"}
            </option>
          ))}
        </select>
      </label>
      {!correctId && (
        <p role="alert">Chưa chọn đáp án đúng. Không thể xuất bản câu này.</p>
      )}
      <TextField
        label={`Giải thích câu ${n}`}
        name={`${path}.explanation`}
        value={value.explanation ?? ""}
        onChange={(explanation) => onChange({ ...value, explanation })}
        multiline
      />
    </>
  );
}
export function QuizEditor({
  value,
  onChange,
}: {
  value: Quiz[];
  onChange: (value: Quiz[]) => void;
}) {
  return (
    <fieldset>
      <legend>Quiz</legend>
      <FieldNotes field="quiz" />
      {value.map((question, i) => (
        <fieldset key={i}>
          <legend>Câu {i + 1}</legend>
          <QuestionEditor
            index={i}
            value={question}
            onChange={(next) =>
              onChange(value.map((old, at) => (at === i ? next : old)))
            }
          />
          <button
            type="button"
            onClick={() => onChange(value.filter((_, at) => at !== i))}
          >
            Xóa câu {i + 1}
          </button>
        </fieldset>
      ))}
      <button
        type="button"
        disabled={value.length >= 20}
        onClick={() =>
          onChange([...value, { question: "", options: [], correctAnswer: -1 }])
        }
      >
        Thêm câu hỏi
      </button>
    </fieldset>
  );
}
