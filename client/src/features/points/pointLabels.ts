/** Display labels for PointTransaction.reason, shared by every screen that renders the ledger. */
export const POINT_REASON_LABELS: Record<string, string> = {
  lesson: 'Hoàn thành bài học',
  activity: 'Hoàn thành hoạt động',
  culture_quiz: 'Hoàn thành thử thách',
  stage_complete: 'Hoàn thành chặng',
  treasure: 'Báu vật Nước Nam',
  redeem: 'Đổi vật phẩm',
  use_reward: 'Sử dụng phần thưởng',
  refund: 'Hoàn điểm đổi quà',
};

/** Reasons added on the server later still render, as a generic configured reward. */
export const FALLBACK_POINT_REASON_LABEL = 'Hoạt động thưởng';

export function pointReasonLabel(reason: string | undefined | null): string {
  return (reason && Object.prototype.hasOwnProperty.call(POINT_REASON_LABELS, reason)
    ? POINT_REASON_LABELS[reason]
    : FALLBACK_POINT_REASON_LABEL);
}

/** "+10" for credits, "−30" (U+2212 minus sign) for debits, as in the customer spec. */
export function formatPointDelta(delta: number): string {
  if (delta > 0) return `+${delta}`;
  if (delta < 0) return `−${Math.abs(delta)}`;
  return '0';
}

const pad = (value: number) => String(value).padStart(2, '0');

function startOfLocalDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/**
 * "Hôm nay" / "Hôm qua" / dd/MM/yyyy in the browser's local timezone.
 * Invalid input returns an empty string instead of "Invalid Date".
 */
export function formatPointDate(value: string | number | Date, now: Date = new Date()): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const today = startOfLocalDay(now);
  const day = startOfLocalDay(date);
  if (day === today) return 'Hôm nay';
  // Compare calendar days (not 24h windows) so DST shifts cannot mislabel yesterday.
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime();
  if (day === yesterday) return 'Hôm qua';
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export type ShopCategory = 'badge' | 'avatar' | 'profile_decoration' | 'collectible';
export type ShopFilter = 'all' | ShopCategory | 'physical';

export const SHOP_FILTERS: { value: ShopFilter; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'badge', label: 'Huy hiệu' },
  { value: 'avatar', label: 'Avatar' },
  { value: 'profile_decoration', label: 'Trang trí hồ sơ' },
  { value: 'collectible', label: 'Sưu tầm' },
  { value: 'physical', label: 'Quà gửi tận nhà' },
];

export const SHOP_CATEGORY_LABELS: Record<ShopCategory, string> = {
  badge: 'Huy hiệu đặc biệt',
  avatar: 'Avatar',
  profile_decoration: 'Trang trí hồ sơ',
  collectible: 'Vật phẩm sưu tầm',
};

export interface ShopItemView {
  _id: string;
  name: string;
  type: 'virtual' | 'physical';
  category?: ShopCategory;
  costPoints: number;
  assetUrl?: string;
  description?: string;
  stock?: number;
  active?: boolean;
}

/** Physical gifts form their own group; uncategorised legacy virtual items count as collectibles. */
export function shopItemGroup(item: Pick<ShopItemView, 'type' | 'category'>): Exclude<ShopFilter, 'all'> {
  if (item.type === 'physical') return 'physical';
  return item.category ?? 'collectible';
}

export function matchesShopFilter(item: Pick<ShopItemView, 'type' | 'category'>, filter: ShopFilter): boolean {
  return filter === 'all' || shopItemGroup(item) === filter;
}

/** Server error message from an Axios-style error, or the given fallback. */
export function apiErrorMessage(error: unknown, fallback: string): string {
  const message = (error as { response?: { data?: { error?: { message?: unknown } } } } | null)
    ?.response?.data?.error?.message;
  return typeof message === 'string' && message ? message : fallback;
}
