
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, FilePenLine } from 'lucide-react';
import { properties as allProperties } from "@/lib/mock-data";
import PropertyCard from '@/components/property-card';
import { Separator } from '@/components/ui/separator';

// Mock saved properties for demonstration
const initialSavedProperties = allProperties.slice(0, 4).map(p => ({
    ...p,
    notes: '',
    isComparing: false,
}));

export default function SavedPropertiesPage() {
    const [savedProperties, setSavedProperties] = useState(initialSavedProperties);

    const handleNoteChange = (id: string, notes: string) => {
        setSavedProperties(prev => 
            prev.map(p => p.id === id ? { ...p, notes } : p)
        );
    };

    const handleCompareChange = (id: string, isComparing: boolean) => {
        setSavedProperties(prev =>
            prev.map(p => p.id === id ? { ...p, isComparing } : p)
        );
    };

    const handleRemoveProperty = (id: string) => {
        setSavedProperties(prev => prev.filter(p => p.id !== id));
    };
    
    const propertiesToCompare = savedProperties.filter(p => p.isComparing);

    return (
        <div className="flex flex-col gap-8">
            <section>
                <h1 className="text-3xl font-bold font-headline md:text-4xl">Saved Properties</h1>
                <p className="text-muted-foreground mt-2">Your personal collection of favorite listings.</p>
            </section>

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
                            <CardDescription>Select up to 3 properties to compare side-by-side.</CardDescription>
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
                                    <Button className="w-full mt-4" disabled={propertiesToCompare.length < 2}>
                                        Compare ({propertiesToCompare.length})
                                    </Button>
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
        </div>
    );
}
