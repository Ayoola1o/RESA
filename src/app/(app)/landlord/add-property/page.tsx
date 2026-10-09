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
  Image as ImageIcon,
  Video,
  Trash2,
  ArrowUp,
  ArrowDown,
  Star,
  UploadCloud,
  Plus,
} from 'lucide-react';
import { getGeneratedDescription } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import {
  createPropertyDraftAction,
  submitPropertyAction,
  addPropertyDocumentAction,
  uploadPropertyMediaAction,
  addPropertyMediaRecordAction,
} from '@/server/actions/prophunta-actions';
import { PropertyType, ListingType, DocumentType, MediaType } from '@/types/prophunta';

export interface MediaFormItem {
  id: string;
  url: string;
  type: MediaType;
  caption: string;
  isPrimary: boolean;
  order: number;
  uploadStatus: 'COMPLETED' | 'UPLOADING' | 'FAILED';
  file?: File;
  fileName?: string;
}

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

  // Media items (PRD Section 7)
  const [mediaList, setMediaList] = useState<MediaFormItem[]>([
    {
      id: 'med_demo_1',
      url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      type: 'image',
      caption: 'Main Entrance & Facade Elevation',
      isPrimary: true,
      order: 1,
      uploadStatus: 'COMPLETED',
      fileName: 'front_elevation.jpg',
    },
  ]);
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newMediaCaption, setNewMediaCaption] = useState('');
  const [newMediaType, setNewMediaType] = useState<MediaType>('image');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: MediaFormItem[] = Array.from(files).map((file, idx) => {
      const isVid = file.type.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(file.name);
      return {
        id: `med_upload_${Date.now()}_${idx}`,
        url: URL.createObjectURL(file),
        type: isVid ? 'video' : 'image',
        caption: file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
        isPrimary: mediaList.length === 0 && idx === 0,
        order: mediaList.length + idx + 1,
        uploadStatus: 'COMPLETED',
        file,
        fileName: file.name,
      };
    });

    setMediaList((prev) => [...prev, ...newItems]);
    toast({
      title: 'Media Queued',
      description: `${files.length} file(s) attached. Stored securely on submission.`,
    });
  };

  const handleAddUrlMedia = () => {
    if (!newMediaUrl.trim()) return;
    const isVid = newMediaType === 'video' || /\.(mp4|webm|mov)$/i.test(newMediaUrl);
    const item: MediaFormItem = {
      id: `med_url_${Date.now()}`,
      url: newMediaUrl.trim(),
      type: isVid ? 'video' : 'image',
      caption: newMediaCaption.trim() || (isVid ? 'Video Walkthrough' : 'Property Visual'),
      isPrimary: mediaList.length === 0,
      order: mediaList.length + 1,
      uploadStatus: 'COMPLETED',
      fileName: isVid ? 'walkthrough.mp4' : 'photo.jpg',
    };
    setMediaList((prev) => [...prev, item]);
    setNewMediaUrl('');
    setNewMediaCaption('');
  };

  const handleSetPrimary = (id: string) => {
    setMediaList((prev) =>
      prev.map((m) => ({
        ...m,
        isPrimary: m.id === id,
      }))
    );
  };

  const handleMoveMedia = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= mediaList.length) return;

    const updated = [...mediaList];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;

    updated.forEach((m, idx) => {
      m.order = idx + 1;
    });

    setMediaList(updated);
  };

  const handleDeleteMedia = (id: string) => {
    setMediaList((prev) => {
      const filtered = prev.filter((m) => m.id !== id);
      if (filtered.length > 0 && !filtered.some((m) => m.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return filtered.map((m, idx) => ({ ...m, order: idx + 1 }));
    });
  };

  const handleCaptionChange = (id: string, caption: string) => {
    setMediaList((prev) =>
      prev.map((m) => (m.id === id ? { ...m, caption } : m))
    );
  };

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
      images: mediaList.length > 0 ? mediaList.map((m) => m.url) : [
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

    // Upload & persist real media files to secure storage
    for (const m of mediaList) {
      if (m.file) {
        const formData = new FormData();
        formData.append('propertyId', createdProp.id);
        formData.append('file', m.file);
        if (m.caption) formData.append('caption', m.caption);
        formData.append('isPrimary', m.isPrimary ? 'true' : 'false');
        await uploadPropertyMediaAction(formData);
      } else if (m.type === 'video' || m.caption || m.isPrimary) {
        await addPropertyMediaRecordAction(createdProp.id, {
          url: m.url,
          type: m.type,
          caption: m.caption,
          isPrimary: m.isPrimary,
          fileName: m.fileName,
        });
      }
    }

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

          {/* SECTION 5: Media & Photos (PRD Section 7) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">5</span>
                Property Media & High-Res Walkthroughs
              </h3>
              <span className="text-xs font-semibold text-slate-500">
                {mediaList.length} media item{mediaList.length === 1 ? '' : 's'} attached
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Upload high-resolution property photos or video walkthroughs. Reorder items, assign captions, and select the primary showcase visual.
            </p>

            {/* Upload Area & URL Input */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
              {/* Option A: Secure File Upload */}
              <div className="flex flex-col justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <div>
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900 mb-1">
                    <UploadCloud className="h-4 w-4 text-blue-600" />
                    Upload Image or Video Walkthrough
                  </div>
                  <p className="text-[11px] text-slate-500 mb-3">
                    Supported: JPG, PNG, WEBP, MP4, WEBM (Up to 100MB). Stored in secure local repository.
                  </p>
                </div>
                <div>
                  <label className="cursor-pointer inline-flex items-center justify-center w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-4 shadow-sm transition">
                    <FileUp className="h-4 w-4 mr-2" />
                    <span>Choose Media Files</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              </div>

              {/* Option B: Verified URL / CDN Link */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <ImageIcon className="h-4 w-4 text-slate-600" />
                    Or Link Verified Media URL
                  </span>
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setNewMediaType('image')}
                      className={`px-2 py-0.5 rounded ${newMediaType === 'image' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600'}`}
                    >
                      Image
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewMediaType('video')}
                      className={`px-2 py-0.5 rounded ${newMediaType === 'video' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600'}`}
                    >
                      Video
                    </button>
                  </div>
                </div>

                <Input
                  placeholder="https://... image or video URL"
                  value={newMediaUrl}
                  onChange={(e) => setNewMediaUrl(e.target.value)}
                  className="h-9 rounded-lg text-xs"
                />

                <div className="flex gap-2">
                  <Input
                    placeholder="Caption (e.g. Master Bedroom, Kitchen Island)"
                    value={newMediaCaption}
                    onChange={(e) => setNewMediaCaption(e.target.value)}
                    className="h-9 rounded-lg text-xs"
                  />
                  <Button
                    type="button"
                    onClick={handleAddUrlMedia}
                    size="sm"
                    className="h-9 rounded-lg text-xs shrink-0 bg-slate-900 hover:bg-slate-800 text-white font-semibold"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>

            {/* Media Items List with Ordering, Primary Flag, Captions, and Delete */}
            <div className="space-y-3 pt-2">
              <Label className="text-xs font-bold text-slate-700">Attached Media & Sequence ({mediaList.length})</Label>

              {mediaList.length === 0 ? (
                <div className="p-6 text-center border border-dashed rounded-xl text-slate-400 text-xs">
                  No media added yet. Upload at least one high-res photo.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {mediaList.map((m, idx) => (
                    <div
                      key={m.id}
                      className={`p-3 rounded-xl border transition shadow-2xs flex flex-col gap-2.5 ${
                        m.isPrimary ? 'border-blue-500 bg-blue-50/20 ring-1 ring-blue-500/30' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Thumbnail */}
                        <div className="relative h-20 w-24 rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-slate-200">
                          {m.type === 'video' ? (
                            <div className="h-full w-full flex items-center justify-center bg-slate-900 text-white">
                              <Video className="h-6 w-6 text-blue-400" />
                            </div>
                          ) : (
                            <img src={m.url} alt={m.caption} className="h-full w-full object-cover" />
                          )}
                          <span className="absolute bottom-1 right-1 text-[9px] font-bold px-1 rounded bg-black/70 text-white uppercase">
                            #{m.order}
                          </span>
                        </div>

                        {/* Details & Status */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                              {m.type}
                            </span>
                            {m.isPrimary ? (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded bg-blue-600 text-white">
                                <Star className="h-2.5 w-2.5 fill-white" /> Primary
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSetPrimary(m.id)}
                                className="text-[10px] font-semibold text-slate-500 hover:text-blue-600 transition"
                              >
                                Set Primary
                              </button>
                            )}
                          </div>

                          <Input
                            value={m.caption}
                            onChange={(e) => handleCaptionChange(m.id, e.target.value)}
                            placeholder="Add photo caption..."
                            className="h-7 text-xs px-2 rounded-md"
                          />

                          <div className="flex items-center justify-between pt-0.5">
                            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Ready
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveMedia(idx, 'up')}
                                className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 text-slate-600"
                                title="Move up"
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === mediaList.length - 1}
                                onClick={() => handleMoveMedia(idx, 'down')}
                                className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 text-slate-600"
                                title="Move down"
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteMedia(m.id)}
                                className="p-1 rounded hover:bg-red-50 text-red-600 ml-1"
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
