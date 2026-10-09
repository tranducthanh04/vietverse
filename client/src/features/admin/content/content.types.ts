export type ContentKind = "lesson" | "story" | "culture";
export type FieldIssue = { field: string; message: string };
export type ActivityType =
  | "listen_choose"
  | "word_card"
  | "drag_match"
  | "fill_blank"
  | "sort_order"
  | "record_voice"
  | "review";
export type Activity = {
  id: string;
  type: ActivityType;
  prompt: string;
  subPrompt?: string;
  audioUrl: string;
  imageUrl: string;
  options?: { id: string; text?: string; imageUrl: string; audioUrl: string }[];
  correctAnswer?: string | string[] | number | boolean | Record<string, string>;
  hints?: string[];
  targetWord?: string;
  targetPhonetic?: string;
  pairs?: { left: string; right: string }[];
  blanks?: { sentence: string; missing: string }[];
  orderedItems?: string[];
  pointsWeight?: number;
};
export type Vocabulary = {
  word: string;
  meaning: string;
  phonetic?: string;
  audioUrl: string;
  imageUrl: string;
};
export type Quiz = {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
};
export type LessonContent = {
  title: string;
  description: string;
  stageId: string;
  order: number;
  vocabulary: Vocabulary[];
  activities: Activity[];
  totalActivities?: number;
  freeInStarterPlan: boolean;
};
export type StoryContent = {
  title: string;
  description: string;
  author: string;
  type: "dong_dao" | "co_tich" | "tho" | "ngu_ngon";
  coverImage: string;
  audioUrl: string;
  durationSec: number;
  ageGroups: ("5-6" | "6-8")[];
  vocab: string[];
  lyrics: { text: string; timeSec: number }[];
  quiz: Quiz[];
};
export type CultureContent = {
  title: string;
  category: string;
  intro: string;
  coverImage: string;
  audioUrl: string;
  funFacts: string[];
  tags: string[];
  quiz: Quiz[];
};
export type ContentPayloadMap = {
  lesson: LessonContent;
  story: StoryContent;
  culture: CultureContent;
};
export type Payload = ContentPayloadMap[ContentKind];
export type DraftView<K extends ContentKind = ContentKind> = {
  kind: K;
  contentId: string;
  payload: ContentPayloadMap[K];
  draftVersion: number;
  baseContentVersion: number | null;
  state: "editing" | "synced" | "discarded";
  updatedAt: string;
  updatedBy: string;
  source?: {
    documentUrl: string;
    tabId: string;
    heading: string;
    capturedAt: string;
    checksum: string;
  };
  editorialNotes: { field: string; reason: string; message: string }[];
};
export type ContentDetail = {
  live: {
    kind: ContentKind;
    contentId: string;
    contentVersion: number;
    visibility: "published" | "withdrawn";
    payload: Payload;
  } | null;
  draft: DraftView | null;
};
export type ContentState =
  "published" | "draft" | "new" | "withdrawn" | "discarded";
export type ContentList = {
  items: {
    kind: ContentKind;
    contentId: string;
    title: string;
    contentVersion: number | null;
    draftVersion: number | null;
    state: ContentState;
    updatedAt: string;
    stageId?: string;
    category?: string;
    hasDraft: boolean;
  }[];
  total: number;
  page: number;
  pageSize: number;
};
export const paths = {
  lesson: "/admin/bai-hoc",
  story: "/admin/truyen",
  culture: "/admin/van-hoa",
};
export const titles = {
  lesson: "Bài học",
  story: "Truyện / đồng dao",
  culture: "Văn hóa",
};
export const categories = {
  tet: "Tết",
  am_thuc: "Ẩm thực",
  trang_phuc: "Trang phục",
  phong_tuc: "Phong tục",
  le_hoi: "Lễ hội",
  vat_dung: "Vật dụng",
  thien_nhien: "Thiên nhiên",
  tro_choi_dan_gian: "Trò chơi dân gian",
};
