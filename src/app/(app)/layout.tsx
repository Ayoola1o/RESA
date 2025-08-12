
'use client';

import type { ReactNode } from "react"
import { UserRoleProvider } from "@/context/UserRoleContext";
import AppSidebar from "@/components/app-sidebar"
import Header from "@/components/header"

export type UserRole = 'tenant' | 'landlord';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <UserRoleProvider>
      <div className="flex min-h-screen w-full flex-col bg-muted/20">
        <div className="flex flex-col sm:gap-4 sm:pl-14">
          <AppSidebar />
          <div className="flex flex-1 flex-col sm:gap-4">
            <Header />
            <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
              {children}
            </main>
          </div>
        </div>
      </div>
    </UserRoleProvider>
  )
}
