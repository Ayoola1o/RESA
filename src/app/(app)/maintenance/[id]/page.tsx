
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
import { maintenanceRequests, properties } from "@/lib/mock-data";
import { ChevronLeft, MessageSquare, Wrench, Calendar, CheckCircle, Sparkles, User, FileText } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { getStatusVariant } from "@/lib/utils";


export default function MaintenanceDetailPage() {
    const params = useParams();
    const request = maintenanceRequests.find(r => r.id === params.id);

    if (!request) {
        notFound();
    }

    const property = properties.find(p => p.id === request.propertyId);

    if (!property) {
        notFound();
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-4">
                <Link href="/profile?tab=maintenance-landlord" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back to All Requests
                </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                             <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="font-headline text-2xl flex items-center gap-2">
                                        <Wrench className="h-6 w-6 text-primary"/>Maintenance Request
                                    </CardTitle>
                                    <CardDescription>Submitted on {new Date(request.dateSubmitted).toLocaleDateString()}</CardDescription>
                                </div>
                                <Badge variant={getStatusVariant(request.status)} className="text-base">{request.status}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-2 font-headline flex items-center gap-2"><FileText /> Tenant's Request</h3>
                                <p className="text-muted-foreground bg-muted/30 p-4 rounded-lg border">{request.description}</p>
                            </div>
                            <Separator />
                            <div>
                                <h3 className="text-lg font-semibold mb-2 font-headline flex items-center gap-2"><Sparkles className="text-primary"/> AI Analysis</h3>
                                <div className="grid grid-cols-2 gap-4 border p-4 rounded-lg">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">Category</p>
                                        <Badge>{request.category}</Badge>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">Priority</p>
                                        <Badge variant={request.priority === 'Emergency' || request.priority === 'High' ? 'destructive' : 'secondary'}>{request.priority}</Badge>
                                    </div>
                                    <div className="space-y-1 col-span-2">
                                        <p className="text-sm font-medium text-muted-foreground">Suggested Action</p>
                                        <p className="text-card-foreground">Contact a licensed professional for assessment and repair.</p>
                                    </div>
                                </div>
                            </div>
                             <Separator />
                            <div>
                                <h3 className="text-lg font-semibold mb-2 font-headline">Internal Notes & History</h3>
                                <Textarea placeholder="Add notes for your team..." rows={4}/>
                                <div className="text-xs text-muted-foreground mt-4 space-y-2">
                                    <p>- November 29, 2023: Landlord assigned 'Pro Plumbers' to the job.</p>
                                    <p>- November 28, 2023: Tenant submitted request.</p>
                                </div>
                            </div>

                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Property & Tenant</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="flex items-center gap-3">
                                <Image src={property.images[0]} alt={property.title} width={64} height={48} className="rounded-md object-cover aspect-video" data-ai-hint="house exterior"/>
                                <div>
                                     <p className="font-semibold">{property.title}</p>
                                     <Button asChild variant="link" className="p-0 h-auto">
                                        <Link href={`/property/${property.id}`}>View Property</Link>
                                     </Button>
                                </div>
                            </div>
                            <Separator/>
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-full bg-muted">
                                    <User className="h-5 w-5 text-muted-foreground"/>
                                </div>
                                <div>
                                     <p className="font-semibold">{request.tenantName}</p>
                                     <p className="text-sm text-muted-foreground">Tenant</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="grid gap-1.5">
                                <Label htmlFor="status">Update Status</Label>
                                <Select defaultValue={request.status.toLowerCase().replace(' ', '-')}>
                                    <SelectTrigger id="status">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="in-progress">In Progress</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button className="w-full"><CheckCircle className="mr-2"/> Mark as Complete</Button>
                            <Button variant="outline" className="w-full"><Calendar className="mr-2"/> Schedule Service</Button>
                            <Button variant="outline" className="w-full"><MessageSquare className="mr-2"/> Message Tenant</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

