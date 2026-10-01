import React from 'react';
import { cn } from '../../lib/utils.js';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'flat' | 'elevated' | 'kid';
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'default',
  ...props
}) => {
  const variants = {
    default: 'bg-white border-2 border-cream-border rounded-kid shadow-sm',
    flat: 'bg-cream-muted rounded-kid border border-cream-border',
    elevated: 'bg-white rounded-kid-lg shadow-kid-card border border-cream-border/60',
    kid: 'bg-white rounded-kid-lg shadow-kid border-2 border-cream-border hover:-translate-y-1 transition-transform',
  };

  return (
    <div className={cn('p-6', variants[variant], className)} {...props}>
      {children}
    </div>
  );
};
