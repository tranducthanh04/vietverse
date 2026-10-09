import React from 'react';
import type { ChildProfile } from '../../store/childStore.js';
import { useChildCollection } from './useChildCollection.js';

const SIZE_CLASSES = {
  sm: { box: 'w-8 h-8 text-base', frame: 'w-4 h-4 -right-1 -bottom-1' },
  lg: { box: 'w-20 h-20 text-3xl', frame: 'w-9 h-9 -right-2 -bottom-2' },
} as const;

/**
 * Child avatar: the equipped shop avatar if any, otherwise the initial of the child's name.
 * An equipped profile decoration is drawn as a coloured frame plus its emblem in the corner.
 */
export const EquippedAvatar: React.FC<{ child: ChildProfile | null; size?: keyof typeof SIZE_CLASSES }> = ({
  child,
  size = 'sm',
}) => {
  const hasEquipped = Boolean(child?.equippedAvatarItemId || child?.profileDecorationId);
  const { data } = useChildCollection(child?._id, hasEquipped);
  const avatar = data?.ownedItems.find((item) => item._id === data.equippedAvatarItemId);
  const frame = data?.ownedItems.find((item) => item._id === data.profileDecorationId);
  const classes = SIZE_CLASSES[size];

  return (
    <div className="relative shrink-0" data-testid="equipped-avatar">
      <div
        className={`${classes.box} rounded-full flex items-center justify-center font-display font-black text-stone-900 shadow-sm overflow-hidden ${
          frame ? 'ring-2 ring-offset-1 ring-pink-400 bg-pink-50' : 'bg-accent'
        }`}
      >
        {avatar?.assetUrl ? (
          <img src={avatar.assetUrl} alt={`Avatar ${avatar.name}`} className="w-full h-full object-cover" />
        ) : (
          <span aria-hidden="true">{child?.name ? child.name.charAt(0) : 'B'}</span>
        )}
      </div>
      {frame?.assetUrl && (
        <img
          src={frame.assetUrl}
          alt={`Trang trí ${frame.name}`}
          className={`absolute ${classes.frame} rounded-full bg-white shadow`}
        />
      )}
    </div>
  );
};
