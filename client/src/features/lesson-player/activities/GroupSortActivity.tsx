import React from 'react';
import { useT } from '../../../i18n/index.js';
import { NewActivityFrame, IncompleteActivity } from './NewActivityFrame.js';
import { activityControlClass, activitySubmitClass, distinctIds, inputMap, type NewActivityProps } from './newActivity.types.js';

export function GroupSortActivity({ activity, value, disabled, onChange, onSubmit }: NewActivityProps) {
  const t = useT();
  if (activity.type !== 'group_sort' || !activity.options || !activity.groups || activity.options.length < 2 || activity.options.length > 12 ||
    activity.groups.length < 2 || activity.groups.length > 6 || !distinctIds(activity.options) || !distinctIds(activity.groups)) return <IncompleteActivity />;
  const map = inputMap(value);
  const complete = activity.options.every(option => activity.groups.some(group => group.id === map[option.id]));
  return <NewActivityFrame activity={activity}>
    <p className="text-center text-stone-600">{t('lesson.groupSortHint')}</p>
    <div className="space-y-3">{activity.options.map((option, index) => <label key={option.id} className="flex flex-col sm:flex-row gap-3 sm:items-center bg-white border-3 border-cream-border rounded-2xl p-3 shadow-sm">
      <span className="flex-1 break-words text-kid-sm font-bold font-display">{option.text || t('lesson.imageNumberFallback', { index: index + 1 })}</span>
      {option.imageUrl && <img src={option.imageUrl} alt={option.text || t('lesson.imageNumberFallback', { index: index + 1 })} className="h-16 w-16 object-contain" />}
      <select className={`${activityControlClass} max-w-full`} disabled={disabled} value={map[option.id] || ''}
        aria-label={t('lesson.groupSortOptionAria', { label: option.text || t('lesson.imageFallback'), index: index + 1 })}
        onChange={event => onChange({ ...map, [option.id]: event.target.value })}>
        <option value="">{t('lesson.noGroup')}</option>
        {activity.groups.map(group => <option key={group.id} value={group.id}>{group.label}</option>)}
      </select>
    </label>)}</div>
    <button type="button" className={activitySubmitClass} disabled={disabled || !complete}
      onClick={() => onSubmit({ status: 'submitted', userAnswer: Object.fromEntries(activity.options.map(option => [option.id, map[option.id]])) })}>{t('lesson.submitAnswer')}</button>
  </NewActivityFrame>;
}
