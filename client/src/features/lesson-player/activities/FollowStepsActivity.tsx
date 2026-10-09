import React from 'react';
import { NewActivityFrame, IncompleteActivity } from './NewActivityFrame.js';
import { activityControlClass, distinctIds, type NewActivityProps } from './newActivity.types.js';

export function FollowStepsActivity({ activity, value, disabled, onChange, onSubmit }: NewActivityProps) {
  if (activity.type !== 'follow_steps' || !activity.steps || activity.steps.length < 1 || activity.steps.length > 3 ||
    !distinctIds(activity.steps) || activity.steps.some(step => !step.text.trim())) return <IncompleteActivity />;
  const selected = Array.isArray(value) ? value : [];
  const ordered = activity.steps.filter(step => selected.includes(step.id)).map(step => step.id);
  return <NewActivityFrame activity={activity}>
    <p className="font-bold">Bé tự xác nhận đã thực hiện</p>
    <ol className="space-y-3">{activity.steps.map((step, index) => <li key={step.id}>
      <label className={`${activityControlClass} flex items-center gap-3 bg-white`}>
        <input type="checkbox" className="h-6 w-6 shrink-0" disabled={disabled} checked={selected.includes(step.id)} aria-label={`Bước ${index + 1}: ${step.text}`}
          onChange={() => onChange(selected.includes(step.id) ? ordered.filter(id => id !== step.id) :
            activity.steps.filter(item => item.id === step.id || selected.includes(item.id)).map(item => item.id))} />
        <span className="break-words">{index + 1}. {step.text}</span>
      </label>
    </li>)}</ol>
    <button type="button" className={activityControlClass} disabled={disabled || ordered.length !== activity.steps.length}
      onClick={() => onSubmit({ status: 'self_reported', userAnswer: ordered })}>Gửi xác nhận</button>
  </NewActivityFrame>;
}
