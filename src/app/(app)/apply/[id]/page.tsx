
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, FileUp, Signature } from "lucide-react";
import { properties } from "@/lib/mock-data";

export default function ApplicationFormPage() {
    const params = useParams();
    const property = properties.find(p => p.id === params.id);

    if (!property) {
        notFound();
    }

    return (
        <div className="max-w-4xl mx-auto">
             <div className="mb-4">
                <Link href={`/property/${property.id}`} className="flex items-center text-sm text-muted-foreground hover:text-foreground">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back to Property
                </Link>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Rental Application</CardTitle>
                    <div className="flex items-center gap-4 pt-2">
                        <Image src={property.images[0]} alt={property.title} width={80} height={60} className="rounded-md object-cover aspect-video" data-ai-hint="house exterior" />
                        <div>
                             <p className="font-semibold">{property.title}</p>
                             <p className="text-sm text-muted-foreground">{property.address}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* Step 1: Personal Information */}
                    <div className="space-y-4">
                        <h3 className="font-headline text-lg border-b pb-2">Step 1: Personal Information</h3>
                         <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2"><Label htmlFor="fullName">Full Name</Label><Input id="fullName" placeholder="John Doe" /></div>
                            <div className="space-y-2"><Label htmlFor="email">Email Address</Label><Input id="email" type="email" placeholder="john.doe@example.com" /></div>
                            <div className="space-y-2"><Label htmlFor="phone">Phone Number</Label><Input id="phone" type="tel" placeholder="(123) 456-7890" /></div>
                            <div className="space-y-2"><Label htmlFor="dob">Date of Birth</Label><Input id="dob" type="date" /></div>
                        </div>
                    </div>

                    {/* Step 2: Rental & Employment History */}
                     <div className="space-y-4">
                        <h3 className="font-headline text-lg border-b pb-2">Step 2: Rental & Employment</h3>
                         <div className="space-y-2"><Label htmlFor="currentAddress">Current Address</Label><Input id="currentAddress" placeholder="123 Main St, Anytown, USA" /></div>
                         <div className="space-y-2"><Label htmlFor="employer">Current Employer</Label><Input id="employer" placeholder="ABC Corporation" /></div>
                         <div className="space-y-2"><Label htmlFor="jobTitle">Job Title</Label><Input id="jobTitle" placeholder="Software Engineer" /></div>
                    </div>

                    {/* Step 3: Document Upload */}
                    <div className="space-y-4">
                        <h3 className="font-headline text-lg border-b pb-2">Step 3: Document Upload</h3>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="id-upload">Photo ID (Driver's License, etc.)</Label>
                                <div className="flex items-center gap-2 p-2 border-2 border-dashed rounded-md">
                                    <FileUp className="h-8 w-8 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Drag & drop or</span>
                                    <Button type="button" variant="outline" size="sm">Choose file</Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="paystub-upload">Proof of Income (Pay Stubs)</Label>
                                <div className="flex items-center gap-2 p-2 border-2 border-dashed rounded-md">
                                    <FileUp className="h-8 w-8 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Drag & drop or</span>
                                    <Button type="button" variant="outline" size="sm">Choose file</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Step 4: Agreement & Signature */}
                    <div className="space-y-4">
                        <h3 className="font-headline text-lg border-b pb-2">Step 4: Agreement & Signature</h3>
                         <div className="flex items-start space-x-2">
                            <Checkbox id="terms" />
                            <div className="grid gap-1.5 leading-none">
                                <label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                I authorize the verification of this information and understand that a background and credit check will be performed.
                                </label>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="signature">Digital Signature</Label>
                            <div className="relative">
                                <Input id="signature" placeholder="Type your full name to sign" className="pl-8 font-serif italic" />
                                <Signature className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"/>
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button size="lg" className="w-full">Submit Application</Button>
                </CardFooter>
            </Card>
        </div>
    )
}
