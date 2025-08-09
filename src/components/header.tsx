
'use client';

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Search,
  MessageCircle,
  User,
  LayoutDashboard,
  Menu,
  Settings,
  Heart,
  FileText,
  CreditCard,
  FileSignature,
  Briefcase,
} from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import AiRecommendations from "./ai-recommendations"
import Logo from "./logo";
import type { UserRole } from "@/app/(app)/layout";

interface HeaderProps {
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
    { href: "/messages", icon: MessageCircle, label: "Messages" },
    { href: "/profile", icon: User, label: "Profile" },
]

export default function Header({ userRole, setUserRole }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const showSearch = pathname === '/dashboard' || pathname === '/marketplace';

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
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 sm:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col">
          <nav className="grid gap-2 text-lg font-medium">
            <Link
              href="#"
              className="flex items-center gap-2 text-lg font-semibold font-headline text-primary"
            >
              <Logo className="h-6 w-6" />
              <span>RESA</span>
            </Link>
            {links.map(link => (
                 <Link
                    key={link.href}
                    href={link.href}
                    className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                >
                    <link.icon className="h-5 w-5" />
                    {link.label}
                </Link>
            ))}
            <button
              onClick={handleRoleChange}
              className="mx-[-0.65rem] flex items-center gap-4 rounded-xl bg-muted px-3 py-2 text-foreground hover:text-foreground"
            >
              {isLandlordView ? <Home className="h-5 w-5" /> : <Briefcase className="h-5 w-5" />}
              {isLandlordView ? 'Tenant View' : 'Landlord View'}
            </button>
             <Link
              href="/settings"
              className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
            >
              <Settings className="h-5 w-5" />
              Settings
            </Link>
          </nav>
        </SheetContent>
      </Sheet>

      <div className="w-full flex-1">
        {showSearch && userRole === 'tenant' && (
          <form>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search properties..."
                className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3"
              />
            </div>
          </form>
        )}
      </div>
      {showSearch && userRole === 'tenant' && <AiRecommendations />}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full">
            <Image
              src="https://placehold.co/36x36"
              width={36}
              height={36}
              alt="Avatar"
              className="rounded-full"
              data-ai-hint="person portrait"
            />
            <span className="sr-only">Toggle user menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
           <DropdownMenuItem asChild><Link href="/profile">Profile</Link></DropdownMenuItem>
          <DropdownMenuItem asChild><Link href="/settings">Settings</Link></DropdownMenuItem>
          <DropdownMenuItem>Support</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
