import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ShieldAlert,
  ShieldCheck,
  FileCheck,
  AlertTriangle,
  Scale,
  Users,
  CheckCircle,
} from 'lucide-react';

const VERIFICATION_PILLARS = [
  {
    title: 'Identity & Legal Entity Screening',
    description:
      'National Identification Number (NIN), Nigerian International Passport, and Corporate Affairs Commission (CAC) business verification for participating agents and property owners.',
  },
  {
    title: 'Authority & Title Cross-Referencing',
    description:
      'Verification of Deeds of Assignment, Certificates of Occupancy (C of O), Governor’s Consents, and registered letters of authority to confirm legal right of disposal.',
  },
  {
    title: 'Field & Video Inspection Verification',
    description:
      'Real walkthrough records audited by authorized inspection officers to verify physical existence, boundary coordinates, and structural condition.',
  },
  {
    title: 'Active Moderation & Scam Reporting',
    description:
      'Community reporting triggers instant property review queues and emergency listing suspension by PropHunta AI property moderators.',
  },
];

export default function TrustSafetySection() {
  return (
    <section id="trust-safety" className="py-20 sm:py-28 bg-[#0a110b] text-white relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 right-1/4 h-96 w-96 rounded-full bg-lime-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-10 h-72 w-72 rounded-full bg-emerald-600/10 blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime-950/80 border border-lime-500/40 text-lime-400 text-xs font-extrabold mb-3 shadow-inner">
            <ShieldCheck className="h-4 w-4 text-lime-400" />
            Verification Infrastructure
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-headline tracking-tight text-white">
            Trust & Safety Infrastructure
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
            Our multi-tiered verification pipeline addresses Nigeria’s real-estate trust deficit with concrete documentation checks and field audit workflows.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-16">
          {VERIFICATION_PILLARS.map((p, idx) => (
            <div
              key={p.title}
              className="p-7 rounded-2xl bg-white/5 border border-white/10 hover:border-lime-500/30 transition-all backdrop-blur-xs flex items-start gap-4"
            >
              <div className="h-10 w-10 rounded-xl bg-lime-600/20 border border-lime-500/30 text-lime-400 flex items-center justify-center shrink-0">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2 font-headline">
                  {p.title}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {p.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Legal Disclaimer Box */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-md max-w-4xl mx-auto flex flex-col sm:flex-row items-start gap-5">
          <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <Scale className="h-6 w-6" />
          </div>
          <div className="text-xs sm:text-sm text-slate-300 leading-relaxed space-y-2">
            <div className="font-bold text-white uppercase tracking-wider text-xs">
              Statutory Verification Disclaimer
            </div>
            <p>
              PropHunta AI provides an independent verification layer reviewing platform submissions, government identification, and physical inspection evidence.
            </p>
            <p className="text-slate-400">
              Platform verification does not substitute for independent statutory title searches at the relevant State Land Registry conducted by licensed legal practitioners. All parties are encouraged to execute formal contract reviews prior to final property purchase settlements.
            </p>
          </div>
        </div>

        {/* High-Impact Final Call to Action */}
        <div className="mt-16 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4">
            <Button
              asChild
              className="bg-lime-600 hover:bg-lime-500 text-white font-black text-sm px-8 h-12 rounded-xl shadow-xl shadow-lime-950/40"
            >
              <Link href="/homes">Start Searching Homes</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-white/20 bg-white/5 text-white hover:bg-white/10 font-bold text-sm px-6 h-12 rounded-xl"
            >
              <Link href="/signup">Create Free Account</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
