
'use client';

import Link from "next/link"
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Home,
  MessageCircle,
  User,
  Settings,
  Heart,
  FileText,
  CreditCard,
  FileSignature,
  Briefcase,
  DollarSign,
} from "lucide-react"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import Logo from "./logo"
import type { UserRole } from "@/app/(app)/layout";

interface AppSidebarProps {
    userRole: UserRole;
    setUserRole: (role: UserRole) => void;
}

const tenantLinks = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/marketplace", icon: Home, label: "Marketplace" },
    { href: "/saved-properties", icon: Heart, label: "Saved Properties" },
    { href: "/applications", icon: FileText, label: "My Applications" },
    { href: "/lease", icon: FileSignature, label: "My Lease" },
    { href: "/payments", icon: CreditCard, label: "Payments" },
    { href: "/messages", icon: MessageCircle, label: "Messages" },
    { href: "/profile", icon: User, label: "Profile" },
]

const landlordLinks = [
    { href: "/landlord/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/landlord/financials", icon: DollarSign, label: "Financials" },
    { href: "/messages", icon: MessageCircle, label: "Messages" },
    { href: "/profile", icon: User, label: "Profile" },
]

export default function AppSidebar({ userRole, setUserRole }: AppSidebarProps) {
    const router = useRouter();

    const handleRoleChange = () => {
        const newRole = userRole === 'tenant' ? 'landlord' : 'tenant';
        setUserRole(newRole);
        if (newRole === 'landlord') {
            router.push('/landlord/dashboard');
        } else {
            router.push('/dashboard');
        }
    };

    const links = userRole === 'tenant' ? tenantLinks : landlordLinks;
    const isLandlordView = userRole === 'landlord';

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <TooltipProvider>
        <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
          <Link
            href="#"
            className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
          >
            <Logo className="h-4 w-4 transition-all group-hover:scale-110" fill="white" />
            <span className="sr-only">RESA</span>
          </Link>
          {links.map(link => (
            <Tooltip key={link.href}>
                <TooltipTrigger asChild>
                <Link
                    href={link.href}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
                >
                    <link.icon className="h-5 w-5" />
                    <span className="sr-only">{link.label}</span>
                </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{link.label}</TooltipContent>
            </Tooltip>
          ))}
        </nav>
        <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
           <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleRoleChange}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
              >
                {isLandlordView ? <Home className="h-5 w-5" /> : <Briefcase className="h-5 w-5" />}
                <span className="sr-only">{isLandlordView ? 'Tenant View' : 'Landlord View'}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{isLandlordView ? 'Tenant View' : 'Landlord View'}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/settings"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
              >
                <Settings className="h-5 w-5" />
                <span className="sr-only">Settings</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">Settings</TooltipContent>
          </Tooltip>
        </nav>
      </TooltipProvider>
    </aside>
  )
}
