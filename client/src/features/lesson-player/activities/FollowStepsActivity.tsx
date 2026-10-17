import React from 'react';
import { cn } from '../../../lib/utils.js';
import { useT } from '../../../i18n/index.js';
import { NewActivityFrame, IncompleteActivity } from './NewActivityFrame.js';
import { activityControlClass, activitySubmitClass, distinctIds, type NewActivityProps } from './newActivity.types.js';

export function FollowStepsActivity({ activity, value, disabled, onChange, onSubmit }: NewActivityProps) {
  const t = useT();
  if (activity.type !== 'follow_steps' || !activity.steps || activity.steps.length < 1 || activity.steps.length > 3 ||
    !distinctIds(activity.steps) || activity.steps.some(step => !step.text.trim())) return <IncompleteActivity />;
  const selected = Array.isArray(value) ? value : [];
  const ordered = activity.steps.filter(step => selected.includes(step.id)).map(step => step.id);
  return <NewActivityFrame activity={activity}>
    <p className="font-bold text-center text-stone-600">{t('lesson.followStepsHint')}</p>
    <ol className="space-y-3">{activity.steps.map((step, index) => <li key={step.id}>
      <label className={cn(activityControlClass, 'flex items-center gap-3', selected.includes(step.id) && 'bg-emerald-50 border-emerald-500')}>
        <input type="checkbox" className="h-6 w-6 shrink-0 accent-primary" disabled={disabled} checked={selected.includes(step.id)} aria-label={t('lesson.followStepAria', { index: index + 1, text: step.text })}
          onChange={() => onChange(selected.includes(step.id) ? ordered.filter(id => id !== step.id) :
            activity.steps.filter(item => item.id === step.id || selected.includes(item.id)).map(item => item.id))} />
        <span className="break-words">{index + 1}. {step.text}</span>
      </label>
    </li>)}</ol>
    <button type="button" className={activitySubmitClass} disabled={disabled || ordered.length !== activity.steps.length}
      onClick={() => onSubmit({ status: 'self_reported', userAnswer: ordered })}>{t('lesson.submitConfirmation')}</button>
  </NewActivityFrame>;
}
