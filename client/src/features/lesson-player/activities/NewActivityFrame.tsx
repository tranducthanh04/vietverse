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
    <section className="w-full max-w-2xl flex flex-col gap-5 p-4 sm:p-6 text-stone-800">
      <header className="flex flex-col items-center gap-3 text-center">
        <h2 className="text-kid-lg md:text-kid-xl font-display font-bold break-words text-balance">
          {activity.prompt}
        </h2>
        {activity.subPrompt && <p className="text-kid-sm text-stone-600">{activity.subPrompt}</p>}
        <AudioButton
          contentKey={activity.id}
          audioUrl={activity.audioUrl}
          textToSpeak={instructions}
          label="Nghe hướng dẫn"
          size="sm"
        />
        {!activity.audioUrl && activity.type === "follow_steps" && (
          <MissingSourceAudioNotice hint="đọc hướng dẫn bên dưới" />
        )}
      </header>
      {children}
    </section>
  );
}
// Honest notice when content has no recorded source audio: device speech only.
export function MissingSourceAudioNotice({ hint }: { hint: string }) {
  return (
    <p className="text-sm text-stone-600">
      Chưa có audio nguồn. Bé có thể dùng giọng đọc thiết bị hoặc {hint}.
    </p>
  );
}
export function IncompleteActivity() {
  return (
    <p role="alert" className="p-4">
      Hoạt động chưa đủ dữ liệu. Vui lòng nhờ phụ huynh kiểm tra lại.
    </p>
  );
}
