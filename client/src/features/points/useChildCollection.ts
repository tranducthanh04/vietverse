import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api.js';
import { useChildStore, type ChildProfile } from '../../store/childStore.js';
import type { ShopItemView } from './pointLabels.js';

export type EquipSlot = 'avatar' | 'profile_decoration';

export interface ChildCollection {
  ownedItems: ShopItemView[];
  equippedAvatarItemId: string | null;
  profileDecorationId: string | null;
}

export const childCollectionKey = (childId: string | undefined) => ['childCollection', childId] as const;

export function useChildCollection(childId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: childCollectionKey(childId),
    queryFn: async (): Promise<ChildCollection> => {
      const res = await api.get(`/points/children/${childId}/collection`);
      return res.data.data;
    },
    enabled: Boolean(childId) && enabled,
    staleTime: 60_000,
  });
}

/** Mirrors the server's equipped slots into the child store so the header updates at once. */
function applyEquipped(childId: string, collection: ChildCollection) {
  useChildStore.setState((state) => {
    const update = (profile: ChildProfile): ChildProfile =>
      profile._id === childId
        ? {
            ...profile,
            equippedAvatarItemId: collection.equippedAvatarItemId,
            profileDecorationId: collection.profileDecorationId,
          }
        : profile;
    return {
      activeChild: state.activeChild ? update(state.activeChild) : state.activeChild,
      children: state.children.map(update),
    };
  });
}

export function useEquipItem(childId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { slot: EquipSlot; itemId: string | null }): Promise<ChildCollection> => {
      if (!childId) throw new Error('Chưa chọn hồ sơ bé');
      const res = await api.patch(`/points/children/${childId}/equip`, payload);
      return res.data.data;
    },
    onSuccess: (collection) => {
      if (!childId) return;
      queryClient.setQueryData(childCollectionKey(childId), collection);
      applyEquipped(childId, collection);
    },
  });
}
