
'use client';

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { leases, properties } from "@/lib/mock-data";
import { ChevronLeft, FileDown, FileSignature, MessageSquare, ShieldAlert } from "lucide-react";
import { getStatusVariant } from "@/lib/utils";

export default function LeaseDetailPage() {
    const params = useParams();
    const lease = leases.find(l => l.id === params.id);

    if (!lease) {
        notFound();
    }

    const property = properties.find(p => p.id === lease.propertyId);

    if (!property) {
        notFound();
    }

    return (
        <div className="max-w-4xl mx-auto">
             <div className="mb-4">
                <Link href="/profile?tab=leases" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back to All Leases
                </Link>
            </div>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                        <CardTitle className="font-headline text-2xl flex items-center gap-2"><FileSignature className="h-6 w-6 text-primary"/>Lease Details</CardTitle>
                        <CardDescription>for {lease.propertyTitle}</CardDescription>
                        </div>
                        <Badge variant={getStatusVariant(lease.status)}>{lease.status}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* Property & Tenant Info */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="flex items-center gap-4">
                            <Image src={property.images[0]} alt={property.title} width={120} height={90} className="rounded-md object-cover aspect-video" data-ai-hint="house exterior" />
                            <div>
                                 <p className="font-semibold">{property.title}</p>
                                 <p className="text-sm text-muted-foreground">{property.address}</p>
                                 <Button asChild variant="link" className="p-0 h-auto mt-1">
                                    <Link href={`/property/${property.id}`}>View Property</Link>
                                 </Button>
                            </div>
                        </div>
                         <div className="flex items-center gap-4">
                            <Image src="https://placehold.co/100x100.png" alt={lease.tenantName} width={80} height={80} className="rounded-full" data-ai-hint="person portrait"/>
                            <div>
                                 <p className="text-sm text-muted-foreground">Tenant</p>
                                 <p className="font-semibold">{lease.tenantName}</p>
                                 <Button asChild variant="link" className="p-0 h-auto mt-1">
                                    <Link href={`/messages`}>Contact Tenant</Link>
                                 </Button>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Lease Terms */}
                    <div className="space-y-4">
                         <h3 className="font-headline text-lg">Lease Terms</h3>
                         <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="p-4 rounded-lg bg-muted/50">
                                <p className="text-sm font-medium text-muted-foreground">Lease Term</p>
                                <p className="text-lg font-semibold">{new Date(lease.endDate).getFullYear() - new Date(lease.startDate).getFullYear()} Year(s)</p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/50">
                                <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                                <p className="text-lg font-semibold">{new Date(lease.startDate).toLocaleDateString()}</p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/50">
                                <p className="text-sm font-medium text-muted-foreground">End Date</p>
                                <p className="text-lg font-semibold">{new Date(lease.endDate).toLocaleDateString()}</p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/50">
                                <p className="text-sm font-medium text-muted-foreground">Monthly Rent</p>
                                <p className="text-lg font-semibold">${lease.rentAmount.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    
                    <Separator />

                    {/* Key Clauses */}
                    <div>
                        <h3 className="text-lg font-semibold mb-2 font-headline">Key Terms & Clauses</h3>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                            <li>No smoking is permitted inside the unit.</li>
                            <li>Pets are allowed with a one-time pet fee of $500.</li>
                            <li>Late rent payments are subject to a 5% late fee after a 3-day grace period.</li>
                            <li>Tenant is responsible for electricity and internet utilities.</li>
                            <li>Subletting is not permitted without prior written consent from the landlord.</li>
                        </ul>
                    </div>

                </CardContent>
                <CardFooter className="gap-4">
                    <Button size="lg" variant="outline"><FileDown className="mr-2"/> Download Lease (PDF)</Button>
                    <Button size="lg" variant="destructive"><FileSignature className="mr-2"/> Terminate Lease</Button>
                </CardFooter>
            </Card>
        </div>
    )
}
