import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { authService } from '@/server/services/auth-service';
import { staffAuthorizationService } from '@/server/services/staff-authorization-service';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await authService.getCurrentUser();
  if (!user) redirect('/login');
  if (!await staffAuthorizationService.hasPermission(user, 'admin.dashboard.view')) redirect('/dashboard');
  return children;
}
