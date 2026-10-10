import type { ReactNode } from 'react';
import { UserRoleProvider } from '@/context/UserRoleContext';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <UserRoleProvider>
      <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
        {children}
      </div>
    </UserRoleProvider>
  );
}
