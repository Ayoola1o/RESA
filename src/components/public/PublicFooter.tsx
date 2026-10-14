import Link from 'next/link';
import Logo from '@/components/logo';
import { ShieldCheck, MapPin, Phone, Mail } from 'lucide-react';

export default function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#080d09] text-slate-400 border-t border-white/10 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-lime-600 to-lime-800 text-white shadow-md shadow-lime-900/20">
                <Logo className="h-7 w-7" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-white font-headline">
                  PropHunta
                </span>
                <span className="rounded-md bg-lime-600 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                  AI
                </span>
              </div>
            </Link>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed">
              Building the verified trust infrastructure for Nigerian real estate. Discover authentic properties, connect with accredited practitioners, and eliminate transaction ambiguity.
            </p>
            <div className="flex items-center gap-2 text-xs text-lime-400 font-semibold pt-1">
              <ShieldCheck className="h-4 w-4" />
              <span>Verified Title & Physical Audit Systems</span>
            </div>
          </div>

          {/* Column 2: Explore */}
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider mb-4 font-headline">
              Explore Homes
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link href="/homes?listingType=RENT" className="hover:text-white transition-colors">
                  Homes for Rent
                </Link>
              </li>
              <li>
                <Link href="/homes?listingType=SALE" className="hover:text-white transition-colors">
                  Properties for Sale
                </Link>
              </li>
              <li>
                <Link href="/homes?propertyType=Apartment" className="hover:text-white transition-colors">
                  Apartments in Lagos
                </Link>
              </li>
              <li>
                <Link href="/homes?propertyType=House" className="hover:text-white transition-colors">
                  Detached Houses
                </Link>
              </li>
              <li>
                <Link href="/homes?propertyType=Commercial" className="hover:text-white transition-colors">
                  Commercial & Offices
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Platform Roles */}
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider mb-4 font-headline">
              Participants
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link href="/signup?role=SEEKER" className="hover:text-white transition-colors">
                  For Home Seekers
                </Link>
              </li>
              <li>
                <Link href="/signup?role=OWNER" className="hover:text-white transition-colors">
                  For Property Owners
                </Link>
              </li>
              <li>
                <Link href="/signup?role=AGENT" className="hover:text-white transition-colors">
                  For Licensed Agents
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Sign In to Workspace
                </Link>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                  How PropHunta Works
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Trust & Coverage */}
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider mb-4 font-headline">
              Coverage Hubs
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5 text-slate-300">
                <MapPin className="h-3.5 w-3.5 text-lime-500 shrink-0" />
                <span>Lekki, Ikoyi & Victoria Island</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-300">
                <MapPin className="h-3.5 w-3.5 text-lime-500 shrink-0" />
                <span>Ikeja GRA & Maryland</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-300">
                <MapPin className="h-3.5 w-3.5 text-lime-500 shrink-0" />
                <span>Maitama & Wuse 2, Abuja</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-300">
                <MapPin className="h-3.5 w-3.5 text-lime-500 shrink-0" />
                <span>Asokoro & Gwarinpa</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Disclaimer & Copyright */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {currentYear} PropHunta AI. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-6">
            <a href="#trust-safety" className="hover:text-slate-400 transition-colors">
              Trust & Verification Standards
            </a>
            <Link href="/login" className="hover:text-slate-400 transition-colors">
              Staff & Officer Login
            </Link>
            <span className="text-slate-600">Built for Nigeria</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
