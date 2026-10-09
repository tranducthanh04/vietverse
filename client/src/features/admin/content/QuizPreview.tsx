import React, { useState } from "react";
import type { Quiz } from "./content.types.js";
export function QuizPreview({ value }: { value: Quiz[] }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  return (
    <div>
      {value.map((question, i) => (
        <section key={i}>
          <h2>{question.question}</h2>
          <div className="cms-actions">
            {question.options.map((option, j) => (
              <button
                key={j}
                onClick={() => setAnswers({ ...answers, [i]: j })}
              >
                {option || "(Lựa chọn trống)"}
              </button>
            ))}
          </div>
          {i in answers && (
            <p>
              {answers[i] === question.correctAnswer
                ? "Đúng trong bản xem trước."
                : "Chưa đúng trong bản xem trước."}{" "}
              Không cộng điểm. {question.explanation}
            </p>
          )}
        </section>
      ))}
    </div>
  );
}
