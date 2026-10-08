'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ChevronLeft,
  FileUp,
  Loader2,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Building2,
  FileText,
  Save,
  Send,
} from 'lucide-react';
import { getGeneratedDescription } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import {
  createPropertyDraftAction,
  submitPropertyAction,
  addPropertyDocumentAction,
} from '@/server/actions/prophunta-actions';
import { PropertyType, ListingType, DocumentType } from '@/types/prophunta';

const featuresList = [
  '24/7 Dedicated Power',
  'Water Treatment Plant',
  'Gated Estate Security',
  'CCTV Perimeter Monitoring',
  'Private Swimming Pool',
  'Industrial Generator',
  'Boys Quarters (BQ)',
  'Fitted Italian Kitchen',
  'Solar Inverter Backup',
  'Adequate Parking (4+ cars)',
  'High-speed Fiber Optic',
  'Automated Smart Home',
];

export default function AddPropertyPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('Lagos');
  const [state, setState] = useState('Lagos');
  const [propertyType, setPropertyType] = useState<PropertyType>('Apartment');
  const [listingType, setListingType] = useState<ListingType>('RENT');
  const [price, setPrice] = useState('');
  const [agreementFee, setAgreementFee] = useState('');
  const [cautionFee, setCautionFee] = useState('');
  const [serviceCharge, setServiceCharge] = useState('');
  const [otherCharges, setOtherCharges] = useState('');
  const [sqft, setSqft] = useState('');
  const [bedrooms, setBedrooms] = useState('3');
  const [bathrooms, setBathrooms] = useState('3');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
    '24/7 Dedicated Power',
    'Gated Estate Security',
  ]);

  // Media
  const [imageUrl, setImageUrl] = useState('');
  const [images, setImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
  ]);

  // Documents
  const [docType, setDocType] = useState<DocumentType>('GOVERNORS_CONSENT');
  const [docFileName, setDocFileName] = useState('');
  const [uploadedDocs, setUploadedDocs] = useState<{ type: DocumentType; name: string }[]>([]);

  const handleFeatureChange = (feature: string, checked: boolean) => {
    if (checked) {
      setSelectedFeatures((prev) => [...prev, feature]);
    } else {
      setSelectedFeatures((prev) => prev.filter((f) => f !== feature));
    }
  };

  const handleAddImage = () => {
    if (imageUrl.trim()) {
      setImages((prev) => [...prev, imageUrl.trim()]);
      setImageUrl('');
    }
  };

  const handleAddDocumentRecord = () => {
    if (!docFileName.trim()) return;
    setUploadedDocs((prev) => [...prev, { type: docType, name: docFileName.trim() }]);
    setDocFileName('');
    toast({
      title: 'Document Attached',
      description: `${docType} attached for verification officer review.`,
    });
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

      const res = result as any;
      if (res.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: typeof res.error === 'string' ? res.error : 'Please fill out all property detail fields first.',
        });
      } else if (res.data) {
        setDescription(res.data.description);
        toast({
          title: 'Description Generated',
          description: 'AI description populated with local Nigerian context.',
        });
      }
    });
  };

  const saveOrSubmit = async (shouldSubmitForReview: boolean) => {
    if (!title.trim() || !price || !address.trim() || !area.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing Required Fields',
        description: 'Please provide Title, Location/Area, Address, and Price.',
      });
      return;
    }

    setIsSubmitting(true);
    const res = await createPropertyDraftAction({
      title: title.trim(),
      propertyType,
      listingType,
      description: description.trim() || `${title} located in ${area}, ${city}. Verified trust listing.`,
      state,
      city,
      area: area.trim(),
      address: address.trim(),
      price: Number(price),
      agreementFee: agreementFee ? Number(agreementFee) : 0,
      cautionFee: cautionFee ? Number(cautionFee) : 0,
      serviceCharge: serviceCharge ? Number(serviceCharge) : 0,
      otherCharges: otherCharges ? Number(otherCharges) : 0,
      bedrooms: Number(bedrooms) || 1,
      bathrooms: Number(bathrooms) || 1,
      sqft: sqft ? Number(sqft) : undefined,
      features: selectedFeatures,
      images: images.length > 0 ? images : [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
      ],
    });

    if (!res.success || !res.property) {
      setIsSubmitting(false);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: res.error || 'Failed to create listing record.',
      });
      return;
    }

    const createdProp = res.property;

    // Attach any documents
    for (const d of uploadedDocs) {
      await addPropertyDocumentAction(createdProp.id, d.type, d.name);
    }

    // Submit for review if requested
    if (shouldSubmitForReview) {
      await submitPropertyAction(createdProp.id);
      toast({
        title: 'Listing Submitted for Review! 🛡️',
        description: `"${title}" has entered the PropHunta AI verification queue. Status: SUBMITTED.`,
      });
    } else {
      toast({
        title: 'Draft Saved! 📝',
        description: `"${title}" has been saved as a DRAFT. You can edit or submit later.`,
      });
    }

    setIsSubmitting(false);
    router.push('/profile?tab=properties');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center text-sm font-semibold text-slate-500 hover:text-slate-900"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-2 text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200">
          <ShieldCheck className="h-4 w-4 text-blue-600" />
          <span>Trust Infrastructure Onboarding</span>
        </div>
      </div>

      <Card className="rounded-2xl shadow-md border-slate-200/80 bg-white">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-2xl font-black text-slate-900">
            Create Verified Property Listing
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Follow the 8-step compliance workflow to list property on PropHunta AI.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8 pt-6">
          {/* SECTION 1: Basic Information */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">1</span>
              Basic Information
            </h3>

            <div className="space-y-2">
              <Label htmlFor="title" className="text-xs font-bold">Property Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 4 Bedroom Contemporary Detached Villa with BQ"
                required
                className="h-10 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold">Listing Type *</Label>
                <Select value={listingType} onValueChange={(v: any) => setListingType(v)}>
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RENT">For Rent (Annual / Short Let)</SelectItem>
                    <SelectItem value="SALE">For Sale (Outright Purchase)</SelectItem>
                    <SelectItem value="LEASE">Commercial Lease</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold">Property Type *</Label>
                <Select value={propertyType} onValueChange={(v: any) => setPropertyType(v)}>
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Apartment">Apartment / Flat</SelectItem>
                    <SelectItem value="House">Detached / Semi-Detached House</SelectItem>
                    <SelectItem value="Condo">Terrace Duplex</SelectItem>
                    <SelectItem value="Land">Bare Land / Plot</SelectItem>
                    <SelectItem value="Office Space">Commercial Office Space</SelectItem>
                    <SelectItem value="Warehouse">Warehouse / Industrial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* SECTION 2: Location */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">2</span>
              Location & Cadaster
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="state" className="text-xs font-bold">State *</Label>
                <Select value={state} onValueChange={setState}>
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Lagos">Lagos State</SelectItem>
                    <SelectItem value="Abuja (FCT)">Abuja (FCT)</SelectItem>
                    <SelectItem value="Rivers">Rivers State</SelectItem>
                    <SelectItem value="Ogun">Ogun State</SelectItem>
                    <SelectItem value="Oyo">Oyo State</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city" className="text-xs font-bold">City / LGA *</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Lagos, Abuja, Port Harcourt"
                  required
                  className="h-10 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="area" className="text-xs font-bold">Neighborhood / Area *</Label>
                <Input
                  id="area"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g. Lekki Phase 1, Ikoyi, Ikeja GRA, Gwarinpa"
                  required
                  className="h-10 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-xs font-bold">Street Address *</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 14 Admiralty Way, Off Freedom Way"
                required
                className="h-10 rounded-xl"
              />
            </div>
          </div>

          {/* SECTION 3: Pricing & Cost Schedule */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">3</span>
              Pricing & Transparent Cost Breakdown
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-xs font-bold">
                  {listingType === 'RENT' ? 'Annual Rent (₦) *' : 'Purchase Price (₦) *'}
                </Label>
                <Input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 25000000"
                  required
                  className="h-10 rounded-xl font-bold"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceCharge" className="text-xs font-bold">Annual Service Charge (₦)</Label>
                <Input
                  id="serviceCharge"
                  type="number"
                  value={serviceCharge}
                  onChange={(e) => setServiceCharge(e.target.value)}
                  placeholder="e.g. 3500000 (0 if self-serviced)"
                  className="h-10 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="agreementFee" className="text-xs font-bold">Agreement / Legal Fee (₦)</Label>
                <Input
                  id="agreementFee"
                  type="number"
                  value={agreementFee}
                  onChange={(e) => setAgreementFee(e.target.value)}
                  placeholder="e.g. 1250000"
                  className="h-10 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cautionFee" className="text-xs font-bold">Refundable Caution Deposit (₦)</Label>
                <Input
                  id="cautionFee"
                  type="number"
                  value={cautionFee}
                  onChange={(e) => setCautionFee(e.target.value)}
                  placeholder="e.g. 1000000"
                  className="h-10 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: Property Details */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">4</span>
              Property Specs & Features
            </h3>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bedrooms" className="text-xs font-bold">Bedrooms</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                  min={0}
                  className="h-10 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bathrooms" className="text-xs font-bold">Bathrooms</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
                  min={1}
                  className="h-10 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sqft" className="text-xs font-bold">Floor Area (sqm)</Label>
                <Input
                  id="sqft"
                  type="number"
                  value={sqft}
                  onChange={(e) => setSqft(e.target.value)}
                  placeholder="e.g. 350"
                  className="h-10 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold">Verified Features</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                {featuresList.map((feat) => (
                  <div key={feat} className="flex items-center space-x-2 bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                    <Checkbox
                      id={`feat-${feat}`}
                      checked={selectedFeatures.includes(feat)}
                      onCheckedChange={(c) => handleFeatureChange(feat, !!c)}
                    />
                    <label htmlFor={`feat-${feat}`} className="text-xs font-medium text-slate-700 cursor-pointer">
                      {feat}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description" className="text-xs font-bold">Property Description</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateDescription}
                  disabled={isPending}
                  className="text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1 text-blue-600" />
                  {isPending ? 'Generating...' : 'AI Listing Assistant'}
                </Button>
              </div>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Comprehensive description of layout, compound, electrical capacity, and security..."
                rows={4}
                className="rounded-xl resize-none text-xs leading-relaxed"
              />
            </div>
          </div>

          {/* SECTION 5: Media & Photos */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">5</span>
              Media & High-Res Walkthroughs
            </h3>

            <div className="flex gap-2">
              <Input
                placeholder="Paste high-res image URL (e.g. Unsplash or Cloud Storage URL)"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="h-10 rounded-xl text-xs"
              />
              <Button type="button" onClick={handleAddImage} className="bg-blue-600 hover:bg-blue-500 font-bold text-xs rounded-xl shrink-0">
                Add Photo
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              {images.map((img, idx) => (
                <div key={idx} className="relative h-28 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                  <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                  {idx === 0 && (
                    <span className="absolute top-1 left-1 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                      Primary
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 6: Title & Authority Documents (PRD Section 8) */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">6</span>
              Title & Authority Documents
            </h3>
            <p className="text-xs text-slate-500">
              Attach supporting title proof (Governor&apos;s Consent, Survey Plan, C of O, or Letter of Representation). Documents remain protected in secure access-controlled storage.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-bold">Document Type</Label>
                <Select value={docType} onValueChange={(v: any) => setDocType(v)}>
                  <SelectTrigger className="h-10 rounded-xl mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GOVERNORS_CONSENT">Governor&apos;s Consent</SelectItem>
                    <SelectItem value="CERTIFICATE_OF_OCCUPANCY">Certificate of Occupancy (C of O)</SelectItem>
                    <SelectItem value="DEED_OF_ASSIGNMENT">Deed of Assignment</SelectItem>
                    <SelectItem value="SURVEY_PLAN">Registered Survey Plan</SelectItem>
                    <SelectItem value="LETTER_OF_AUTHORITY">Letter of Representation / Authority</SelectItem>
                    <SelectItem value="RECEIPT_OF_PURCHASE">Purchase Receipt / Allocation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-bold">Document Reference Name</Label>
                <Input
                  placeholder="e.g. Lekki_Block14_Consent.pdf"
                  value={docFileName}
                  onChange={(e) => setDocFileName(e.target.value)}
                  className="h-10 rounded-xl mt-1 text-xs"
                />
              </div>

              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={handleAddDocumentRecord}
                  variant="outline"
                  className="w-full h-10 rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50 font-bold text-xs"
                >
                  <FileUp className="h-4 w-4 mr-1.5" />
                  Attach Document
                </Button>
              </div>
            </div>

            {uploadedDocs.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <span className="text-xs font-bold text-slate-700">Attached Compliance Documents ({uploadedDocs.length}):</span>
                {uploadedDocs.map((d, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="font-semibold text-slate-800">{d.name}</span>
                      <span className="text-[10px] text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded font-mono">
                        {d.type}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Pending Audit
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>

        {/* SECTION 7 & 8: Review & Submit Actions */}
        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 p-6 bg-slate-50/50">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => saveOrSubmit(false)}
            className="w-full sm:w-auto rounded-xl border-slate-300 font-bold text-xs h-11"
          >
            <Save className="h-4 w-4 mr-2" />
            Save as Draft
          </Button>

          <Button
            type="button"
            disabled={isSubmitting}
            onClick={() => saveOrSubmit(true)}
            className="w-full sm:w-auto rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs h-11 shadow-md shadow-blue-900/20"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Submitting to verification queue...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit for Compliance & Verification Review
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
