export type NewActivityType = 'multi_select' | 'group_sort' | 'fill_blanks' | 'follow_steps';
export type NewActivityInput = string[] | Record<string, string>;
export interface NewActivitySubmission { status: 'submitted' | 'self_reported'; userAnswer: NewActivityInput }
export interface ActivityOption { id: string; text?: string; imageUrl?: string; audioUrl?: string }
type Common = { id: string; prompt: string; audioUrl?: string; subPrompt?: string };
export type NewLearnerActivity = Common & (
  | { type: 'multi_select'; options: ActivityOption[] }
  | { type: 'group_sort'; options: ActivityOption[]; groups: { id: string; label: string }[] }
  | { type: 'fill_blanks'; template: string; blankSlots: { id: string; label: string }[] }
  | { type: 'follow_steps'; steps: { id: string; text: string }[] }
);
export interface NewActivityProps {
  activity: NewLearnerActivity;
  value: NewActivityInput;
  disabled?: boolean;
  onChange: (value: NewActivityInput) => void;
  onSubmit: (result: NewActivitySubmission) => void;
}
export const isNewActivityType = (type: string): type is NewActivityType =>
  ['multi_select','group_sort','fill_blanks','follow_steps'].includes(type);
export const activityControlClass = 'min-h-[44px] min-w-[44px] rounded-xl border-2 border-stone-300 p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-60';
export const safeItemId = (id: string) => /^[A-Za-z0-9_-]{1,64}$/.test(id) && !['__proto__','constructor','prototype'].includes(id);
export const distinctIds = (items: { id: string }[]) => items.every(item => safeItemId(item.id)) && new Set(items.map(item => item.id)).size === items.length;
export const inputMap = (value: NewActivityInput): Record<string, string> => Array.isArray(value) ? {} : value;
