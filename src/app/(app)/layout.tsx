'use client';

import { Suspense, type ReactNode } from "react";
import { UserRoleProvider } from "@/context/UserRoleContext";
import AppSidebar from "@/components/app-sidebar";
import Header from "@/components/header";
import MobileBottomNav from "@/components/MobileBottomNav";

import type { UserRole } from "@/types/prophunta";
export type { UserRole };

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <UserRoleProvider>
      <div className="flex min-h-screen w-full bg-[#f8fafc] text-slate-900 overflow-x-hidden">
        <Suspense fallback={<aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-[#0c140d] lg:flex" />}>
          <AppSidebar />
        </Suspense>
        <div className="flex flex-1 flex-col lg:pl-64 min-w-0 transition-all">
          <Header />
          <main className="flex-1 px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-[1600px] w-full mx-auto pb-24 lg:pb-8">
            {children}
          </main>
          <Suspense fallback={null}>
            <MobileBottomNav />
          </Suspense>
        </div>
      </div>
    </UserRoleProvider>
  );
}
