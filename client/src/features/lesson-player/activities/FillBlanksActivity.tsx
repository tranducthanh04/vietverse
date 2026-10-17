import React from 'react';
import { useT } from '../../../i18n/index.js';
import { NewActivityFrame, IncompleteActivity } from './NewActivityFrame.js';
import { activityControlClass, activitySubmitClass, distinctIds, inputMap, type NewActivityProps } from './newActivity.types.js';

export function FillBlanksActivity({ activity, value, disabled, onChange, onSubmit }: NewActivityProps) {
  const t = useT();
  if (activity.type !== 'fill_blanks' || !activity.blankSlots || activity.blankSlots.length < 2 || activity.blankSlots.length > 6 ||
    typeof activity.template !== 'string' || !distinctIds(activity.blankSlots)) return <IncompleteActivity />;
  const markers = [...activity.template.matchAll(/\{\{([A-Za-z0-9_-]+)\}\}/g)];
  const ids = markers.map(marker => marker[1]);
  if (ids.length !== activity.blankSlots.length || new Set(ids).size !== ids.length ||
    /[{}]/.test(activity.template.replace(/\{\{([A-Za-z0-9_-]+)\}\}/g, '')) ||
    activity.blankSlots.some(slot => !ids.includes(slot.id))) return <IncompleteActivity />;
  const map = inputMap(value);
  const segments: React.ReactNode[] = [];
  let cursor = 0;
  for (const marker of markers) {
    const slot = activity.blankSlots.find(slot => slot.id === marker[1])!;
    segments.push(activity.template.slice(cursor, marker.index));
    segments.push(<label key={slot.id} className="inline-flex flex-col align-middle m-1 max-w-full">
      <span className="text-xs font-bold text-stone-500">{slot.label}</span>
      <input className={`${activityControlClass} w-40 max-w-full`} aria-label={slot.label} maxLength={200} autoComplete="off" disabled={disabled}
        value={map[slot.id] || ''} onChange={event => onChange({ ...map, [slot.id]: event.target.value })} />
    </label>);
    cursor = marker.index! + marker[0].length;
  }
  segments.push(activity.template.slice(cursor));
  return <NewActivityFrame activity={activity}>
    <div className="bg-white border-4 border-accent rounded-3xl px-5 py-6 shadow-kid text-kid-base font-bold leading-loose break-words text-center">{segments}</div>
    <button type="button" className={activitySubmitClass} disabled={disabled || activity.blankSlots.some(slot => !map[slot.id]?.trim())}
      onClick={() => onSubmit({ status: 'submitted', userAnswer: Object.fromEntries(activity.blankSlots.map(slot => [slot.id, map[slot.id]])) })}>{t('lesson.submitAnswer')}</button>
  </NewActivityFrame>;
}
