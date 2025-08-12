
'use client';

import { useState } from "react";
import Image from "next/image"
import { notFound, useParams } from "next/navigation"
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
  ShieldAlert,
  Calendar,
  FileText,
  MessageSquare,
  Users,
  Banknote,
  FileSignature,
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
import { properties, tenants, leases } from "@/lib/mock-data"
import Link from "next/link"
import PriceHistoryChart from "@/components/price-history-chart"
import { cn } from "@/lib/utils";
import { useUserRole } from "@/context/UserRoleContext";

export default function PropertyDetailPage() {
  const params = useParams();
  const { userRole } = useUserRole();
  const property = properties.find((p) => p.id === params.id)
  const [isLiked, setIsLiked] = useState(false);

  if (!property) {
    notFound()
  }

  const isLandlordView = userRole === 'landlord';
  const isRented = property.status === 'Rented';
  const tenantInfo = isRented ? tenants[property.id as keyof typeof tenants] : null;
  const leaseInfo = tenantInfo ? leases.find(l => l.id === tenantInfo.leaseId) : null;

  const LandlordRentedPropertyCards = () => (
    <div className="space-y-8">
        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><Users /> Tenant Information</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
                <Image src={tenantInfo?.avatar || ''} alt={tenantInfo?.name || ''} width={64} height={64} className="rounded-full" data-ai-hint="person portrait" />
                <div>
                    <p className="font-semibold">{tenantInfo?.name}</p>
                    <p className="text-sm text-muted-foreground">Current Tenant</p>
                    <Button variant="outline" size="sm" className="mt-2"><MessageSquare className="mr-2"/> Contact Tenant</Button>
                </div>
            </CardContent>
        </Card>
         <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><FileSignature /> Lease Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Lease Start Date</span>
                    <span className="font-semibold">{leaseInfo ? new Date(leaseInfo.startDate).toLocaleDateString() : 'N/A'}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">Lease End Date</span>
                    <span className="font-semibold">{leaseInfo ? new Date(leaseInfo.endDate).toLocaleDateString() : 'N/A'}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={leaseInfo?.status === 'Active' ? 'default' : 'secondary'}>{leaseInfo?.status}</Badge>
                </div>
                <Button asChild variant="outline" className="w-full"><Link href={`/lease/${leaseInfo?.id}`}>View Full Lease</Link></Button>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><Banknote /> Financials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly Rent</span>
                    <span className="font-semibold">${tenantInfo?.rentAmount.toLocaleString()}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">Next Payment Due</span>
                    <span className="font-semibold">{tenantInfo ? new Date(tenantInfo.nextPaymentDue).toLocaleDateString() : 'N/A'}</span>
                </div>
                <Button variant="outline" className="w-full">View Financial History</Button>
            </CardContent>
        </Card>
    </div>
  );

  const DefaultSidebar = () => (
    <div className="space-y-8">
            <Card className="overflow-hidden">
                 <CardHeader className="items-center bg-muted/30 pb-4">
                    <Image src={property.agent.avatar} alt={property.agent.name} width={80} height={80} className="rounded-full border-4 border-background shadow-md" data-ai-hint="person portrait" />
                    <CardTitle className="font-headline">{property.agent.name}</CardTitle>
                    <CardDescription>Listing Agent</CardDescription>
                     <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => <Star key={i} className={cn("w-4 h-4", i < 4 ? "fill-primary stroke-primary" : "fill-muted stroke-muted-foreground")} />)}
                     </div>
                 </CardHeader>
                 <CardContent className="p-4 space-y-4">
                    <Button className="w-full" size="lg"><MessageSquare className="mr-2"/> Contact Agent</Button>
                    <Button variant="outline" className="w-full" size="lg"><Calendar className="mr-2"/> Schedule a Tour</Button>
                 </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    {property.status === "For Rent" ? (
                        <Button asChild className="w-full" size="lg">
                            <Link href={`/apply/${property.id}`}>
                                <FileText className="mr-2 h-5 w-5" /> Apply Now
                            </Link>
                        </Button>
                    ) : (
                        <Button className="w-full" size="lg">
                            <DollarSign className="mr-2 h-5 w-5" /> Make an Offer
                        </Button>
                    )}
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Location & Hazards</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Image src="https://placehold.co/600x400/e2e8f0/e2e8f0" alt="Map" width={600} height={400} className="w-full rounded-md" data-ai-hint="map satellite" />
                    <Badge variant={property.isVerified ? 'default' : 'destructive'} className="w-full justify-center text-sm p-2">
                        {property.isVerified ? <CheckCircle className="mr-2 h-4 w-4"/> : <ShieldAlert className="mr-2 h-4 w-4"/>}
                        {property.isVerified ? "Verified Listing" : "Unverified Listing"}
                    </Badge>
                    <div className="border p-4 rounded-lg bg-muted/50">
                        <h4 className="font-semibold flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-destructive" /> Flood Risk</h4>
                        <p className="text-muted-foreground text-sm mt-1">This property is located in a <span className="font-bold text-destructive">{property.floodRisk}</span> risk flood zone. We recommend consulting with insurance providers about flood insurance.</p>
                    </div>
                </CardContent>
            </Card>

        </div>
  );

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
              <div className="flex justify-between items-start">
                 <div>
                    <Badge variant={property.status === 'For Sale' ? "destructive" : "secondary"}>{property.status}</Badge>
                    <h1 className="text-3xl font-bold font-headline mt-2">{property.title}</h1>
                 </div>
                 {!isLandlordView && (
                     <div className="flex items-center gap-2 flex-shrink-0">
                        <Button variant="outline" size="icon"><Share className="h-4 w-4" /></Button>
                        <Button variant="outline" size="icon" onClick={() => setIsLiked(!isLiked)} aria-pressed={isLiked}>
                            <Heart className={cn("h-4 w-4", isLiked && "fill-red-500 text-red-500")} />
                        </Button>
                    </div>
                 )}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{property.address}, {property.city}, {property.state} {property.zip}</span>
              </div>
              <p className="text-4xl font-bold text-primary">${property.price.toLocaleString()} {property.status === 'For Rent' && '/ month'}</p>
              
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
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

              <h3 className="font-semibold font-headline text-xl">Description</h3>
              <p className="text-muted-foreground">{property.description}</p>

              <h3 className="font-semibold font-headline text-xl">Features</h3>
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

        {isLandlordView && isRented && tenantInfo ? <LandlordRentedPropertyCards /> : <DefaultSidebar />}
        
      </div>
    </div>
  )
}
