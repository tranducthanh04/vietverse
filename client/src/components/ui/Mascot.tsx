import React from 'react';
import { cn } from '../../lib/utils.js';

export interface MascotProps {
  mood?: 'happy' | 'cheering' | 'talking' | 'listening' | 'thinking';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Mascot: React.FC<MascotProps> = ({
  mood = 'happy',
  size = 'md',
  className,
}) => {
  const sizeMap = {
    sm: 'w-14 h-14',
    md: 'w-24 h-24',
    lg: 'w-36 h-36',
    xl: 'w-48 h-48',
  };

  return (
    <div
      className={cn(
        'relative inline-block select-none',
        sizeMap[size],
        mood === 'cheering' && 'animate-bounce',
        mood === 'talking' && 'animate-wiggle',
        mood === 'happy' && 'animate-bounce-subtle',
        className
      )}
    >
      <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-md">
        {/* Five-pointed chubby cheerful Star Body */}
        <defs>
          <linearGradient id="starGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
          <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Star Path */}
        <path
          d="M 60,8 C 62,8 67,28 75,34 C 83,40 106,38 107,43 C 108,48 93,64 94,74 C 95,84 104,103 100,107 C 96,111 76,99 66,101 C 56,103 40,115 34,111 C 28,107 33,88 30,80 C 27,72 10,60 12,54 C 14,48 35,46 42,40 C 49,34 58,8 60,8 Z"
          fill="url(#starGrad)"
          stroke="#E04836"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* Small Traditional Band / Scarf (Khăn rằn / Mấn nhỏ xinh xắn) */}
        <path
          d="M 46,24 Q 60,18 74,24"
          stroke="#E04836"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Cheeks - Rosy Pink */}
        <circle cx="42" cy="62" r="5" fill="#FDA4AF" opacity="0.8" />
        <circle cx="78" cy="62" r="5" fill="#FDA4AF" opacity="0.8" />

        {/* Eyes based on mood */}
        {mood === 'cheering' || mood === 'happy' ? (
          <>
            {/* Happy Curved Eyes ^ ^ */}
            <path
              d="M 44,53 Q 50,45 56,53"
              stroke="#451A03"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 64,53 Q 70,45 76,53"
              stroke="#451A03"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
          </>
        ) : mood === 'thinking' ? (
          <>
            <circle cx="50" cy="50" r="4" fill="#451A03" />
            <circle cx="70" cy="48" r="4" fill="#451A03" />
            <path d="M 66,42 Q 72,40 76,43" stroke="#451A03" strokeWidth="2.5" fill="none" />
          </>
        ) : (
          <>
            {/* Big Shiny Eyes */}
            <circle cx="50" cy="52" r="5" fill="#451A03" />
            <circle cx="52" cy="50" r="1.8" fill="#FFFFFF" />
            <circle cx="70" cy="52" r="5" fill="#451A03" />
            <circle cx="72" cy="50" r="1.8" fill="#FFFFFF" />
          </>
        )}

        {/* Mouth */}
        {mood === 'talking' || mood === 'cheering' ? (
          <path
            d="M 52,65 Q 60,78 68,65 Z"
            fill="#E04836"
            stroke="#451A03"
            strokeWidth="2"
          />
        ) : (
          <path
            d="M 53,64 Q 60,71 67,64"
            stroke="#451A03"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        )}
      </svg>
    </div>
  );
};
