import {
  Search,
  FileCheck2,
  Video,
  FileSignature,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const STEPS = [
  {
    step: '01',
    title: 'Search with Real Filters',
    description:
      'Filter real, verified listings across Lagos, Abuja, and Nigerian urban centers by location, price, and property type without inflated roadside quotes.',
    icon: Search,
  },
  {
    step: '02',
    title: 'Review Verification Status',
    description:
      'Examine the explicit verification record: government identity clearance, cadastral location consistency, and documented landlord or agent authority.',
    icon: FileCheck2,
  },
  {
    step: '03',
    title: 'Book Verified Walkthroughs',
    description:
      'Schedule on-site physical visits or view recorded high-definition video inspections audited by designated platform coordinators.',
    icon: Video,
  },
  {
    step: '04',
    title: 'Transact with Clear Terms',
    description:
      'Submit direct tenancy or purchase enquiries with itemized pricing, transparent legal fees, caution deposits, and no surprise middleman markups.',
    icon: FileSignature,
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime-100 text-lime-800 text-xs font-extrabold mb-3">
            <ShieldCheck className="h-4 w-4 text-lime-700" />
            Clear, Auditable Process
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-headline tracking-tight text-slate-900">
            How PropHunta AI Works
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Eliminating the ambiguity, fraudulent impersonations, and multiple middleman fees common in Nigerian property transactions.
          </p>
        </div>

        {/* 4 Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {STEPS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="relative flex flex-col p-6 rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-lime-500/40 hover:shadow-xl transition-all duration-300 group"
              >
                {/* Step Pill */}
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs font-black tracking-widest text-lime-700 bg-lime-100 px-2.5 py-1 rounded-lg">
                    STEP {item.step}
                  </span>
                  <div className="h-10 w-10 rounded-xl bg-slate-900 text-lime-400 flex items-center justify-center transition-transform group-hover:scale-110 shadow-xs">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2 font-headline group-hover:text-lime-700 transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed flex-1">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA bar */}
        <div className="mt-14 p-6 sm:p-8 rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div>
            <h4 className="text-xl font-bold font-headline">Ready to experience verified real estate?</h4>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Browse available homes or get started with authorized property listings today.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button
              asChild
              className="bg-lime-600 hover:bg-lime-500 text-white font-extrabold text-xs sm:text-sm rounded-xl h-11 px-5 shadow-lg shadow-lime-950/20"
            >
              <Link href="/homes">Explore Verified Homes</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
