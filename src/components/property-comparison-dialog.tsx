
'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge";
import type { Property } from "@/lib/types";
import { Check, X } from "lucide-react";

interface PropertyComparisonDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    properties: (Property & { isComparing: boolean; notes: string })[];
    children: React.ReactNode;
}

const FeatureRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <TableRow>
        <TableCell className="font-semibold text-muted-foreground">{label}</TableCell>
        {children}
    </TableRow>
);

export default function PropertyComparisonDialog({ isOpen, onOpenChange, properties, children }: PropertyComparisonDialogProps) {
    
    if (properties.length < 2) {
         return <>{children}</>
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle className="font-headline text-2xl">Property Comparison</DialogTitle>
                    <DialogDescription>
                        Here's a side-by-side look at your selected properties.
                    </DialogDescription>
                </DialogHeader>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[150px]">Feature</TableHead>
                                {properties.map(p => (
                                    <TableHead key={p.id} className="font-bold">{p.title}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <FeatureRow label="Price">
                                {properties.map(p => <TableCell key={p.id} className="font-bold text-primary">${p.price.toLocaleString()}</TableCell>)}
                            </FeatureRow>
                            <FeatureRow label="Bedrooms">
                                {properties.map(p => <TableCell key={p.id}>{p.bedrooms}</TableCell>)}
                            </FeatureRow>
                             <FeatureRow label="Bathrooms">
                                {properties.map(p => <TableCell key={p.id}>{p.bathrooms}</TableCell>)}
                            </FeatureRow>
                             <FeatureRow label="Size (sqft)">
                                {properties.map(p => <TableCell key={p.id}>{p.sqft.toLocaleString()}</TableCell>)}
                            </FeatureRow>
                             <FeatureRow label="Property Type">
                                {properties.map(p => <TableCell key={p.id}>{p.type}</TableCell>)}
                            </FeatureRow>
                             <FeatureRow label="Status">
                                {properties.map(p => <TableCell key={p.id}><Badge variant={p.status === 'For Sale' ? 'destructive' : 'secondary'}>{p.status}</Badge></TableCell>)}
                            </FeatureRow>
                             <FeatureRow label="Verified Listing">
                                {properties.map(p => (
                                    <TableCell key={p.id} className="flex items-center">
                                        {p.isVerified ? <Check className="h-5 w-5 text-green-600"/> : <X className="h-5 w-5 text-destructive"/>}
                                    </TableCell>
                                ))}
                            </FeatureRow>
                             <FeatureRow label="Flood Risk">
                                {properties.map(p => <TableCell key={p.id}>{p.floodRisk}</TableCell>)}
                            </FeatureRow>
                            <TableRow>
                                <TableCell className="font-semibold align-top text-muted-foreground">Features</TableCell>
                                 {properties.map(p => (
                                    <TableCell key={p.id}>
                                        <div className="flex flex-wrap gap-1">
                                            {p.features.map(f => <Badge key={f} variant="outline">{f}</Badge>)}
                                        </div>
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>
    )
}
