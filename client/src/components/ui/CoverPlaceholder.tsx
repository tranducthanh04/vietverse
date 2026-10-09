import React from 'react';
import {
  BookOpen, Compass, Drum, Feather, Gift, Moon, Music, Puzzle, Shirt, Sparkles, Trees, Users, UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';

type Variant = { icon: LucideIcon; gradient: string; iconColor: string };

const storyVariants: Record<string, Variant> = {
  dong_dao: { icon: Music, gradient: 'from-primary-light to-accent-light', iconColor: 'text-primary' },
  co_tich: { icon: BookOpen, gradient: 'from-secondary-light to-cream-muted', iconColor: 'text-secondary' },
  tho: { icon: Feather, gradient: 'from-accent-light to-culture-light/40', iconColor: 'text-culture' },
  ngu_ngon: { icon: Sparkles, gradient: 'from-cream-muted to-primary-light', iconColor: 'text-primary' },
};

const cultureVariants: Record<string, Variant> = {
  tet: { icon: Gift, gradient: 'from-primary-light to-accent-light', iconColor: 'text-primary' },
  am_thuc: { icon: UtensilsCrossed, gradient: 'from-accent-light to-secondary-light', iconColor: 'text-secondary' },
  trang_phuc: { icon: Shirt, gradient: 'from-primary-light to-cream-muted', iconColor: 'text-primary' },
  phong_tuc: { icon: Users, gradient: 'from-secondary-light to-culture-light/40', iconColor: 'text-culture' },
  le_hoi: { icon: Moon, gradient: 'from-accent-light to-primary-light', iconColor: 'text-secondary' },
  vat_dung: { icon: Drum, gradient: 'from-cream-muted to-secondary-light', iconColor: 'text-secondary' },
  thien_nhien: { icon: Trees, gradient: 'from-culture-light/50 to-cream-muted', iconColor: 'text-culture' },
  tro_choi_dan_gian: { icon: Puzzle, gradient: 'from-culture-light/40 to-accent-light', iconColor: 'text-culture' },
};

const fallback: Record<'story' | 'culture', Variant> = {
  story: { icon: BookOpen, gradient: 'from-primary-light to-cream-muted', iconColor: 'text-primary' },
  culture: { icon: Compass, gradient: 'from-culture-light/40 to-cream-muted', iconColor: 'text-culture' },
};

/** Ảnh bìa thay thế khi story/culture chưa có coverImage: gradient + icon theo type/category. */
export const CoverPlaceholder: React.FC<{ kind: 'story' | 'culture'; variant?: string; className?: string }> = ({
  kind,
  variant,
  className = '',
}) => {
  const { icon: Icon, gradient, iconColor } =
    (variant && (kind === 'story' ? storyVariants : cultureVariants)[variant]) || fallback[kind];
  return (
    <div
      aria-hidden="true"
      className={`flex items-center justify-center bg-gradient-to-br ${gradient} ${className}`}
    >
      <Icon className={`w-16 h-16 opacity-70 ${iconColor}`} strokeWidth={1.5} />
    </div>
  );
};
