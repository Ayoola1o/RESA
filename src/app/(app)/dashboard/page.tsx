
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ArrowRight, Bell, FileText, Heart, Wrench, CreditCard } from "lucide-react"
import { properties } from "@/lib/mock-data"
import PropertyCard from "@/components/property-card"
import { Badge } from "@/components/ui/badge"

const quickAccessLinks = [
    {
        title: "Saved Properties",
        href: "#",
        icon: Heart,
        description: "View your favorite listings.",
    },
    {
        title: "My Applications",
        href: "#",
        icon: FileText,
        description: "Track your applications.",
    },
    {
        title: "Payments",
        href: "#",
        icon: CreditCard,
        description: "Manage your rent payments.",
    },
     {
        title: "Maintenance",
        href: "#",
        icon: Wrench,
        description: "Submit & track requests.",
    },
];

const notifications = [
    {
        title: "Application Approved!",
        description: "Your application for 'Modern Villa' has been approved.",
        date: "2 hours ago",
        link: "#",
        read: false,
    },
    {
        title: "New Message",
        description: "from Jane Doe (Agent) regarding 'Modern Villa'.",
        date: "1 day ago",
        link: "/messages/1",
        read: false,
    },
    {
        title: "Payment Reminder",
        description: "Your rent payment of $3,200 is due in 3 days.",
        date: "2 days ago",
        link: "#",
        read: true,
    }
]

const recommendedProperties = properties.slice(3, 6);

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-8">
        {/* Welcome Header */}
        <section>
            <h1 className="text-3xl font-bold font-headline md:text-4xl">Good Morning, John</h1>
            <p className="text-muted-foreground mt-2">Here's what's happening with your properties and searches today.</p>
        </section>

        {/* Quick Access */}
        <section>
            <h2 className="text-2xl font-bold font-headline mb-4">Quick Access</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {quickAccessLinks.map(link => (
                    <Card key={link.title} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 font-headline text-xl">
                                <link.icon className="h-6 w-6 text-primary" />
                                {link.title}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                           <p className="text-sm text-muted-foreground">{link.description}</p>
                        </CardContent>
                        <CardContent>
                            <Button variant="outline" asChild size="sm">
                                <Link href={link.href}>View All <ArrowRight className="ml-2 h-4 w-4"/></Link>
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </section>

        <div className="grid md:grid-cols-3 gap-8">
            {/* Recommended Properties */}
            <div className="md:col-span-2 space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Recommended For You</CardTitle>
                        <CardDescription>Based on your recent activity and saved properties.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {recommendedProperties.map(prop => <PropertyCard key={prop.id} property={prop}/>)}
                    </CardContent>
                    <CardContent>
                        <Button asChild>
                           <Link href="/marketplace">Explore More Properties</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Notifications */}
            <div className="space-y-8">
                 <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center justify-between">
                            <span className="flex items-center gap-2"><Bell className="h-6 w-6"/> Recent Activity</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {notifications.map((item, index) => (
                            <Link href={item.link} key={index} className="block hover:bg-muted/50 p-3 rounded-lg relative">
                                {!item.read && <Badge className="absolute top-2 right-2 !p-1 !h-auto !min-w-0"><span className="w-2 h-2 rounded-full bg-primary-foreground block"></span></Badge>}
                                <p className="font-semibold">{item.title}</p>
                                <p className="text-sm text-muted-foreground">{item.description}</p>
                                <p className="text-xs text-muted-foreground/70 mt-1">{item.date}</p>
                            </Link>
                        ))}
                    </CardContent>
                 </Card>
            </div>
        </div>
    </div>
  )
}
