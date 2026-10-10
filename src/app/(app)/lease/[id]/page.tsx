
'use client';

import { useState } from "react";
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
import { ChevronLeft, FileDown, FileSignature, MessageSquare, ShieldAlert, AlertTriangle } from "lucide-react";
import { getStatusVariant, formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function LeaseDetailPage() {
    const params = useParams();
    const { toast } = useToast();
    const [isTerminating, setIsTerminating] = useState(false);
    const [leaseStatus, setLeaseStatus] = useState<string | null>(null);
    const lease = leases.find(l => l.id === params.id);

    if (!lease) {
        notFound();
    }

    const currentStatus = leaseStatus || lease.status;
    const property = properties.find(p => p.id === lease.propertyId);

    if (!property) {
        notFound();
    }

    const handleDownloadPdf = () => {
        if (typeof window !== 'undefined') {
            window.print();
            toast({
                title: "Lease Document Prepared",
                description: `Official lease agreement for ${lease.propertyTitle} prepared for download/print.`,
            });
        }
    };

    const handleConfirmTermination = () => {
        setLeaseStatus('Terminated');
        setIsTerminating(false);
        toast({
            variant: "destructive",
            title: "Lease Termination Submitted",
            description: "Termination notice has been recorded and served to the tenant.",
        });
    };

    return (
        <div className="max-w-4xl mx-auto">
             <div className="mb-4">
                <Link href="/profile?tab=leases" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back to All Leases
                </Link>
            </div>
            <Card className="rounded-2xl border-slate-200/90 shadow-xs">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                        <CardTitle className="font-headline text-xl sm:text-2xl flex items-center gap-2"><FileSignature className="h-5 w-5 sm:h-6 sm:w-6 text-lime-700"/>Lease Details</CardTitle>
                        <CardDescription>for {lease.propertyTitle}</CardDescription>
                        </div>
                        <Badge variant={getStatusVariant(currentStatus as any)}>{currentStatus}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6 sm:space-y-8">
                    {/* Property & Tenant Info */}
                    <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                        <div className="flex items-center gap-4">
                            <Image src={property.images[0]} alt={property.title} width={120} height={90} className="rounded-xl object-cover aspect-video" data-ai-hint="house exterior" />
                            <div>
                                 <p className="font-semibold text-slate-900">{property.title}</p>
                                 <p className="text-sm text-muted-foreground">{property.address}</p>
                                 <Button asChild variant="link" className="p-0 h-auto mt-1 text-lime-700 hover:text-lime-800">
                                    <Link href={`/property/${property.id}`}>View Property</Link>
                                 </Button>
                            </div>
                        </div>
                         <div className="flex items-center gap-4">
                            <Image src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80" alt={lease.tenantName} width={80} height={80} className="rounded-full object-cover aspect-square" data-ai-hint="person portrait"/>
                            <div>
                                 <p className="text-xs text-muted-foreground">Tenant</p>
                                 <p className="font-semibold text-slate-900">{lease.tenantName}</p>
                                 <Button asChild variant="link" className="p-0 h-auto mt-1 text-lime-700 hover:text-lime-800">
                                    <Link href={`/messages`}>Contact Tenant</Link>
                                 </Button>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Lease Terms */}
                    <div className="space-y-3.5">
                         <h3 className="font-headline text-base sm:text-lg font-bold text-slate-900">Lease Terms</h3>
                         <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                                <p className="text-xs font-medium text-muted-foreground">Lease Term</p>
                                <p className="text-sm sm:text-base font-bold text-slate-900">{new Date(lease.endDate).getFullYear() - new Date(lease.startDate).getFullYear()} Year(s)</p>
                            </div>
                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                                <p className="text-xs font-medium text-muted-foreground">Start Date</p>
                                <p className="text-sm sm:text-base font-bold text-slate-900">{new Date(lease.startDate).toLocaleDateString()}</p>
                            </div>
                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                                <p className="text-xs font-medium text-muted-foreground">End Date</p>
                                <p className="text-sm sm:text-base font-bold text-slate-900">{new Date(lease.endDate).toLocaleDateString()}</p>
                            </div>
                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                                <p className="text-xs font-medium text-muted-foreground">Annual Rent</p>
                                <p className="text-sm sm:text-base font-bold text-slate-900">{formatCurrency(lease.rentAmount, 'For Rent')}</p>
                            </div>
                        </div>
                    </div>
                    
                    <Separator />

                    {/* Key Clauses */}
                    <div>
                        <h3 className="text-base sm:text-lg font-bold mb-2 font-headline text-slate-900">Key Terms & Clauses</h3>
                        <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-slate-600">
                            <li>No smoking is permitted inside the unit.</li>
                            <li>Pets are allowed with a one-time pet deposit.</li>
                            <li>Late rent payments are subject to a 5% late surcharge after a 3-day grace period.</li>
                            <li>Tenant is responsible for electricity (PHCN) and internet service.</li>
                            <li>Subletting is not permitted without prior written consent from the landlord.</li>
                        </ul>
                    </div>

                </CardContent>
                <CardFooter className="gap-3 flex-wrap">
                    <Button onClick={handleDownloadPdf} size="sm" variant="outline" className="rounded-xl h-10 font-bold text-xs">
                        <FileDown className="mr-2 h-4 w-4"/> Download Lease (PDF)
                    </Button>
                    <Button
                        onClick={() => setIsTerminating(true)}
                        size="sm"
                        variant="destructive"
                        className="rounded-xl h-10 font-bold text-xs"
                        disabled={currentStatus === 'Terminated'}
                    >
                        <FileSignature className="mr-2 h-4 w-4"/>
                        {currentStatus === 'Terminated' ? 'Lease Terminated' : 'Terminate Lease'}
                    </Button>
                </CardFooter>
            </Card>

            {/* Terminate Lease Dialog */}
            <Dialog open={isTerminating} onOpenChange={setIsTerminating}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive font-headline">
                            <AlertTriangle className="h-5 w-5" /> Confirm Lease Termination
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to terminate the lease for {lease.propertyTitle} with tenant {lease.tenantName}? This action will record an early termination notice.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsTerminating(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleConfirmTermination}>
                            Yes, Terminate Lease
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
