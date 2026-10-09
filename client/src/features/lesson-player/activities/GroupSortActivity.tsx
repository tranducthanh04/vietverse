import React from 'react';
import { NewActivityFrame, IncompleteActivity } from './NewActivityFrame.js';
import { activityControlClass, distinctIds, inputMap, type NewActivityProps } from './newActivity.types.js';

export function GroupSortActivity({ activity, value, disabled, onChange, onSubmit }: NewActivityProps) {
  if (activity.type !== 'group_sort' || !activity.options || !activity.groups || activity.options.length < 2 || activity.options.length > 12 ||
    activity.groups.length < 2 || activity.groups.length > 6 || !distinctIds(activity.options) || !distinctIds(activity.groups)) return <IncompleteActivity />;
  const map = inputMap(value);
  const complete = activity.options.every(option => activity.groups.some(group => group.id === map[option.id]));
  return <NewActivityFrame activity={activity}>
    <p>Chọn nhóm cho từng từ. Một nhóm có thể có nhiều từ.</p>
    <div className="space-y-3">{activity.options.map((option, index) => <label key={option.id} className="flex flex-col sm:flex-row gap-3 sm:items-center">
      <span className="flex-1 break-words">{option.text || `Hình ${index + 1}`}</span>
      {option.imageUrl && <img src={option.imageUrl} alt={option.text || `Hình ${index + 1}`} className="h-16 w-16 object-contain" />}
      <select className={`${activityControlClass} max-w-full`} disabled={disabled} value={map[option.id] || ''}
        aria-label={`Nhóm của ${option.text || 'hình ảnh'}, vị trí ${index + 1}`}
        onChange={event => onChange({ ...map, [option.id]: event.target.value })}>
        <option value="">Chưa phân nhóm</option>
        {activity.groups.map(group => <option key={group.id} value={group.id}>{group.label}</option>)}
      </select>
    </label>)}</div>
    <button type="button" className={activityControlClass} disabled={disabled || !complete}
      onClick={() => onSubmit({ status: 'submitted', userAnswer: Object.fromEntries(activity.options.map(option => [option.id, map[option.id]])) })}>Gửi câu trả lời</button>
  </NewActivityFrame>;
}
