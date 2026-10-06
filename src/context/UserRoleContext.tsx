
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { UserRole } from '@/app/(app)/layout';

const ROLE_STORAGE_KEY = 'resa_user_role';

interface UserRoleContextType {
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export function UserRoleProvider({ children }: { children: ReactNode }) {
  const [userRole, setUserRoleState] = useState<UserRole>('tenant');

  useEffect(() => {
    try {
      const storedRole = localStorage.getItem(ROLE_STORAGE_KEY) as UserRole | null;
      if (storedRole === 'tenant' || storedRole === 'landlord') {
        setUserRoleState(storedRole);
      }
    } catch {
      // Ignore storage access errors
    }
  }, []);

  const setUserRole = (role: UserRole) => {
    setUserRoleState(role);
    try {
      localStorage.setItem(ROLE_STORAGE_KEY, role);
      document.cookie = `${ROLE_STORAGE_KEY}=${role}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // Ignore storage access errors
    }
  };

  return (
    <UserRoleContext.Provider value={{ userRole, setUserRole }}>
      {children}
    </UserRoleContext.Provider>
  );
}

export function useUserRole() {
  const context = useContext(UserRoleContext);
  if (context === undefined) {
    throw new Error('useUserRole must be used within a UserRoleProvider');
  }
  return context;
}
