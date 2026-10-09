import React, { useState } from "react";
import type { StoryContent } from "./content.types.js";
import { MediaAsset } from "./MediaFields.js";
import { QuizPreview } from "./QuizPreview.js";
export function StoryPreview({ payload }: { payload: StoryContent }) {
  const [time, setTime] = useState(0);
  return (
    <article className="cms">
      <h1>{payload.title}</h1>
      <p>{payload.author}</p>
      <p className="whitespace-pre-wrap">{payload.description}</p>
      <MediaAsset url={payload.coverImage} />
      <div
        onTimeUpdate={(event) => {
          if (event.target instanceof HTMLAudioElement)
            setTime(event.target.currentTime);
        }}
      >
        <MediaAsset audio url={payload.audioUrl} />
      </div>
      <div data-testid="lyrics">
        {payload.lyrics.map((line, i) => (
          <p
            key={i}
            className="whitespace-pre-wrap"
            aria-current={
              Boolean(payload.audioUrl) &&
              time >= line.timeSec &&
              (i === payload.lyrics.length - 1 ||
                time < payload.lyrics[i + 1].timeSec)
                ? "true"
                : undefined
            }
          >
            {line.text}
          </p>
        ))}
      </div>
      <p>Từ vựng: {payload.vocab.join(", ")}</p>
      <p>Quiz biên tập: chưa thêm luồng quiz truyện cho bé.</p>
      <QuizPreview value={payload.quiz} />
    </article>
  );
}
