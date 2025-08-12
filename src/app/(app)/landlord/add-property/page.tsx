
'use client';

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, FileUp, Loader2, PlusCircle, Sparkles, Trash2 } from "lucide-react";
import { getGeneratedDescription } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";

const featuresList = [
    "Swimming Pool", "Fireplace", "Large Backyard", "Modern Kitchen", "Home Theater", "City View", "Lake Access", "Mountain Views", "Pet Friendly", "Gated Community"
];


export default function AddPropertyPage() {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [zip, setZip] = useState('');
    const [propertyType, setPropertyType] = useState('');
    const [status, setStatus] = useState('');
    const [price, setPrice] = useState('');
    const [sqft, setSqft] = useState('');
    const [bedrooms, setBedrooms] = useState('');
    const [bathrooms, setBathrooms] = useState('');
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

    const handleFeatureChange = (feature: string, checked: boolean) => {
        if (checked) {
            setSelectedFeatures(prev => [...prev, feature]);
        } else {
            setSelectedFeatures(prev => prev.filter(f => f !== feature));
        }
    };

    const handleGenerateDescription = () => {
        startTransition(async () => {
            const result = await getGeneratedDescription({
                title,
                propertyType,
                city,
                state,
                bedrooms,
                bathrooms,
                sqft,
                features: selectedFeatures,
            });

            if (result.error) {
                 toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: typeof result.error === 'string' ? result.error : 'Please fill out all property detail fields first.',
                });
            } else if (result.data) {
                setDescription(result.data.description);
                toast({
                    title: 'Success!',
                    description: 'A new property description has been generated.',
                });
            }
        });
    };

    return (
        <div className="max-w-4xl mx-auto">
             <div className="mb-4">
                <Link href="/landlord/dashboard" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back to Dashboard
                </Link>
            </div>
            <form>
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Add New Property</CardTitle>
                        <CardDescription>Fill out the details below to create a new property listing.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        
                        <div className="space-y-4">
                            <h3 className="font-headline text-lg border-b pb-2">Basic Information</h3>
                            <div className="space-y-2">
                                <Label htmlFor="title">Property Title</Label>
                                <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Modern Villa in Beverly Hills" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="description">Description</Label>
                                     <Button type="button" variant="outline" size="sm" onClick={handleGenerateDescription} disabled={isPending}>
                                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />}
                                        Generate with AI
                                    </Button>
                                </div>
                                <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the property..." />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-headline text-lg border-b pb-2">Location</h3>
                            <div className="space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <Input id="address" value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Luxury Lane" />
                            </div>
                            <div className="grid md:grid-cols-3 gap-4">
                                <div className="space-y-2"><Label htmlFor="city">City</Label><Input id="city" value={city} onChange={e => setCity(e.target.value)} placeholder="Beverly Hills" /></div>
                                <div className="space-y-2"><Label htmlFor="state">State</Label><Input id="state" value={state} onChange={e => setState(e.target.value)} placeholder="CA" /></div>
                                <div className="space-y-2"><Label htmlFor="zip">Zip Code</Label><Input id="zip" value={zip} onChange={e => setZip(e.target.value)} placeholder="90210" /></div>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <h3 className="font-headline text-lg border-b pb-2">Property Details</h3>
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="type">Property Type</Label>
                                    <Select value={propertyType} onValueChange={setPropertyType}><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger><SelectContent>
                                        <SelectItem value="house">House</SelectItem>
                                        <SelectItem value="apartment">Apartment</SelectItem>
                                        <SelectItem value="condo">Condo</SelectItem>
                                        <SelectItem value="single-room">Single Room</SelectItem>
                                        <SelectItem value="rp-apart">R&amp;P Apart</SelectItem>
                                        <SelectItem value="self-apart">Self Apart</SelectItem>
                                        <SelectItem value="office-space">Office Space</SelectItem>
                                        <SelectItem value="warehouse">Warehouse</SelectItem>
                                        <SelectItem value="shop">Shop</SelectItem>
                                        <SelectItem value="land">Land</SelectItem>
                                    </SelectContent></Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="status">Listing Status</Label>
                                    <Select value={status} onValueChange={setStatus}><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger><SelectContent><SelectItem value="for-sale">For Sale</SelectItem><SelectItem value="for-rent">For Rent</SelectItem></SelectContent></Select>
                                </div>
                                 <div className="space-y-2"><Label htmlFor="price">Price / Rent</Label><Input id="price" value={price} onChange={e => setPrice(e.target.value)} type="number" placeholder="3500000" /></div>
                                 <div className="space-y-2"><Label htmlFor="sqft">Square Feet</Label><Input id="sqft" value={sqft} onChange={e => setSqft(e.target.value)} type="number" placeholder="6000" /></div>
                                 <div className="space-y-2"><Label htmlFor="bedrooms">Bedrooms</Label><Input id="bedrooms" value={bedrooms} onChange={e => setBedrooms(e.target.value)} type="number" placeholder="5" /></div>
                                 <div className="space-y-2"><Label htmlFor="bathrooms">Bathrooms</Label><Input id="bathrooms" value={bathrooms} onChange={e => setBathrooms(e.target.value)} type="number" placeholder="6" /></div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-headline text-lg border-b pb-2">Features &amp; Amenities</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {featuresList.map(feature => (
                                    <div key={feature} className="flex items-center space-x-2">
                                        <Checkbox 
                                            id={`feature-${feature}`} 
                                            onCheckedChange={(checked) => handleFeatureChange(feature, !!checked)}
                                        />
                                        <label htmlFor={`feature-${feature}`} className="text-sm font-medium">{feature}</label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-headline text-lg border-b pb-2">Photo &amp; Media</h3>
                             <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Property Photos</Label>
                                    <div className="flex items-center justify-center w-full p-6 border-2 border-dashed rounded-md">
                                        <div className="text-center">
                                            <FileUp className="mx-auto h-12 w-12 text-muted-foreground" />
                                            <p className="mt-2 text-sm text-muted-foreground">Drag &amp; drop files or</p>
                                            <Button type="button" variant="outline" size="sm" className="mt-2">Choose files</Button>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="virtual-tour">Virtual Tour URL</Label>
                                    <Input id="virtual-tour" placeholder="https://your-tour-link.com" />
                                </div>
                            </div>
                        </div>

                    </CardContent>
                    <CardFooter>
                        <Button size="lg" className="w-full">Create Listing</Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    )
}
