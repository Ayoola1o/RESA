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
import { ArrowRight } from "lucide-react"
import { properties } from "@/lib/mock-data"
import PropertyCard from "@/components/property-card"

const newsArticles = [
    {
        id: 1,
        title: "The Future of Smart Homes: What to Expect in 2025",
        source: "Real Estate Weekly",
        date: "2023-11-28",
        image: "https://placehold.co/600x400",
        aiHint: "smart home",
    },
    {
        id: 2,
        title: "Market Trends: Is Now a Good Time to Invest in Urban Properties?",
        source: "Property Pro Daily",
        date: "2023-11-27",
        image: "https://placehold.co/600x400",
        aiHint: "city skyline",
    },
     {
        id: 3,
        title: "Sustainable Living: Top Eco-Friendly Features for Your Next Home",
        source: "Green Homes Magazine",
        date: "2023-11-26",
        image: "https://placehold.co/600x400",
        aiHint: "eco house",
    }
]

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-8">
        {/* Welcome Header */}
        <section className="p-8 rounded-lg bg-card text-card-foreground shadow-md border flex flex-col items-center text-center">
            <h1 className="text-4xl font-bold font-headline">Welcome back, John!</h1>
            <p className="mt-2 text-lg text-muted-foreground">Here's your real estate snapshot for today.</p>
            <div className="mt-6 flex gap-4">
                <Button asChild>
                    <Link href="/marketplace">Explore Marketplace</Link>
                </Button>
                <Button variant="outline" asChild>
                    <Link href="/profile">View Your Profile</Link>
                </Button>
            </div>
        </section>
      
        {/* News and Insights */}
        <section>
            <div className="flex justify-between items-center mb-4">
                 <h2 className="text-2xl font-bold font-headline">News & Insights</h2>
                 <Button variant="link" asChild>
                     <Link href="#">View All <ArrowRight className="ml-2 h-4 w-4"/></Link>
                 </Button>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {newsArticles.map(article => (
                    <Card key={article.id} className="overflow-hidden">
                        <Image src={article.image} alt={article.title} width={600} height={400} className="w-full h-48 object-cover" data-ai-hint={article.aiHint}/>
                        <CardHeader>
                            <CardTitle className="text-lg font-headline">{article.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">{article.source} - {article.date}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </section>

        {/* Featured Properties */}
        <section>
             <div className="flex justify-between items-center mb-4">
                 <h2 className="text-2xl font-bold font-headline">Featured Properties</h2>
                 <Button variant="link" asChild>
                     <Link href="/marketplace">Explore More <ArrowRight className="ml-2 h-4 w-4"/></Link>
                 </Button>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {properties.slice(0, 4).map(property => (
                    <PropertyCard key={property.id} property={property} />
                ))}
            </div>
        </section>

    </div>
  )
}
