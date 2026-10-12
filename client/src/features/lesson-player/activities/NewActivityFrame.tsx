import React from "react";
import type { NewLearnerActivity } from "./newActivity.types.js";
import { AudioButton } from "../../../components/ui/AudioButton.js";

export function NewActivityFrame({
  activity,
  children,
}: {
  activity: NewLearnerActivity;
  children: React.ReactNode;
}) {
  const instructions = [
    activity.prompt,
    activity.subPrompt,
    ...(activity.type === "follow_steps"
      ? activity.steps.map((step) => step.text)
      : []),
  ]
    .filter(Boolean)
    .join(". ");
  return (
    <section className="w-full max-w-2xl space-y-5 p-4 text-stone-800">
      <h2 className="text-kid-lg font-display font-bold break-words">
        {activity.prompt}
      </h2>
      {activity.subPrompt && <p>{activity.subPrompt}</p>}
      <AudioButton
        contentKey={activity.id}
        audioUrl={activity.audioUrl}
        textToSpeak={instructions}
        label="Nghe hướng dẫn"
        size="sm"
      />
      {!activity.audioUrl && activity.type === "follow_steps" && (
        <p>
          Chưa có audio nguồn. Bé có thể dùng giọng đọc thiết bị hoặc đọc hướng
          dẫn bên dưới.
        </p>
      )}
      {children}
    </section>
  );
}
export function IncompleteActivity() {
  return (
    <p role="alert" className="p-4">
      Hoạt động chưa đủ dữ liệu. Vui lòng nhờ phụ huynh kiểm tra lại.
    </p>
  );
}
