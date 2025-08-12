
'use client';

import { useState, useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import Image from "next/image"
import Link from "next/link"
import { Mail, MapPin, Building, Heart, FileText, FileSignature, CreditCard, Trash2, FilePenLine, CheckCircle, RefreshCw, Banknote, AlertCircle, FileDown, Wrench, Sparkles, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import { properties as allProperties, applications } from "@/lib/mock-data"
import PropertyCard from "@/components/property-card"
import PropertyComparisonDialog from '@/components/property-comparison-dialog';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getCategorizedMaintenance } from '@/app/actions';
import { useUserRole } from '@/context/UserRoleContext';


const user = {
    name: "John Doe",
    email: "john.doe@example.com",
    location: "Austin, TX",
    role: "Buyer/Owner",
    avatar: "https://placehold.co/128x128.png",
    bio: "Real estate enthusiast and investor with a passion for modern architecture. Looking for my next property in a vibrant city neighborhood. Also a landlord for several properties.",
};

const userProperties = allProperties.slice(1, 3);

const initialSavedProperties = allProperties.slice(0, 4).map(p => ({
    ...p,
    notes: '',
    isComparing: false,
}));

const leaseDetails = {
    property: "Cozy Downtown Apartment",
    address: "456 Urban St, Apt 12B, San Francisco, CA 94105",
    term: "12 Months",
    startDate: "2023-08-01",
    endDate: "2024-07-31",
    rent: 3200,
    securityDeposit: 3200,
    status: "Active",
    renewalNoticeDate: "2024-05-31",
}

const paymentHistory = [
    { id: 'pay_1', date: '2023-11-01', amount: 3200, status: 'Paid', method: 'ACH' },
    { id: 'pay_2', date: '2023-10-01', amount: 3200, status: 'Paid', method: 'Credit Card' },
    { id: 'pay_3', date: '2023-09-01', amount: 3200, status: 'Paid', method: 'ACH' },
]

function getStatusVariant(status: 'Submitted' | 'Under Review' | 'Approved' | 'Rejected') {
    switch (status) {
        case 'Approved':
            return 'default';
        case 'Under Review':
            return 'secondary';
        case 'Rejected':
            return 'destructive';
        case 'Submitted':
        default:
            return 'outline';
    }
}

function MaintenanceSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full" size="lg">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wrench className="mr-2 h-4 w-4" />}
      Submit Request
    </Button>
  );
}

function MaintenanceRequestForm() {
    const { toast } = useToast();
    const [state, formAction, isPending] = useActionState(getCategorizedMaintenance, null);

    useEffect(() => {
        if (state?.error && typeof state.error !== 'object') {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: state.error,
            });
        }
    }, [state, toast]);

    return (
        <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Submit a Maintenance Request</CardTitle>
          <CardDescription>
            Please describe the issue you are experiencing in detail. Our team will review it shortly.
          </CardDescription>
        </CardHeader>
        <form action={formAction}>
            <CardContent>
            <div className="grid w-full gap-2">
              <Label htmlFor="requestText">Maintenance Issue Description</Label>
              <Textarea
                id="requestText"
                name="requestText"
                placeholder="e.g., 'The kitchen sink is clogged and water is not draining properly. I've tried using a plunger but it did not work.'"
                rows={6}
              />
               {state?.error?.requestText && <p className="text-sm text-destructive">{state.error.requestText[0]}</p>}
            </div>
            </CardContent>
            <CardFooter>
                <MaintenanceSubmitButton />
            </CardFooter>
        </form>
      </Card>

      {state?.data && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> AI Analysis Complete</CardTitle>
            <CardDescription>We've received and analyzed your request. Here are the details for our team:</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Category</p>
                    <Badge>{state.data.category}</Badge>
                </div>
                 <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Priority</p>
                    <Badge variant={state.data.priority === 'Emergency' || state.data.priority === 'High' ? 'destructive' : 'secondary'}>{state.data.priority}</Badge>
                </div>
            </div>
             <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Summary</p>
                <p className="text-card-foreground">{state.data.summary}</p>
            </div>
             <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Suggested Action</p>
                <p className="text-card-foreground">{state.data.suggestedAction}</p>
            </div>
            <p className="text-sm text-muted-foreground pt-4">Thank you! A member of our property management team will be in touch with you shortly to schedule the repair.</p>
          </CardContent>
        </Card>
      )}
    </div>
    )
}


