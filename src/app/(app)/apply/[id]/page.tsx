
'use client';

import { useState } from "react";
import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
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
import { ChevronLeft, FileUp, Signature, Loader2, CheckCircle2 } from "lucide-react";
import { properties } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";

export default function ApplicationFormPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const property = properties.find(p => p.id === params.id);

    if (!property) {
        notFound();
    }

    const [fullName, setFullName] = useState("Ayoola O.");
    const [email, setEmail] = useState("ayoola@example.com");
    const [phone, setPhone] = useState("+234 803 123 4567");
    const [dob, setDob] = useState("1992-06-15");
    const [currentAddress, setCurrentAddress] = useState("Victoria Island, Lagos");
    const [employer, setEmployer] = useState("TechCorp Ltd");
    const [jobTitle, setJobTitle] = useState("Senior Product Specialist");
    const [idUploaded, setIdUploaded] = useState(false);
    const [paystubUploaded, setPaystubUploaded] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const [signature, setSignature] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!agreed) {
            toast({
                variant: "destructive",
                title: "Agreement Required",
                description: "Please check the box authorizing background verification to continue.",
            });
            return;
        }

        if (!signature.trim()) {
            toast({
                variant: "destructive",
                title: "Signature Required",
                description: "Please type your full legal name in the digital signature field.",
            });
            return;
        }

        setIsSubmitting(true);
        setTimeout(() => {
            setIsSubmitting(false);
            toast({
                title: "Application Submitted Successfully! 🎉",
                description: `Your rental application for ${property.title} has been submitted for review.`,
            });
            router.push('/profile?tab=applications');
        }, 800);
    };

    return (
        <div className="max-w-4xl mx-auto">
             <div className="mb-4">
                <Link href={`/property/${property.id}`} className="flex items-center text-sm text-muted-foreground hover:text-foreground">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back to Property
                </Link>
            </div>
            <form onSubmit={handleSubmit}>
                <Card className="rounded-2xl border-slate-200/90 shadow-xs">
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Rental Application</CardTitle>
                        <div className="flex items-center gap-4 pt-2">
                            <Image src={property.images[0]} alt={property.title} width={80} height={60} className="rounded-xl object-cover aspect-video" data-ai-hint="house exterior" />
                            <div>
                                 <p className="font-semibold text-slate-900">{property.title}</p>
                                 <p className="text-sm text-muted-foreground">{property.address}, {property.city}</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6 sm:space-y-8">
                        {/* Step 1: Personal Information */}
                        <div className="space-y-4">
                            <h3 className="font-headline text-base sm:text-lg border-b pb-2 font-bold text-slate-900">Step 1: Personal Information</h3>
                             <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Full Name</Label>
                                    <Input
                                        id="fullName"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required
                                        className="rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        required
                                        className="rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="dob">Date of Birth</Label>
                                    <Input
                                        id="dob"
                                        type="date"
                                        value={dob}
                                        onChange={(e) => setDob(e.target.value)}
                                        className="rounded-xl"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Step 2: Rental & Employment History */}
                         <div className="space-y-4">
                            <h3 className="font-headline text-base sm:text-lg border-b pb-2 font-bold text-slate-900">Step 2: Rental &amp; Employment</h3>
                             <div className="space-y-2">
                                <Label htmlFor="currentAddress">Current Address</Label>
                                <Input
                                    id="currentAddress"
                                    value={currentAddress}
                                    onChange={(e) => setCurrentAddress(e.target.value)}
                                    required
                                    className="rounded-xl"
                                />
                             </div>
                             <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="employer">Current Employer</Label>
                                    <Input
                                        id="employer"
                                        value={employer}
                                        onChange={(e) => setEmployer(e.target.value)}
                                        required
                                        className="rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="jobTitle">Job Title</Label>
                                    <Input
                                        id="jobTitle"
                                        value={jobTitle}
                                        onChange={(e) => setJobTitle(e.target.value)}
                                        required
                                        className="rounded-xl"
                                    />
                                </div>
                             </div>
                        </div>

                        {/* Step 3: Document Upload */}
                        <div className="space-y-4">
                            <h3 className="font-headline text-base sm:text-lg border-b pb-2 font-bold text-slate-900">Step 3: Document Verification</h3>
                            <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="id-upload">National ID / Passport / Driver&apos;s License</Label>
                                    <div
                                        onClick={() => {
                                            setIdUploaded(true);
                                            toast({ title: "ID Attached", description: "Government ID document attached successfully." });
                                        }}
                                        className="flex items-center justify-between p-3 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition"
                                    >
                                        <div className="flex items-center gap-2">
                                            {idUploaded ? <CheckCircle2 className="h-5 w-5 text-lime-700" /> : <FileUp className="h-5 w-5 text-muted-foreground" />}
                                            <span className="text-sm font-medium">
                                                {idUploaded ? "NIN_Card_Verified.pdf" : "Upload Government ID"}
                                            </span>
                                        </div>
                                        <Button type="button" variant="outline" size="sm" className="rounded-lg text-xs">
                                            {idUploaded ? "Replace" : "Choose file"}
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="paystub-upload">Proof of Income (Bank Statement / Pay Slip)</Label>
                                    <div
                                        onClick={() => {
                                            setPaystubUploaded(true);
                                            toast({ title: "Document Attached", description: "Proof of income attached successfully." });
                                        }}
                                        className="flex items-center justify-between p-3 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition"
                                    >
                                        <div className="flex items-center gap-2">
                                            {paystubUploaded ? <CheckCircle2 className="h-5 w-5 text-lime-700" /> : <FileUp className="h-5 w-5 text-muted-foreground" />}
                                            <span className="text-sm font-medium">
                                                {paystubUploaded ? "Bank_Statement_3M.pdf" : "Upload Proof of Income"}
                                            </span>
                                        </div>
                                        <Button type="button" variant="outline" size="sm" className="rounded-lg text-xs">
                                            {paystubUploaded ? "Replace" : "Choose file"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Step 4: Agreement & Signature */}
                        <div className="space-y-4">
                            <h3 className="font-headline text-base sm:text-lg border-b pb-2 font-bold text-slate-900">Step 4: Agreement &amp; Signature</h3>
                             <div className="flex items-start space-x-2">
                                <Checkbox
                                    id="terms"
                                    checked={agreed}
                                    onCheckedChange={(val) => setAgreed(!!val)}
                                />
                                <div className="grid gap-1.5 leading-none">
                                    <label htmlFor="terms" className="text-xs sm:text-sm font-medium leading-normal cursor-pointer text-slate-700">
                                    I certify that all information provided is accurate and authorize landlord screening, credit and tenancy background checks.
                                    </label>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="signature">Digital Signature</Label>
                                <div className="relative">
                                    <Input
                                        id="signature"
                                        placeholder="Type your full name to sign"
                                        className="pl-8 font-serif italic text-base rounded-xl"
                                        value={signature}
                                        onChange={(e) => setSignature(e.target.value)}
                                        required
                                    />
                                    <Signature className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"/>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" size="lg" className="w-full bg-lime-600 hover:bg-lime-500 text-white font-bold h-11 rounded-xl shadow-xs text-xs sm:text-sm" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Submitting Application...
                                </>
                            ) : (
                                "Submit Rental Application"
                            )}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}
