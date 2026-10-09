import React from "react";
import type { CultureContent } from "./content.types.js";
import { MediaAsset } from "./MediaFields.js";
import { QuizPreview } from "./QuizPreview.js";
export function CulturePreview({ payload }: { payload: CultureContent }) {
  return (
    <article className="cms">
      <h1>{payload.title}</h1>
      <MediaAsset url={payload.coverImage} />
      <p className="whitespace-pre-wrap">{payload.intro}</p>
      <MediaAsset audio url={payload.audioUrl} />
      {payload.funFacts.map((fact, i) => (
        <p key={i} className="whitespace-pre-wrap">
          {fact}
        </p>
      ))}
      <p>{payload.tags.join(" · ")}</p>
      <QuizPreview value={payload.quiz} />
    </article>
  );
}
