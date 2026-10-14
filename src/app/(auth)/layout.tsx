import type { ReactNode } from 'react';
import { UserRoleProvider } from '@/context/UserRoleContext';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <UserRoleProvider>
      <div className="relative flex min-h-screen w-full items-center justify-center p-4 overflow-hidden bg-slate-950">
        {/* Intro Video Background with Edge-Resilient Configuration */}
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80"
          className="absolute inset-0 h-full w-full object-cover opacity-25 filter brightness-75 blur-[1px] pointer-events-none"
        >
          <source src="/introvideo.mp4" type="video/mp4" />
        </video>

        {/* Ambient Dark Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-950/70 to-slate-950/90 pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-lime-500/10 blur-[130px] pointer-events-none" />

        {/* Content Container */}
        <div className="relative z-10 w-full flex items-center justify-center">
          {children}
        </div>
      </div>
    </UserRoleProvider>
  );
}
