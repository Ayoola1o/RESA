import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  UserCheck,
  Building,
  Briefcase,
  Check,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export default function RoleValueProps() {
  return (
    <section className="py-20 sm:py-28 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime-100 text-lime-800 text-xs font-extrabold mb-3">
            <UserCheck className="h-3.5 w-3.5 text-lime-700" />
            Designed for Every Participant
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-headline tracking-tight text-slate-900">
            Tailored for Seekers, Owners, & Agents
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Whether looking for your next family residence, managing assets, or brokering verified commercial spaces.
          </p>
        </div>

        {/* 3 Pillars Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Card 1: Seekers */}
          <div
            id="for-seekers"
            className="flex flex-col p-8 rounded-3xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-lime-500/40 hover:shadow-xl transition-all duration-300 relative group"
          >
            <div className="h-14 w-14 rounded-2xl bg-lime-100 text-lime-800 flex items-center justify-center mb-6">
              <UserCheck className="h-7 w-7 text-lime-700" />
            </div>

            <span className="text-xs font-extrabold uppercase tracking-wider text-lime-700 mb-1">
              For Tenants & Buyers
            </span>
            <h3 className="text-2xl font-black font-headline text-slate-900 mb-3">
              Home Seekers
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Discover authentic residential listings without ghost properties, predatory inspection fees, or fake agent impersonators.
            </p>

            <ul className="space-y-3 mb-8 flex-1 text-sm text-slate-700">
              <li className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-lime-600 shrink-0 mt-0.5" />
                <span>Verified pricing in Nigerian Naira with full fee transparency</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-lime-600 shrink-0 mt-0.5" />
                <span>Book scheduled physical or video walkthroughs directly</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-lime-600 shrink-0 mt-0.5" />
                <span>Save shortlists and submit formal tenancy applications online</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-lime-600 shrink-0 mt-0.5" />
                <span>Direct, auditable communications with titleholders and verified agents</span>
              </li>
            </ul>

            <Button
              asChild
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl h-11 text-xs"
            >
              <Link href="/homes">Explore Available Homes</Link>
            </Button>
          </div>

          {/* Card 2: Property Owners */}
          <div
            id="for-owners"
            className="flex flex-col p-8 rounded-3xl border-2 border-lime-600/60 bg-white shadow-xl relative group"
          >
            <div className="absolute -top-3.5 left-8 bg-lime-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
              Direct Landlords & Investors
            </div>

            <div className="h-14 w-14 rounded-2xl bg-slate-900 text-lime-400 flex items-center justify-center mb-6">
              <Building className="h-7 w-7" />
            </div>

            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
              For Asset Titleholders
            </span>
            <h3 className="text-2xl font-black font-headline text-slate-900 mb-3">
              Property Owners
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Retain sovereign control over your real-estate assets, authorize accredited agents, and review vetted prospective tenants.
            </p>

            <ul className="space-y-3 mb-8 flex-1 text-sm text-slate-700">
              <li className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-lime-600 shrink-0 mt-0.5" />
                <span>List properties directly or delegate to verified agents via authorized mandates</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-lime-600 shrink-0 mt-0.5" />
                <span>Review KYC-verified tenant application files and occupation records</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-lime-600 shrink-0 mt-0.5" />
                <span>Manage lease agreements, caution fee terms, and inspection requests</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-lime-600 shrink-0 mt-0.5" />
                <span>Protect property integrity against unauthorized third-party duplicate postings</span>
              </li>
            </ul>

            <Button
              asChild
              className="w-full bg-lime-600 hover:bg-lime-500 text-white font-bold rounded-xl h-11 text-xs shadow-md shadow-lime-900/15"
            >
              <Link href="/signup?role=OWNER">List Your Property</Link>
            </Button>
          </div>

          {/* Card 3: Real Estate Agents */}
          <div
            id="for-agents"
            className="flex flex-col p-8 rounded-3xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-lime-500/40 hover:shadow-xl transition-all duration-300 relative group"
          >
            <div className="h-14 w-14 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center mb-6">
              <Briefcase className="h-7 w-7 text-slate-700" />
            </div>

            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1">
              For Licensed Practitioners
            </span>
            <h3 className="text-2xl font-black font-headline text-slate-900 mb-3">
              Accredited Agents
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Elevate your business standing with verifiable regulatory accreditation (CAC, LASRERA, NIESV, ERCAAN) and qualified leads.
            </p>

            <ul className="space-y-3 mb-8 flex-1 text-sm text-slate-700">
              <li className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-lime-600 shrink-0 mt-0.5" />
                <span>Obtain certified Agent Verification Badges (Level 1 to Level 3)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-lime-600 shrink-0 mt-0.5" />
                <span>Formalize exclusive and joint representation agreements with property owners</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-lime-600 shrink-0 mt-0.5" />
                <span>Access serious, pre-screened home seekers ready for prompt lease and sale execution</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-lime-600 shrink-0 mt-0.5" />
                <span>Build an unforgeable reputation based on verified inspections and fulfilled mandates</span>
              </li>
            </ul>

            <Button
              asChild
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl h-11 text-xs"
            >
              <Link href="/signup?role=AGENT">Register as an Agent</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
