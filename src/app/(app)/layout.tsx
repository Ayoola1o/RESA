'use client';

import type { ReactNode } from "react";
import { UserRoleProvider } from "@/context/UserRoleContext";
import AppSidebar from "@/components/app-sidebar";
import Header from "@/components/header";

import type { UserRole } from "@/types/prophunta";
export type { UserRole };

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <UserRoleProvider>
      <div className="flex min-h-screen w-full bg-[#f8fafc] text-slate-900">
        <AppSidebar />
        <div className="flex flex-1 flex-col lg:pl-64 min-w-0 transition-all">
          <Header />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </UserRoleProvider>
  );
}
