export const newActivityTypes = ['multi_select', 'group_sort', 'fill_blanks', 'follow_steps'] as const;
export const isNewActivityType = (type: string) => (newActivityTypes as readonly string[]).includes(type);
export const isSafeActivityItemId = (id: string) => /^[A-Za-z0-9_-]{1,64}$/.test(id) &&
  !['__proto__', 'prototype', 'constructor'].includes(id);
export const normalizeActivityText = (text: string) => text.normalize('NFC').trim().toLocaleLowerCase('vi');

export function isPlainAnswerMap(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return (prototype === Object.prototype || prototype === null) &&
    Object.keys(value).every(isSafeActivityItemId);
}

export function hasExactKeys(value: Record<string, unknown>, ids: string[]): boolean {
  return ids.length > 0 && new Set(ids).size === ids.length &&
    Object.keys(value).length === ids.length && ids.every(id => Object.hasOwn(value, id));
}

// Null means malformed braces/ID. Slot-to-marker bijection is checked by the caller.
export function templateSlotIds(template: string): string[] | null {
  const matches = [...template.matchAll(/\{\{([A-Za-z0-9_-]+)\}\}/g)];
  if (/[{}]/.test(template.replace(/\{\{([A-Za-z0-9_-]+)\}\}/g, ''))) return null;
  const ids = matches.map(match => match[1]);
  return ids.every(isSafeActivityItemId) ? ids : null;
}
