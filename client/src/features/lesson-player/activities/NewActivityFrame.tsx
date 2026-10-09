import React, { useState } from 'react';
import type { NewLearnerActivity } from './newActivity.types.js';

export function NewActivityFrame({ activity, children }: { activity: NewLearnerActivity; children: React.ReactNode }) {
  const [audioError, setAudioError] = useState(false);
  return <section className="w-full max-w-2xl space-y-5 p-4 text-stone-800">
    <h2 className="text-kid-lg font-display font-bold break-words">{activity.prompt}</h2>
    {activity.subPrompt && <p>{activity.subPrompt}</p>}
    {activity.audioUrl ? <>
      <audio className="w-full" controls preload="none" src={activity.audioUrl} aria-label="Nghe hướng dẫn" onError={() => setAudioError(true)} />
      {audioError && <p role="alert">Chưa phát được audio. Bé vẫn có thể đọc hướng dẫn bên dưới.</p>}
    </> : activity.type === 'follow_steps' && <p>Chưa có audio nguồn. Bé đọc hướng dẫn bên dưới.</p>}
    {children}
  </section>;
}
export function IncompleteActivity() {
  return <p role="alert" className="p-4">Hoạt động chưa đủ dữ liệu. Vui lòng nhờ phụ huynh kiểm tra lại.</p>;
}
