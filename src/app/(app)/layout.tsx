
'use client';

import type { ReactNode } from "react"
import { useState } from "react";
import AppSidebar from "@/components/app-sidebar"
import Header from "@/components/header"

export type UserRole = 'tenant' | 'landlord';

export default function AppLayout({ children }: { children: ReactNode }) {
  const [userRole, setUserRole] = useState<UserRole>('tenant');

  return (
    <div className="flex h-screen w-full bg-muted/20">
      <AppSidebar userRole={userRole} setUserRole={setUserRole} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header userRole={userRole} setUserRole={setUserRole} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
