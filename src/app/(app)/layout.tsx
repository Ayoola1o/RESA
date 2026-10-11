'use client';

import { Suspense, type ReactNode } from "react";
import { UserRoleProvider } from "@/context/UserRoleContext";
import { SidebarProvider, useAppSidebar } from "@/context/SidebarContext";
import AppSidebar from "@/components/app-sidebar";
import Header from "@/components/header";
import MobileBottomNav from "@/components/MobileBottomNav";
import { cn } from "@/lib/utils";

import type { UserRole } from "@/types/prophunta";
export type { UserRole };

function AppLayoutShell({ children }: { children: ReactNode }) {
  const { isDesktopOpen } = useAppSidebar();

  return (
    <div className="flex min-h-screen w-full bg-[#f8fafc] text-slate-900 overflow-x-hidden">
      <Suspense fallback={<aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-[#0c140d] lg:flex" />}>
        <AppSidebar />
      </Suspense>
      <div
        className={cn(
          "flex flex-1 flex-col min-w-0 transition-all duration-300 ease-in-out",
          isDesktopOpen ? "lg:pl-64" : "lg:pl-0"
        )}
      >
        <Header />
        <main className="flex-1 px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-[1600px] w-full mx-auto pb-24 lg:pb-8">
          {children}
        </main>
        <Suspense fallback={null}>
          <MobileBottomNav />
        </Suspense>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <UserRoleProvider>
      <SidebarProvider>
        <AppLayoutShell>{children}</AppLayoutShell>
      </SidebarProvider>
    </UserRoleProvider>
  );
}
