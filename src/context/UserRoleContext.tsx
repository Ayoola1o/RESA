'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, UserRole } from '@/types/prophunta';
import { getCurrentUserAction, switchDemoRoleAction } from '@/server/actions/prophunta-actions';

interface UserRoleContextType {
  userRole: UserRole;
  role: UserRole;
  currentUser: User | null;
  setUserRole: (role: UserRole) => Promise<void>;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export function UserRoleProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRoleState] = useState<UserRole>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('prophunta_user_role') as UserRole | null;
        if (cached && ['ADMIN', 'OWNER', 'AGENT', 'SEEKER'].includes(cached)) {
          return cached;
        }
      } catch {
        // Ignore localStorage error
      }
    }
    return 'SEEKER';
  });
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = await getCurrentUserAction();
      if (user) {
        setCurrentUser(user);
        setUserRoleState(user.role);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('prophunta_user_role', user.role);
          } catch {}
        }
      } else {
        setCurrentUser(null);
        setUserRoleState('SEEKER');
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('prophunta_user_role');
          } catch {}
        }
      }
    } catch (err) {
      console.warn('Could not fetch active user session:', err);
      setCurrentUser(null);
      setUserRoleState('SEEKER');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const setUserRole = async (_role: UserRole) => {
    // Roles are determined strictly from the authenticated backend account session.
    // Client-side role spoofing is prevented.
    await refreshUser();
  };

  return (
    <UserRoleContext.Provider
      value={{
        userRole,
        role: userRole,
        currentUser,
        setUserRole,
        refreshUser,
        isLoading,
      }}
    >
      {children}
    </UserRoleContext.Provider>
  );
}

export function useUserRole() {
  const context = useContext(UserRoleContext);
  if (context === undefined) {
    return {
      userRole: 'SEEKER' as UserRole,
      role: 'SEEKER' as UserRole,
      currentUser: null,
      setUserRole: async () => {},
      refreshUser: async () => {},
      isLoading: false,
    };
  }
  return context;
}