export default function ProfilePage() {
    const { userRole } = useUserRole();
    const [savedProperties, setSavedProperties] = useState(initialSavedProperties);
    const [isCompareDialogOpen, setIsCompareDialogOpen] = useState(false);

    const handleNoteChange = (id: string, notes: string) => {
        setSavedProperties(prev => 
            prev.map(p => p.id === id ? { ...p, notes } : p)
        );
    };

    const handleCompareChange = (id: string, isComparing: boolean) => {
        const currentlyComparing = savedProperties.filter(p => p.isComparing).length;
        if (isComparing && currentlyComparing >= 3) {
            alert("You can only compare up to 3 properties at a time.");
            return;
        }
        setSavedProperties(prev =>
            prev.map(p => p.id === id ? { ...p, isComparing } : p)
        );
    };

    const handleRemoveProperty = (id: string) => {
        setSavedProperties(prev => prev.filter(p => p.id !== id));
    };
    
    const propertiesToCompare = savedProperties.filter(p => p.isComparing);

    const tenantTabs = (
        <>
            <TabsTrigger value="saved"><Heart className="mr-2"/> Saved Properties</TabsTrigger>
            <TabsTrigger value="applications"><FileText className="mr-2"/> Applications</TabsTrigger>
            <TabsTrigger value="lease"><FileSignature className="mr-2"/> Lease</TabsTrigger>
            <TabsTrigger value="payments"><CreditCard className="mr-2"/> Payments</TabsTrigger>
            <TabsTrigger value="maintenance"><Wrench className="mr-2"/> Maintenance</TabsTrigger>
        </>
    );

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
                 <Badge className="mt-3">{userRole === 'tenant' ? "Tenant" : "Landlord"}</Badge>
            </div>
            <Button asChild className="ml-auto mt-4 md:mt-0">
                <Link href="/settings">Edit Profile</Link>
            </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="properties" className="w-full">
          <TabsList className={cn("grid w-full", userRole === 'tenant' ? 'grid-cols-6' : 'grid-cols-2')}>
            <TabsTrigger value="properties"><Building className="mr-2"/> My Properties</TabsTrigger>
            {userRole === 'tenant' ? tenantTabs : <TabsTrigger value="settings">Profile Settings</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="properties">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">My Properties</CardTitle>
                    <CardDescription>A list of properties you currently own or are managing.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                    {userProperties.map(prop => <PropertyCard key={prop.id} property={prop}/>)}
                </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="saved">
             <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                     {savedProperties.map(property => (
                        <Card key={property.id} className="overflow-visible">
                            <div className="flex flex-col md:flex-row">
                                <div className="md:w-2/5">
                                    <PropertyCard property={property} />
                                </div>
                                <div className="p-6 flex flex-col justify-between md:w-3/5">
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`compare-${property.id}`}
                                                    checked={property.isComparing}
                                                    onCheckedChange={(checked) => handleCompareChange(property.id, !!checked)}
                                                />
                                                <label htmlFor={`compare-${property.id}`} className="text-sm font-medium">
                                                    Compare
                                                </label>
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveProperty(property.id)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                <span className="sr-only">Remove</span>
                                            </Button>
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor={`notes-${property.id}`} className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                                <FilePenLine className="h-4 w-4" /> Your Notes
                                            </label>
                                            <Input
                                                id={`notes-${property.id}`}
                                                placeholder="Add a note..."
                                                value={property.notes}
                                                onChange={(e) => handleNoteChange(property.id, e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                    {savedProperties.length === 0 && (
                        <Card className="text-center p-12">
                            <p className="text-lg text-muted-foreground">You haven't saved any properties yet.</p>
                            <p className="text-muted-foreground">Start exploring the marketplace to find your favorites!</p>
                        </Card>
                    )}
                </div>

                <div className="lg:col-span-1">
                     <Card className="sticky top-24">
                        <CardHeader>
                            <CardTitle className="font-headline">Compare Properties</CardTitle>
                            <CardDescription>Select 2-3 properties to compare side-by-side.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             {propertiesToCompare.length > 0 ? (
                                <div className="space-y-4">
                                    {propertiesToCompare.map((p, index) => (
                                        <div key={p.id}>
                                            <p className="font-semibold">{p.title}</p>
                                            <p className="text-sm text-primary">${p.price.toLocaleString()}</p>
                                            <p className="text-xs text-muted-foreground">{p.bedrooms} Beds | {p.bathrooms} Baths | {p.sqft} sqft</p>
                                            {index < propertiesToCompare.length - 1 && <Separator className="mt-4" />}
                                        </div>
                                    ))}
                                     <PropertyComparisonDialog
                                        isOpen={isCompareDialogOpen}
                                        onOpenChange={setIsCompareDialogOpen}
                                        properties={propertiesToCompare}
                                    >
                                        <Button className="w-full mt-4" disabled={propertiesToCompare.length < 2 || propertiesToCompare.length > 3}>
                                            Compare ({propertiesToCompare.length})
                                        </Button>
                                    </PropertyComparisonDialog>
                                </div>
                            ) : (
                                <div className="text-center text-muted-foreground py-8">
                                    <p>Select properties from your saved list to start comparing.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
          </TabsContent>

          <TabsContent value="applications">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">My Applications</CardTitle>
                        <CardDescription>Track the status of your submitted applications and offers.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                    <div className="divide-y divide-border">
                        {applications.map((app) => (
                        <div key={app.id} className="p-6 grid grid-cols-1 md:grid-cols-4 items-center gap-4 hover:bg-muted/50">
                            <div className="flex items-center gap-4 md:col-span-2">
                            <Image
                                src={app.propertyImage}
                                alt={app.propertyTitle}
                                width={100}
                                height={75}
                                className="rounded-lg object-cover aspect-video"
                                data-ai-hint="house exterior"
                            />
                            <div>
                                <Link href={`/property/${app.propertyId}`} className="font-semibold hover:underline">
                                {app.propertyTitle}
                                </Link>
                                <p className="text-sm text-muted-foreground">{app.type} Application</p>
                            </div>
                            </div>
                            <div className="text-center">
                            <Badge variant={getStatusVariant(app.status)}>{app.status}</Badge>
                            </div>
                            <div className="flex flex-col items-end text-right">
                            <p className="text-sm text-muted-foreground">Submitted: {new Date(app.dateSubmitted).toLocaleDateString()}</p>
                            <Button variant="outline" size="sm" className="mt-2">View Details</Button>
                            </div>
                        </div>
                        ))}
                    </div>
                    </CardContent>
                     {applications.length === 0 && (
                        <CardContent className="text-center p-12">
                            <p className="text-lg text-muted-foreground">You haven't submitted any applications yet.</p>
                            <p className="text-muted-foreground">Once you apply for a property, it will show up here.</p>
                        </CardContent>
                    )}
                </Card>
          </TabsContent>

           <TabsContent value="lease">
                <Card>
                    <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                        <CardTitle className="font-headline text-2xl flex items-center gap-2"><FileSignature className="h-6 w-6 text-primary"/>Lease for {leaseDetails.property}</CardTitle>
                        <CardDescription>{leaseDetails.address}</CardDescription>
                        </div>
                        <Badge variant={leaseDetails.status === 'Active' ? 'default' : 'secondary'}>{leaseDetails.status}</Badge>
                    </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="p-4 rounded-lg bg-muted/50">
                            <p className="text-sm font-medium text-muted-foreground">Lease Term</p>
                            <p className="text-lg font-semibold">{leaseDetails.term}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50">
                            <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                            <p className="text-lg font-semibold">{new Date(leaseDetails.startDate).toLocaleDateString()}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50">
                            <p className="text-sm font-medium text-muted-foreground">End Date</p>
                            <p className="text-lg font-semibold">{new Date(leaseDetails.endDate).toLocaleDateString()}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50">
                            <p className="text-sm font-medium text-muted-foreground">Monthly Rent</p>
                            <p className="text-lg font-semibold">${leaseDetails.rent.toLocaleString()}</p>
                        </div>
                    </div>
                    <Separator />
                    <div>
                        <h3 className="text-lg font-semibold mb-2 font-headline">Key Terms & Clauses</h3>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                            <li>No smoking is permitted inside the unit.</li>
                            <li>Pets are allowed with a one-time pet fee of $500.</li>
                            <li>Late rent payments are subject to a 5% late fee after a 3-day grace period.</li>
                            <li>Tenant is responsible for electricity and internet utilities.</li>
                        </ul>
                    </div>
                    <div className="border-l-4 border-yellow-500 bg-yellow-500/10 p-4 rounded-r-lg">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-yellow-800">Renewal Notice</h4>
                                    <p className="text-sm text-yellow-700">Your lease is up for renewal. Please make a decision by {new Date(leaseDetails.renewalNoticeDate).toLocaleDateString()} to renew or terminate your lease.</p>
                                </div>
                            </div>
                    </div>
                    </CardContent>
                    <CardFooter className="gap-4">
                    <Button size="lg"><FileSignature className="mr-2"/> Renew Lease</Button>
                    <Button size="lg" variant="outline"><FileDown className="mr-2"/> Download Lease (PDF)</Button>
                    </CardFooter>
                </Card>
          </TabsContent>

           <TabsContent value="payments">
             <div className="grid md:grid-cols-3 gap-8 items-start">
                <div className="md:col-span-2 space-y-8">
                <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Upcoming Payment</CardTitle>
                            <CardDescription>Your next rent payment is due December 1, 2023.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="border rounded-lg p-4 flex justify-between items-center bg-muted/20">
                                <p className="text-lg font-semibold">Rent for December</p>
                                <p className="text-2xl font-bold text-primary">$3,200.00</p>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="paymentMethod">Payment Method</Label>
                                <Select defaultValue="ach">
                                    <SelectTrigger id="paymentMethod">
                                        <SelectValue placeholder="Select a payment method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ach">Bank Account (ACH)</SelectItem>
                                        <SelectItem value="cc">Credit Card</SelectItem>
                                        <SelectItem value="wallet">Mobile Wallet</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button size="lg" className="w-full">
                                <CreditCard className="mr-2" /> Pay $3,200.00 Now
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Payment History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Method</TableHead>
                                        <TableHead className="text-right">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paymentHistory.map(p => (
                                        <TableRow key={p.id}>
                                            <TableCell>{p.date}</TableCell>
                                            <TableCell>${p.amount.toLocaleString()}</TableCell>
                                            <TableCell>{p.method}</TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant="default" className="bg-green-600">
                                                    <CheckCircle className="mr-1 h-3 w-3"/>
                                                    {p.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Auto-Pay</CardTitle>
                            <CardDescription>Set up recurring payments so you never miss a due date.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center justify-between p-6">
                        <div className="flex items-center gap-2">
                            <RefreshCw className="h-5 w-5 text-primary"/>
                            <Label htmlFor="autopay-switch" className="text-base">Enable Auto-Pay</Label>
                        </div>
                            <Switch id="autopay-switch" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Payment Methods</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="border p-3 rounded-lg flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2"><Banknote/> Bank of America ....1234</span>
                                <Badge variant="secondary">Primary</Badge>
                            </div>
                            <div className="border p-3 rounded-lg flex items-center justify-between text-sm text-muted-foreground">
                                <span className="flex items-center gap-2"><CreditCard/> Visa ....5678</span>
                            </div>
                            <Button variant="outline" className="w-full">Add a Method</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
          </TabsContent>

           <TabsContent value="maintenance">
                <MaintenanceRequestForm />
          </TabsContent>

           <TabsContent value="settings">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Profile Settings</CardTitle>
                        <CardDescription>
                        This is a placeholder for landlord-specific profile settings.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>Landlord settings content goes here...</p>
                    </CardContent>
                </Card>
          </TabsContent>
        </Tabs>
    </div>
  )
}
