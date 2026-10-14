import {
  ShieldCheck,
  Receipt,
  MapPin,
  Lock,
  Camera,
  History,
  FileCheck,
  CheckCircle,
} from 'lucide-react';

const BENEFITS = [
  {
    title: 'Itemized Fee Transparency',
    description:
      'Clear breakdown of rent, caution fee, legal agreement fee, and service charges. Eliminates surprise charges and unjustified agency percentage markups.',
    icon: Receipt,
  },
  {
    title: 'Multi-Layer Identity Verification',
    description:
      'Landlords, agents, and seekers undergo KYC identity validation (NIN, Passports, CAC certificates) before publishing or conducting transactions.',
    icon: ShieldCheck,
  },
  {
    title: 'Cadastral & Location Auditing',
    description:
      'Every listing is checked against verified geographical coordinates, area cadastre, and local environmental indicators such as historical flood risks.',
    icon: MapPin,
  },
  {
    title: 'Verified Video & Physical Audits',
    description:
      'Real walkthrough photos and video inspections captured by audited parties, eliminating bait-and-switch listings with recycled Google images.',
    icon: Camera,
  },
  {
    title: 'Mandate Authority Checks',
    description:
      'Distinguishes direct property owners from authorized managing agents, preventing illegal sublets and unaccredited roadside middlemen.',
    icon: FileCheck,
  },
  {
    title: 'Immutable Action & Audit Trail',
    description:
      'Application submissions, inspection requests, and listing status updates are recorded in an audit trail for full accountability.',
    icon: History,
  },
];

export default function PlatformBenefits() {
  return (
    <section className="py-20 sm:py-28 bg-[#f8fafc] border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-lime-400 text-xs font-extrabold mb-3">
            <Lock className="h-3.5 w-3.5" />
            Platform Integrity
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-headline tracking-tight text-slate-900">
            Built for Transparent Real Estate
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            PropHunta AI replaces hearsay with verified documentation, audited walkthroughs, and direct party accountability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {BENEFITS.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.title}
                className="p-7 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-lg hover:border-lime-500/30 transition-all duration-200"
              >
                <div className="h-12 w-12 rounded-xl bg-lime-50 border border-lime-200/60 text-lime-700 flex items-center justify-center mb-5">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 font-headline">
                  {b.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {b.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
