export const POINT_RULES = {
  LESSON_COMPLETE: 10,
  ACTIVITY_COMPLETE: 1,
  CULTURE_QUIZ: 5,
  STAGE_COMPLETE: 20,
  LESSON_20_TREASURE: 50,
} as const;

/** Default amounts; admins may override amount/active per key via PointRule (D3). */
export type PointRuleKey = keyof typeof POINT_RULES;
export const POINT_RULE_KEYS = Object.keys(POINT_RULES) as PointRuleKey[];

export type PointReason =
  | 'lesson'
  | 'activity'
  | 'culture_quiz'
  | 'stage_complete'
  | 'treasure'
  | 'redeem'
  | 'refund'
  | 'use_reward'; // reserved for D4 (spending a reward); no flow writes it yet

export const POINT_REASONS: readonly PointReason[] = [
  'lesson', 'activity', 'culture_quiz', 'stage_complete', 'treasure', 'redeem', 'refund', 'use_reward',
];

/** Earning reasons limited to one transaction per (child, reason, refId); spend-side reasons may repeat. */
export const ONE_TIME_AWARD_REASONS: readonly PointReason[] = [
  'lesson', 'activity', 'culture_quiz', 'stage_complete', 'treasure',
];

export const COMPETENCY_AREAS = [
  'listening', // Nghe
  'speaking',  // Nói & Giao tiếp
  'reading',   // Đọc
  'thinking',  // Tư duy ngôn ngữ & Văn hóa
] as const;

export type CompetencyArea = (typeof COMPETENCY_AREAS)[number];

export const COMPETENCY_LABELS: Record<CompetencyArea, string> = {
  listening: 'Nghe hiểu',
  speaking: 'Nói & Giao tiếp',
  reading: 'Nhận biết mặt chữ',
  thinking: 'Tư duy & Văn hóa',
};
