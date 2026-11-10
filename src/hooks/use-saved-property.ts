'use client';

import { useEffect, useState } from 'react';
import { useUserRole } from '@/context/UserRoleContext';
import { useToast } from '@/hooks/use-toast';
import { getSavedPropertyIdsAction, toggleSavedPropertyAction } from '@/server/actions/prophunta-actions';

export function useSavedProperty(propertyId: string) {
  const { currentUser } = useUserRole();
  const { toast } = useToast();
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);
  const [ready, setReady] = useState(false);
  const userId = currentUser?.id;

  useEffect(() => {
    let active = true;
    setSaved(false);
    setReady(false);
    if (userId) {
      getSavedPropertyIdsAction().then((result) => {
        if (!active || !result.success) return;
        setSaved(result.propertyIds.includes(propertyId));
        setReady(true);
      }).catch(() => {});
    }
    return () => { active = false; };
  }, [propertyId, userId]);

  async function toggle() {
    if (!userId || pending || !ready) return;
    setPending(true);
    try {
      const result = await toggleSavedPropertyAction(propertyId, !saved);
      if (!result.success) throw new Error(result.error);
      setSaved(Boolean(result.isSaved));
    } catch {
      toast({ variant: 'destructive', title: 'Could not update saved properties' });
    } finally {
      setPending(false);
    }
  }

  return { saved, toggle, disabled: !ready || pending };
}
