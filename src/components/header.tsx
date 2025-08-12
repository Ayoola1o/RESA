
'use client';

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Home,
  Search,
  MessageCircle,
  User,
  LayoutDashboard,
  Menu,
  Settings,
  Briefcase,
  DollarSign,
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
    { href: "/messages", icon: MessageCircle, label: "Messages" },
    { href: "/profile", icon: User, label: "Profile" },
]

const landlordLinks = [
    { href: "/landlord/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/landlord/financials", icon: DollarSign, label: "Financials" },
    { href: "/messages", icon: MessageCircle, label: "Messages" },
    { href: "/profile", icon: User, label: "Profile" },
]

export default function Header({ userRole, setUserRole }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
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

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/marketplace?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/marketplace');
    }
  };

  const links = userRole === 'tenant' ? tenantLinks : landlordLinks;
  const isLandlordView = userRole === 'landlord';

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          <nav className="grid gap-6 text-lg font-medium">
             <Link
              href="#"
              className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
            >
              <Logo className="h-5 w-5 transition-all group-hover:scale-110" fill="white" />
              <span className="sr-only">RESA</span>
            </Link>
            {links.map(link => (
                 <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                    <link.icon className="h-5 w-5" />
                    {link.label}
                </Link>
            ))}
            <button
              onClick={handleRoleChange}
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              {isLandlordView ? <Home className="h-5 w-5" /> : <Briefcase className="h-5 w-5" />}
              {isLandlordView ? 'Tenant View' : 'Landlord View'}
            </button>
             <Link
              href="/settings"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <Settings className="h-5 w-5" />
              Settings
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
      
      <div className="relative ml-auto flex-1 md:grow-0">
          {showSearch && userRole === 'tenant' && (
            <form onSubmit={handleSearchSubmit}>
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                type="search"
                placeholder="Search..."
                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                />
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
