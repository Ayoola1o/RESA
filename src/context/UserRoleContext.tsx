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
  const [userRole, setUserRoleState] = useState<UserRole>('SEEKER');
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const user = await getCurrentUserAction();
      if (user) {
        setCurrentUser(user);
        setUserRoleState(user.role);
      }
    } catch (err) {
      console.warn('Could not fetch active user session:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const setUserRole = async (role: UserRole) => {
    setUserRoleState(role);
    try {
      const res = await switchDemoRoleAction(role);
      if (res.success && res.user) {
        setCurrentUser(res.user);
      }
    } catch (err) {
      console.warn('Could not switch server role:', err);
    }
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
    throw new Error('useUserRole must be used within a UserRoleProvider');
  }
  return context;
}
