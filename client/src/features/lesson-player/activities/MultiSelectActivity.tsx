import React from 'react';
import { cn } from '../../../lib/utils.js';
import { NewActivityFrame, IncompleteActivity } from './NewActivityFrame.js';
import { activityControlClass, activitySubmitClass, distinctIds, type NewActivityProps } from './newActivity.types.js';

export function MultiSelectActivity({ activity, value, disabled, onChange, onSubmit }: NewActivityProps) {
  if (activity.type !== 'multi_select' || !activity.options || activity.options.length < 2 ||
    activity.options.length > 12 || !distinctIds(activity.options)) return <IncompleteActivity />;
  const selected = Array.isArray(value) ? value.filter(id => activity.options.some(option => option.id === id)) : [];
  return <NewActivityFrame activity={activity}>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {activity.options.map((option, index) => <label key={option.id} className={cn(activityControlClass, 'flex items-center gap-3', selected.includes(option.id) && 'bg-amber-100 border-primary')}>
        <input type="checkbox" className="h-6 w-6 shrink-0 accent-primary" disabled={disabled} checked={selected.includes(option.id)}
          aria-label={`Chữ ${option.text || 'hình ảnh'}, vị trí ${index + 1}`}
          onChange={() => onChange(selected.includes(option.id) ? selected.filter(id => id !== option.id) : [...selected, option.id])} />
        {option.imageUrl && <img src={option.imageUrl} alt={option.text || `Lựa chọn ${index + 1}`} className="h-16 w-16 object-contain" />}
        <span className="break-words font-bold">{option.text || `Lựa chọn ${index + 1}`}</span>
      </label>)}
    </div>
    <button type="button" className={activitySubmitClass} disabled={disabled || !selected.length}
      onClick={() => onSubmit({ status: 'submitted', userAnswer: [...selected] })}>Gửi câu trả lời</button>
  </NewActivityFrame>;
}
