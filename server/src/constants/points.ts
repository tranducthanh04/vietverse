export const POINT_RULES = {
  LESSON_COMPLETE: 10,
  CULTURE_QUIZ: 5,
  STAGE_COMPLETE: 20,
  LESSON_20_TREASURE: 50,
} as const;

export type PointReason =
  | 'lesson'
  | 'culture_quiz'
  | 'stage_complete'
  | 'treasure'
  | 'redeem'
  | 'refund';

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
