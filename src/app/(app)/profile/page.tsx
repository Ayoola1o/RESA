import Image from "next/image"
import Link from "next/link"
import { Mail, MapPin, MessageSquare, Building, ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { properties } from "@/lib/mock-data"
import PropertyCard from "@/components/property-card"
import { Badge } from "@/components/ui/badge"

const user = {
    name: "John Doe",
    email: "john.doe@example.com",
    location: "Austin, TX",
    role: "Buyer/Owner",
    avatar: "https://placehold.co/128x128",
    bio: "Real estate enthusiast and investor with a passion for modern architecture. Looking for my next property in a vibrant city neighborhood. Also a landlord for several properties.",
};

const userProperties = properties.slice(1, 3);

const recentMessages = [
    { from: "Jane Doe (Agent)", snippet: "Great news! The seller has accepted your offer on the Modern Villa...", property: "Modern Villa", date: "2 days ago"},
    { from: "Tenant (456 Urban St)", snippet: "Hi John, the sink in the kitchen is leaking. Can you please take a look?", property: "Cozy Downtown Apartment", date: "5 days ago"},
]

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-8">
       {/* Profile Header */}
      <Card>
        <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
            <Image
              src={user.avatar}
              alt={user.name}
              width={128}
              height={128}
              className="rounded-full border-4 border-primary"
              data-ai-hint="person portrait"
            />
            <div className="text-center md:text-left">
                <h1 className="text-3xl font-bold font-headline">{user.name}</h1>
                <div className="flex items-center justify-center md:justify-start gap-4 text-muted-foreground mt-2">
                    <span className="flex items-center gap-2"><Mail className="h-4 w-4"/> {user.email}</span>
                    <span className="flex items-center gap-2"><MapPin className="h-4 w-4"/> {user.location}</span>
                </div>
                 <p className="mt-4 max-w-2xl">{user.bio}</p>
                 <Badge className="mt-3">{user.role}</Badge>
            </div>
            <Button asChild className="ml-auto mt-4 md:mt-0">
                <Link href="/profile/edit">Edit Profile</Link>
            </Button>
        </CardContent>
      </Card>
        
      <div className="grid md:grid-cols-3 gap-8">
        {/* Main Content: Owned Properties */}
        <div className="md:col-span-2 space-y-8">
             <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><Building className="h-6 w-6"/> My Properties</CardTitle>
                    <CardDescription>A list of properties you currently own or are managing.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                    {userProperties.map(prop => <PropertyCard key={prop.id} property={prop}/>)}
                </CardContent>
             </Card>
        </div>

        {/* Sidebar: Messages */}
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center justify-between">
                       <span className="flex items-center gap-2"><MessageSquare className="h-6 w-6"/> Recent Messages</span>
                       <Button variant="outline" size="sm" asChild>
                            <Link href="/messages">View all <ArrowRight className="ml-2 h-4 w-4"/></Link>
                       </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {recentMessages.map((msg, index) => (
                        <div key={index}>
                            <div className="font-semibold">{msg.from}</div>
                            <p className="text-sm text-muted-foreground truncate">{msg.snippet}</p>
                            <p className="text-xs text-muted-foreground/70 mt-1">{msg.property} - {msg.date}</p>
                            {index < recentMessages.length - 1 && <Separator className="my-4" />}
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  )
}
