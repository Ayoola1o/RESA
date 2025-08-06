import Image from "next/image"
import { notFound } from "next/navigation"
import {
  Bath,
  BedDouble,
  Building,
  CheckCircle,
  ChevronLeft,
  DollarSign,
  Heart,
  MapPin,
  Share,
  SquareGanttChart,
  Star,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Separator } from "@/components/ui/separator"
import { properties } from "@/lib/mock-data"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import PriceHistoryChart from "@/components/price-history-chart"

export default function PropertyDetailPage({ params }: { params: { id: string } }) {
  const property = properties.find((p) => p.id === params.id)

  if (!property) {
    notFound()
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
        <div className="mb-4">
            <Link href="/marketplace" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to marketplace
            </Link>
        </div>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <Card>
            <CardContent className="p-0">
              <Carousel className="w-full">
                <CarouselContent>
                  {property.images.map((img, index) => (
                    <CarouselItem key={index}>
                      <Image
                        src={img}
                        alt={`${property.title} image ${index + 1}`}
                        width={800}
                        height={600}
                        className="w-full aspect-video object-cover rounded-t-lg"
                        data-ai-hint="house interior"
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-4" />
                <CarouselNext className="right-4" />
              </Carousel>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Property Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold font-headline">{property.title}</h1>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon"><Share className="h-4 w-4" /></Button>
                  <Button variant="outline" size="icon"><Heart className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{property.address}, {property.city}, {property.state} {property.zip}</span>
              </div>
              <p className="text-4xl font-bold text-primary">${property.price.toLocaleString()}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center pt-4">
                <div className="p-4 rounded-lg bg-accent/50">
                    <BedDouble className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="font-semibold">{property.bedrooms}</p>
                    <p className="text-sm text-muted-foreground">Bedrooms</p>
                </div>
                <div className="p-4 rounded-lg bg-accent/50">
                    <Bath className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="font-semibold">{property.bathrooms}</p>
                    <p className="text-sm text-muted-foreground">Bathrooms</p>
                </div>
                 <div className="p-4 rounded-lg bg-accent/50">
                    <SquareGanttChart className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="font-semibold">{property.sqft.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Sq. Ft.</p>
                </div>
                 <div className="p-4 rounded-lg bg-accent/50">
                    <Building className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="font-semibold">{property.type}</p>
                    <p className="text-sm text-muted-foreground">Type</p>
                </div>
              </div>

              <Separator />

              <h3 className="font-semibold font-headline">Description</h3>
              <p className="text-muted-foreground">{property.description}</p>

              <h3 className="font-semibold font-headline">Features</h3>
              <div className="flex flex-wrap gap-2">
                {property.features.map(feature => <Badge key={feature} variant="secondary">{feature}</Badge>)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Price History</CardTitle>
            </CardHeader>
            <CardContent>
              <PriceHistoryChart data={property.priceHistory} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
            <Card>
                 <CardHeader className="items-center">
                    <Image src={property.agent.avatar} alt={property.agent.name} width={80} height={80} className="rounded-full" data-ai-hint="person portrait" />
                    <CardTitle className="font-headline">{property.agent.name}</CardTitle>
                    <CardDescription>Listing Agent</CardDescription>
                     <div className="flex items-center gap-0.5">
                        <Star className="w-4 h-4 fill-primary stroke-primary" />
                        <Star className="w-4 h-4 fill-primary stroke-primary" />
                        <Star className="w-4 h-4 fill-primary stroke-primary" />
                        <Star className="w-4 h-4 fill-primary stroke-primary" />
                        <Star className="w-4 h-4 fill-muted stroke-muted-foreground" />
                     </div>
                 </CardHeader>
                 <CardContent>
                    <Badge variant={property.isVerified ? 'default' : 'destructive'} className="w-full justify-center">
                        <CheckCircle className="mr-2 h-4 w-4"/>
                        {property.isVerified ? "Verified Listing" : "Unverified Listing"}
                    </Badge>
                 </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Contact Agent</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" placeholder="Your name" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="Your email" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea id="message" placeholder="I'm interested in this property..." />
                    </div>
                    <Button className="w-full">Send Message</Button>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Location</CardTitle>
                </CardHeader>
                <CardContent>
                    <Image src="https://placehold.co/600x400/e2e8f0/e2e8f0" alt="Map" width={600} height={400} className="w-full rounded-md" data-ai-hint="map satellite" />
                </CardContent>
            </Card>

        </div>
      </div>
    </div>
  )
}
