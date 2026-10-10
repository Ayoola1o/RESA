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
import { maintenanceRequests, properties } from "@/lib/mock-data";
import { ChevronLeft, MessageSquare, Wrench, Calendar, CheckCircle, Sparkles, User, FileText, Send } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getStatusVariant } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function MaintenanceDetailPage() {
    const params = useParams();
    const { toast } = useToast();
    const request = maintenanceRequests.find(r => r.id === params.id);

    if (!request) {
        notFound();
    }

    const property = properties.find(p => p.id === request.propertyId);

    if (!property) {
        notFound();
    }

    const [currentStatus, setCurrentStatus] = useState(request.status);
    const [notes, setNotes] = useState("");
    const [noteList, setNoteList] = useState<string[]>([
        "- November 29, 2023: Landlord assigned 'Pro Plumbers' to the job.",
        "- November 28, 2023: Tenant submitted request.",
    ]);
    const [isScheduleOpen, setIsScheduleOpen] = useState(false);
    const [serviceProvider, setServiceProvider] = useState("Pro Plumbers & Electrical Services");
    const [serviceDate, setServiceDate] = useState("");

    const handleStatusChange = (val: string) => {
        const formatted = val === 'completed' ? 'Completed' : val === 'in-progress' ? 'In Progress' : 'Pending';
        setCurrentStatus(formatted);
        toast({
            title: "Status Updated",
            description: `Request status changed to ${formatted}.`,
        });
    };

    const handleMarkComplete = () => {
        setCurrentStatus('Completed');
        toast({
            title: "Request Completed",
            description: `Maintenance ticket #${request.id} has been marked as resolved.`,
        });
    };

    const handleAddNote = () => {
        if (!notes.trim()) return;
        const newEntry = `- Today: ${notes.trim()}`;
        setNoteList(prev => [newEntry, ...prev]);
        setNotes("");
        toast({
            title: "Note Saved",
            description: "Internal note has been added to this ticket's history.",
        });
    };

    const handleScheduleService = () => {
        setIsScheduleOpen(false);
        setCurrentStatus('In Progress');
        toast({
            title: "Service Dispatched",
            description: `${serviceProvider} has been assigned for ${serviceDate || 'tomorrow'}. Tenant notified.`,
        });
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-4">
                <Link href="/profile?tab=maintenance-landlord" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back to All Requests
                </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
                <div className="md:col-span-2 space-y-6 sm:space-y-8">
                    <Card className="rounded-2xl border-slate-200/90 shadow-xs">
                        <CardHeader>
                             <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="font-headline text-xl sm:text-2xl flex items-center gap-2">
                                        <Wrench className="h-5 w-5 sm:h-6 sm:w-6 text-lime-700"/>Maintenance Request
                                    </CardTitle>
                                    <CardDescription>Submitted on {new Date(request.dateSubmitted).toLocaleDateString()}</CardDescription>
                                </div>
                                <Badge variant={getStatusVariant(currentStatus)} className="text-sm font-bold">{currentStatus}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h3 className="text-base sm:text-lg font-bold mb-2 font-headline flex items-center gap-2 text-slate-900"><FileText className="h-4 w-4 text-slate-500" /> Tenant&apos;s Request</h3>
                                <p className="text-muted-foreground bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs sm:text-sm leading-relaxed">{request.description}</p>
                            </div>
                            <Separator />
                            <div>
                                <h3 className="text-base sm:text-lg font-bold mb-2 font-headline flex items-center gap-2 text-slate-900"><Sparkles className="text-lime-700 h-4 w-4"/> AI Diagnostic Summary</h3>
                                <div className="grid grid-cols-2 gap-3 sm:gap-4 border border-slate-200/80 p-3.5 sm:p-4 rounded-xl bg-slate-50/50">
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground">Category</p>
                                        <Badge className="bg-lime-50 text-lime-800 border-lime-300 font-bold text-xs">{request.category}</Badge>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground">Priority</p>
                                        <Badge variant={request.priority === 'Emergency' || request.priority === 'High' ? 'destructive' : 'secondary'} className="text-xs font-bold">{request.priority}</Badge>
                                    </div>
                                    <div className="space-y-1 col-span-2 pt-1 border-t border-slate-100">
                                        <p className="text-xs font-medium text-muted-foreground">Suggested Action</p>
                                        <p className="text-xs sm:text-sm text-slate-800 font-medium">Contact a licensed professional contractor for on-site assessment and repair.</p>
                                    </div>
                                </div>
                            </div>
                             <Separator />
                            <div>
                                <h3 className="text-base sm:text-lg font-bold mb-2 font-headline text-slate-900">Internal Notes & History</h3>
                                <div className="space-y-2">
                                    <Textarea
                                        placeholder="Add notes for your property management team..."
                                        rows={3}
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="rounded-xl resize-none text-xs"
                                    />
                                    <Button onClick={handleAddNote} size="sm" variant="outline" className="rounded-xl text-xs font-bold">
                                        <Send className="mr-1.5 h-3.5 w-3.5" /> Save Note
                                    </Button>
                                </div>
                                <div className="text-xs text-muted-foreground mt-3 space-y-1.5">
                                    {noteList.map((entry, idx) => (
                                        <p key={idx} className="bg-slate-50 p-2 rounded-lg border border-slate-100">{entry}</p>
                                    ))}
                                </div>
                            </div>

                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-6 sm:space-y-8">
                    <Card className="rounded-2xl border-slate-200/90 shadow-xs">
                        <CardHeader>
                            <CardTitle className="font-headline text-base sm:text-lg font-bold text-slate-900">Property & Tenant</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="flex items-center gap-3">
                                <Image src={property.images[0]} alt={property.title} width={64} height={48} className="rounded-xl object-cover aspect-video" data-ai-hint="house exterior"/>
                                <div>
                                     <p className="font-semibold text-xs sm:text-sm text-slate-900">{property.title}</p>
                                     <Button asChild variant="link" className="p-0 h-auto text-lime-700 hover:text-lime-800 text-xs">
                                        <Link href={`/property/${property.id}`}>View Property</Link>
                                     </Button>
                                </div>
                            </div>
                            <Separator/>
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-full bg-slate-100 border border-slate-200">
                                    <User className="h-4 w-4 text-slate-600"/>
                                </div>
                                <div>
                                     <p className="font-bold text-xs sm:text-sm text-slate-900">{request.tenantName}</p>
                                     <p className="text-xs text-muted-foreground">Verified Tenant</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                     <Card className="rounded-2xl border-slate-200/90 shadow-xs">
                        <CardHeader>
                            <CardTitle className="font-headline text-base sm:text-lg font-bold text-slate-900">Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                             <div className="grid gap-1.5">
                                <Label htmlFor="status" className="text-xs font-bold">Update Status</Label>
                                <Select
                                    value={currentStatus.toLowerCase().replace(' ', '-')}
                                    onValueChange={handleStatusChange}
                                >
                                    <SelectTrigger id="status" className="rounded-xl h-10 text-xs font-semibold">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="in-progress">In Progress</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button
                                onClick={handleMarkComplete}
                                className="w-full bg-lime-600 hover:bg-lime-500 text-white font-bold rounded-xl h-10 shadow-xs text-xs"
                                disabled={currentStatus === 'Completed'}
                            >
                                <CheckCircle className="mr-2 h-4 w-4"/>
                                {currentStatus === 'Completed' ? 'Already Completed' : 'Mark as Complete'}
                            </Button>
                            <Button
                                onClick={() => setIsScheduleOpen(true)}
                                variant="outline"
                                className="w-full rounded-xl h-10 font-bold text-xs border-slate-300"
                            >
                                <Calendar className="mr-2 h-4 w-4"/> Schedule Service
                            </Button>
                            <Button asChild variant="outline" className="w-full rounded-xl h-10 font-bold text-xs border-slate-300">
                                <Link href="/messages">
                                    <MessageSquare className="mr-2 h-4 w-4"/> Message Tenant
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Schedule Service Dialog */}
            <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="font-headline">Dispatch Maintenance Service</DialogTitle>
                        <DialogDescription>
                            Assign a contractor or technician for {property.title}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="grid gap-2">
                            <Label htmlFor="provider">Service Contractor</Label>
                            <Input
                                id="provider"
                                value={serviceProvider}
                                onChange={(e) => setServiceProvider(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="service-date">Appointment Date</Label>
                            <Input
                                id="service-date"
                                type="date"
                                value={serviceDate}
                                onChange={(e) => setServiceDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsScheduleOpen(false)}>Cancel</Button>
                        <Button onClick={handleScheduleService}>Dispatch Technician</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

