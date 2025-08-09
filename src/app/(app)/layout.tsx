
'use client';

import type { ReactNode } from "react"
import { useState } from "react";
import AppSidebar from "@/components/app-sidebar"
import Header from "@/components/header"

export type UserRole = 'tenant' | 'landlord';

export default function AppLayout({ children }: { children: ReactNode }) {
  const [userRole, setUserRole] = useState<UserRole>('tenant');

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar userRole={userRole} setUserRole={setUserRole} />
      <div className="flex flex-1 flex-col">
        <Header userRole={userRole} setUserRole={setUserRole} />
        <main className="flex flex-1 flex-col bg-muted/20 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
