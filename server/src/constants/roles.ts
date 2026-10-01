export const ROLES = {
  PARENT: 'parent',
  ADMIN: 'admin',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];
