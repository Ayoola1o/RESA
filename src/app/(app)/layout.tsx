import type { ReactNode } from "react"
import AppSidebar from "@/components/app-sidebar"
import Header from "@/components/header"

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex flex-1 flex-col bg-muted/20 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
