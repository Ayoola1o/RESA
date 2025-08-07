import Link from "next/link"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Building, Search, UserCheck, Star, BadgeCheck, FileText } from "lucide-react"

const quickLinks = [
    {
        title: "Homes for Sale",
        href: "/marketplace?type=sale",
        icon: Building,
    },
    {
        title: "Apartments for Rent",
        href: "/marketplace?type=rent",
        icon: Building,
    },
    {
        title: "Commercial Spaces",
        href: "#",
        icon: Building,
    },
];

const howItWorksSeekers = [
    {
        icon: Search,
        title: "Find a Property",
        description: "Search through thousands of listings with our advanced filters to find your perfect home."
    },
     {
        icon: BadgeCheck,
        title: "Tour & Verify",
        description: "Schedule virtual or in-person tours and check for our 'Verified' badge for peace of mind."
    },
     {
        icon: FileText,
        title: "Apply or Offer",
        description: "Easily apply for rentals or make offers on homes for sale directly through our secure platform."
    }
]

const howItWorksOwners = [
    {
        icon: FileText,
        title: "List Your Property",
        description: "Create a detailed listing with photos, videos, and all the necessary information in minutes."
    },
     {
        icon: UserCheck,
        title: "Find Tenants/Buyers",
        description: "Our platform connects you with a vast audience of potential tenants and buyers."
    },
     {
        icon: BadgeCheck,
        title: "Manage Seamlessly",
        description: "Use our tools to manage applications, leases, and communication all in one place."
    }
]

const testimonials = [
    {
        quote: "RESA made finding our dream home so easy! The AI recommendations were spot on.",
        author: "The Johnson Family",
        avatar: "https://placehold.co/100x100",
        aiHint: "family smiling",
    },
    {
        quote: "As a landlord, this platform has been a game-changer for managing my properties and tenants.",
        author: "Sarah L., Property Manager",
        avatar: "https://placehold.co/100x100",
        aiHint: "woman portrait",
    },
     {
        quote: "The virtual tour feature saved me so much time. I could shortlist properties without leaving my couch!",
        author: "David K., Renter",
        avatar: "https://placehold.co/100x100",
        aiHint: "man smiling",
    },
]

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-8">
        {/* Welcome Header & CTA */}
        <section className="p-8 rounded-lg bg-card text-card-foreground shadow-md border flex flex-col items-center text-center">
            <h1 className="text-4xl font-bold font-headline">Welcome to RESA</h1>
            <p className="mt-2 text-lg text-muted-foreground">Your all-in-one solution for real estate needs.</p>
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg">
                    <Link href="/marketplace">Find Your Home</Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                    <Link href="#">List Your Property</Link>
                </Button>
            </div>
        </section>

        {/* Quick Links */}
        <section>
             <h2 className="text-2xl font-bold font-headline text-center mb-6">Get Started Quickly</h2>
            <div className="grid gap-6 md:grid-cols-3">
                {quickLinks.map(link => (
                    <Card key={link.title} className="text-center hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                            <link.icon className="h-12 w-12 mx-auto mb-4 text-primary" />
                            <h3 className="text-xl font-semibold font-headline">{link.title}</h3>
                            <Button variant="link" asChild className="mt-2">
                                <Link href={link.href}>Explore Now</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </section>

        {/* How It Works */}
        <section>
            <h2 className="text-2xl font-bold font-headline text-center mb-8">How It Works</h2>
            <div className="grid md:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-xl font-semibold font-headline mb-4 text-center">For Property Seekers</h3>
                    <div className="space-y-6">
                       {howItWorksSeekers.map(step => (
                            <div key={step.title} className="flex items-start gap-4">
                                <div className="flex-shrink-0 bg-primary/10 text-primary p-3 rounded-full">
                                    <step.icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="font-semibold">{step.title}</h4>
                                    <p className="text-muted-foreground text-sm">{step.description}</p>
                                </div>
                            </div>
                       ))}
                    </div>
                </div>
                 <div>
                    <h3 className="text-xl font-semibold font-headline mb-4 text-center">For Property Owners</h3>
                     <div className="space-y-6">
                       {howItWorksOwners.map(step => (
                            <div key={step.title} className="flex items-start gap-4">
                               <div className="flex-shrink-0 bg-primary/10 text-primary p-3 rounded-full">
                                    <step.icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="font-semibold">{step.title}</h4>
                                    <p className="text-muted-foreground text-sm">{step.description}</p>
                                </div>
                            </div>
                       ))}
                    </div>
                </div>
            </div>
        </section>

        {/* Testimonials */}
        <section className="py-8">
            <h2 className="text-2xl font-bold font-headline text-center mb-8">What Our Users Say</h2>
            <div className="grid gap-8 md:grid-cols-3">
                {testimonials.map(item => (
                    <Card key={item.author}>
                        <CardContent className="p-6 text-center">
                            <p className="text-muted-foreground italic mb-4">"{item.quote}"</p>
                            <div className="flex items-center justify-center gap-3">
                                <Image src={item.avatar} alt={item.author} width={40} height={40} className="rounded-full" data-ai-hint={item.aiHint} />
                                <div>
                                    <p className="font-semibold">{item.author}</p>
                                    <div className="flex justify-center text-yellow-500">
                                        {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </section>
    </div>
  )
}
