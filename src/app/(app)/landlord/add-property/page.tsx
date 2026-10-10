'use client';

import Link from 'next/link';
import { useState, useTransition, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ChevronLeft,
  ChevronRight,
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
  MapPin,
  Banknote,
  ClipboardCheck,
  Lock,
  AlertCircle,
  Eye,
  Info,
} from 'lucide-react';
import { getGeneratedDescription } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import {
  createPropertyDraftAction,
  updatePropertyDraftAction,
  getPropertyDraftAction,
  submitPropertyAction,
  addPropertyDocumentAction,
  uploadPropertyDocumentAction,
  deletePropertyDocumentAction,
  uploadPropertyMediaAction,
  addPropertyMediaRecordAction,
} from '@/server/actions/prophunta-actions';
import { PropertyType, ListingType, DocumentType, MediaType, Property } from '@/types/prophunta';

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

export interface DocumentFormItem {
  id: string;
  type: DocumentType;
  fileName: string;
  file?: File;
  sizeBytes?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CHANGES_REQUIRED';
}

const WIZARD_STEPS = [
  { id: 1, title: 'Basic Information', icon: Building2, subtitle: 'Title & property classification' },
  { id: 2, title: 'Location', icon: MapPin, subtitle: 'Cadastral & geographic coords' },
  { id: 3, title: 'Pricing & Charges', icon: Banknote, subtitle: 'Transparent breakdown' },
  { id: 4, title: 'Property Details', icon: Sparkles, subtitle: 'Specs, use & amenities' },
  { id: 5, title: 'Media Walkthroughs', icon: ImageIcon, subtitle: 'Photos & 4K video tours' },
  { id: 6, title: 'Confidential Documents', icon: FileText, subtitle: 'Title & authority proof' },
  { id: 7, title: 'Review & Checklist', icon: ClipboardCheck, subtitle: 'Compliance preview' },
  { id: 8, title: 'Submission', icon: Send, subtitle: 'Queue for verification audit' },
];

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

const DOCUMENT_CATEGORIES: { type: DocumentType; label: string; desc: string }[] = [
  { type: 'GOVERNORS_CONSENT', label: "Governor's Consent", desc: 'Highest state title approval in Nigeria' },
  { type: 'CERTIFICATE_OF_OCCUPANCY', label: 'Certificate of Occupancy (C of O)', desc: 'Official 99-year state land title' },
  { type: 'DEED_OF_ASSIGNMENT', label: 'Deed of Assignment', desc: 'Transfer of ownership agreement' },
  { type: 'SURVEY_PLAN', label: 'Registered Survey Plan', desc: 'Cadastral beacons and boundary demarcation' },
  { type: 'LETTER_OF_AUTHORITY', label: 'Letter of Authority to Sell/Lease', desc: 'Mandate letter if acting as authorized agent' },
  { type: 'RECEIPT_OF_PURCHASE', label: 'Receipt of Purchase / Deed of Gift', desc: 'Proof of commercial consideration' },
  { type: 'UTILITY_BILL', label: 'Estate / Utility Bill', desc: 'Recent proof of occupation / ownership' },
  { type: 'NATIONAL_ID', label: 'Government-Issued ID of Owner', desc: 'NIN / International Passport / Drivers License' },
  { type: 'OTHER', label: 'Other Verification Evidence', desc: 'Building approvals, soil test, or tax receipts' },
];

function AddPropertyWizard() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editDraftId = searchParams.get('draftId') || searchParams.get('id');

  const [currentStep, setCurrentStep] = useState(1);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(editDraftId || null);
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDraft, setIsLoadingDraft] = useState(!!editDraftId);

  // Step 1: Basic Information
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType>('Apartment');
  const [listingType, setListingType] = useState<ListingType>('RENT');

  // Step 2: Location
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('Lagos');
  const [state, setState] = useState('Lagos');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  // Step 3: Pricing & Charges
  const [price, setPrice] = useState('');
  const [priceUnit, setPriceUnit] = useState('/year');
  const [agreementFee, setAgreementFee] = useState('');
  const [cautionFee, setCautionFee] = useState('');
  const [serviceCharge, setServiceCharge] = useState('');
  const [otherCharges, setOtherCharges] = useState('');

  // Step 4: Property Details
  const [bedrooms, setBedrooms] = useState('3');
  const [bathrooms, setBathrooms] = useState('3');
  const [sqft, setSqft] = useState('');
  const [intendedUse, setIntendedUse] = useState<'Residential' | 'Commercial' | 'Mixed'>('Residential');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
    '24/7 Dedicated Power',
    'Gated Estate Security',
  ]);

  // Step 5: Media
  const [mediaList, setMediaList] = useState<MediaFormItem[]>([
    {
      id: 'med_demo_1',
      url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      type: 'image',
      caption: 'Main Facade & Front Entrance',
      isPrimary: true,
      order: 1,
      uploadStatus: 'COMPLETED',
      fileName: 'facade_elevation.jpg',
    },
  ]);
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newMediaCaption, setNewMediaCaption] = useState('');
  const [newMediaType, setNewMediaType] = useState<MediaType>('image');

  // Step 6: Documents
  const [docType, setDocType] = useState<DocumentType>('GOVERNORS_CONSENT');
  const [docFileName, setDocFileName] = useState('');
  const [docList, setDocList] = useState<DocumentFormItem[]>([
    {
      id: 'doc_pre_1',
      type: 'GOVERNORS_CONSENT',
      fileName: 'Governors_Consent_Ref_LND-2024-0012.pdf',
      status: 'PENDING',
      sizeBytes: 1024 * 1024 * 2.4,
    },
  ]);

  // Load existing draft if editing
  useEffect(() => {
    if (!editDraftId) return;

    async function fetchDraft() {
      setIsLoadingDraft(true);
      try {
        const res = await getPropertyDraftAction(editDraftId!);
        if (res.success && res.property) {
          const p = res.property;
          setTitle(p.title);
          setDescription(p.description);
          setPropertyType(p.propertyType);
          setListingType(p.listingType);
          setAddress(p.address);
          setArea(p.area);
          setCity(p.city);
          setState(p.state);
          if (p.latitude) setLatitude(p.latitude.toString());
          if (p.longitude) setLongitude(p.longitude.toString());
          setPrice(p.price.toString());
          if (p.priceUnit) setPriceUnit(p.priceUnit);
          if (p.agreementFee) setAgreementFee(p.agreementFee.toString());
          if (p.cautionFee) setCautionFee(p.cautionFee.toString());
          if (p.serviceCharge) setServiceCharge(p.serviceCharge.toString());
          if (p.otherCharges) setOtherCharges(p.otherCharges.toString());
          setBedrooms(p.bedrooms.toString());
          setBathrooms(p.bathrooms.toString());
          if (p.sqft) setSqft(p.sqft.toString());
          if (p.intendedUse) setIntendedUse(p.intendedUse);
          if (p.features) setSelectedFeatures(p.features);

          if (p.media && p.media.length > 0) {
            setMediaList(
              p.media.map((m) => ({
                id: m.id,
                url: m.url,
                type: m.type,
                caption: m.caption || '',
                isPrimary: m.isPrimary,
                order: m.order,
                uploadStatus: 'COMPLETED',
                fileName: m.fileName,
              }))
            );
          }

          if (p.documents && p.documents.length > 0) {
            setDocList(
              p.documents.map((d) => ({
                id: d.id,
                type: d.documentType,
                fileName: d.fileName,
                sizeBytes: d.sizeBytes,
                status: d.status,
              }))
            );
          }

          toast({
            title: 'Draft Loaded',
            description: `Editing existing draft: "${p.title}" (${p.listingStatus})`,
          });
        }
      } catch (err) {
        console.error('Failed to load draft:', err);
      } finally {
        setIsLoadingDraft(false);
      }
    }

    fetchDraft();
  }, [editDraftId]);

  // Media Handlers
  const handleMediaFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: MediaFormItem[] = Array.from(files).map((file, idx) => {
      const isVid = file.type.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(file.name);
      return {
        id: `med_up_${Date.now()}_${idx}`,
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
      description: `${files.length} file(s) attached. Stored securely on draft save/submit.`,
    });
  };

  const handleAddUrlMedia = () => {
    if (!newMediaUrl.trim()) return;
    const isVid = newMediaType === 'video' || /\.(mp4|webm|mov)$/i.test(newMediaUrl);
    const item: MediaFormItem = {
      id: `med_url_${Date.now()}`,
      url: newMediaUrl.trim(),
      type: isVid ? 'video' : 'image',
      caption: newMediaCaption.trim() || (isVid ? 'Video Walkthrough' : 'Property View'),
      isPrimary: mediaList.length === 0,
      order: mediaList.length + 1,
      uploadStatus: 'COMPLETED',
      fileName: isVid ? 'walkthrough.mp4' : 'photo.jpg',
    };
    setMediaList((prev) => [...prev, item]);
    setNewMediaUrl('');
    setNewMediaCaption('');
  };

  const handleSetPrimaryMedia = (id: string) => {
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
    updated.forEach((m, idx) => (m.order = idx + 1));
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

  // Document Handlers
  const handleDocFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newDocs: DocumentFormItem[] = Array.from(files).map((file, idx) => ({
      id: `doc_up_${Date.now()}_${idx}`,
      type: docType,
      fileName: file.name,
      file,
      sizeBytes: file.size,
      status: 'PENDING',
    }));

    setDocList((prev) => [...prev, ...newDocs]);
    toast({
      title: 'Title Document Attached',
      description: `${files.length} document(s) queued for access-controlled vault upload.`,
    });
  };

  const handleAddManualDoc = () => {
    if (!docFileName.trim()) return;
    const newDoc: DocumentFormItem = {
      id: `doc_manual_${Date.now()}`,
      type: docType,
      fileName: docFileName.trim(),
      status: 'PENDING',
      sizeBytes: 1024 * 500,
    };
    setDocList((prev) => [...prev, newDoc]);
    setDocFileName('');
    toast({
      title: 'Document Record Attached',
      description: `${docType} registered for verification officer review.`,
    });
  };

  const handleDeleteDoc = async (id: string) => {
    setDocList((prev) => prev.filter((d) => d.id !== id));
    if (activeDraftId && !id.startsWith('doc_up_') && !id.startsWith('doc_manual_')) {
      await deletePropertyDocumentAction(activeDraftId, id);
    }
  };

  // AI Description Generator
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
          description: typeof res.error === 'string' ? res.error : 'Please fill title, type, and location fields first.',
        });
      } else if (res.data) {
        setDescription(res.data.description);
        toast({
          title: 'Description Generated! ✨',
          description: 'AI description customized for verified Nigerian market positioning.',
        });
      }
    });
  };

  // Validation
  const validateStep = (stepNum: number): boolean => {
    if (stepNum === 1) {
      if (!title.trim()) {
        toast({ variant: 'destructive', title: 'Title Required', description: 'Please provide a descriptive listing title.' });
        return false;
      }
    } else if (stepNum === 2) {
      if (!address.trim() || !area.trim() || !city.trim() || !state.trim()) {
        toast({ variant: 'destructive', title: 'Location Incomplete', description: 'Please fill address, area/neighborhood, city, and state.' });
        return false;
      }
    } else if (stepNum === 3) {
      if (!price || Number(price) <= 0) {
        toast({ variant: 'destructive', title: 'Price Required', description: 'Please enter a valid listing price.' });
        return false;
      }
    }
    return true;
  };

  const goToNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 8));
    }
  };

  const goToPrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Save Draft (listingStatus: 'DRAFT') or Submit for Review (listingStatus: 'SUBMITTED')
  const handleSaveOrSubmit = async (shouldSubmitForReview: boolean) => {
    if (!title.trim() || !price || !address.trim() || !area.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing Required Fields',
        description: 'Please ensure Title, Location, and Price are provided before saving.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let targetPropertyId = activeDraftId;

      const payload = {
        title: title.trim(),
        propertyType,
        listingType,
        description: description.trim() || `${title} in ${area}, ${city}. Verified trust listing.`,
        state,
        city,
        area: area.trim(),
        address: address.trim(),
        latitude: latitude ? Number(latitude) : undefined,
        longitude: longitude ? Number(longitude) : undefined,
        price: Number(price),
        priceUnit,
        agreementFee: agreementFee ? Number(agreementFee) : 0,
        cautionFee: cautionFee ? Number(cautionFee) : 0,
        serviceCharge: serviceCharge ? Number(serviceCharge) : 0,
        otherCharges: otherCharges ? Number(otherCharges) : 0,
        bedrooms: Number(bedrooms) || 1,
        bathrooms: Number(bathrooms) || 1,
        sqft: sqft ? Number(sqft) : undefined,
        features: selectedFeatures,
        intendedUse,
        images: mediaList.length > 0 ? mediaList.map((m) => m.url) : [
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
        ],
      };

      if (targetPropertyId) {
        // Update existing draft
        const res = await updatePropertyDraftAction(targetPropertyId, payload);
        if (!res.success) {
          throw new Error(res.error || 'Failed to update draft');
        }
      } else {
        // Create new draft
        const res = await createPropertyDraftAction(payload);
        if (!res.success || !res.property) {
          throw new Error(res.error || 'Failed to create draft');
        }
        targetPropertyId = res.property.id;
        setActiveDraftId(targetPropertyId);
      }

      // Upload and persist media items
      if (targetPropertyId) {
        for (const m of mediaList) {
          if (m.file) {
            const formData = new FormData();
            formData.append('propertyId', targetPropertyId);
            formData.append('file', m.file);
            if (m.caption) formData.append('caption', m.caption);
            formData.append('isPrimary', m.isPrimary ? 'true' : 'false');
            await uploadPropertyMediaAction(formData);
          } else if (m.type === 'video' || m.caption || m.isPrimary) {
            await addPropertyMediaRecordAction(targetPropertyId, {
              url: m.url,
              type: m.type,
              caption: m.caption,
              isPrimary: m.isPrimary,
              fileName: m.fileName,
            });
          }
        }

        // Upload and attach confidential documents to access-controlled storage
        for (const d of docList) {
          if (d.file) {
            const formData = new FormData();
            formData.append('propertyId', targetPropertyId);
            formData.append('documentType', d.type);
            formData.append('file', d.file);
            await uploadPropertyDocumentAction(formData);
          } else if (d.id.startsWith('doc_pre_') || d.id.startsWith('doc_manual_')) {
            await addPropertyDocumentAction(targetPropertyId, d.type, d.fileName);
          }
        }

        if (shouldSubmitForReview) {
          // Transitions listingStatus strictly to SUBMITTED (does NOT mark VERIFIED)
          await submitPropertyAction(targetPropertyId);
          toast({
            title: 'Submitted for Verification Review! 🛡️',
            description: `"${title}" has been submitted. Status changed to SUBMITTED. A verification officer will review the title documents.`,
          });
          router.push(`/property/${targetPropertyId}`);
        } else {
          toast({
            title: 'Draft Saved! 📝',
            description: `"${title}" saved as DRAFT. You can continue editing or submit for review anytime.`,
          });
          router.push('/profile?tab=properties');
        }
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Operation Failed',
        description: err.message || 'An error occurred while saving property.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculatedTotalUpfront =
    (Number(price) || 0) +
    (Number(agreementFee) || 0) +
    (Number(cautionFee) || 0) +
    (Number(serviceCharge) || 0) +
    (Number(otherCharges) || 0);

  if (isLoadingDraft) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Loading Property Draft...</h2>
        <p className="text-sm text-slate-500 mt-1">Retrieving draft details from secure storage.</p>
      </div>
    );
  }

  const currentStepObj = WIZARD_STEPS.find((s) => s.id === currentStep)!;
  const StepIcon = currentStepObj.icon;
  const progressPercent = Math.round((currentStep / 8) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href="/profile?tab=properties"
          className="flex items-center text-sm font-semibold text-slate-500 hover:text-slate-900"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Listings
        </Link>
        <div className="flex items-center gap-2">
          {activeDraftId && (
            <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-700">
              Draft ID: {activeDraftId}
            </Badge>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleSaveOrSubmit(false)}
            disabled={isSubmitting}
            className="rounded-xl border-slate-300 font-semibold text-xs"
          >
            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Save className="h-3.5 w-3.5 mr-1.5 text-slate-600" />}
            Save Draft
          </Button>
        </div>
      </div>

      {/* Wizard Progress Header */}
      <Card className="rounded-2xl border-slate-200/90 shadow-sm bg-white overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
                <StepIcon className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                  Step {currentStep} of 8
                </span>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  {currentStepObj.title}
                </h1>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-500">{progressPercent}% Completed</span>
            </div>
          </div>
          <Progress value={progressPercent} className="h-2 rounded-full bg-slate-100" />
        </div>

        {/* 8-Step Navigation Pill Strip (Mobile horizontal touch scroll + Desktop grid) */}
        <div className="flex sm:grid sm:grid-cols-8 overflow-x-auto no-scrollbar divide-x divide-slate-100 bg-slate-50/60 text-center">
          {WIZARD_STEPS.map((s) => {
            const isDone = s.id < currentStep;
            const isCurrent = s.id === currentStep;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  if (s.id < currentStep || validateStep(currentStep)) {
                    setCurrentStep(s.id);
                  }
                }}
                className={`py-2.5 px-3 sm:px-1 text-[11px] font-bold transition-colors whitespace-nowrap shrink-0 sm:shrink ${
                  isCurrent
                    ? 'bg-blue-600 text-white'
                    : isDone
                    ? 'text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100/70'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div>{s.id}. {s.title}</div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* WIZARD STEP CONTENT */}

      {/* STEP 1: BASIC INFORMATION */}
      {currentStep === 1 && (
        <Card className="rounded-2xl border-slate-200/90 shadow-sm bg-white p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900">Listing Headline & Classification</h2>
            <p className="text-xs text-slate-500 mt-0.5">Specify clear, factual details to maximize discovery and trust score.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-xs font-bold">
                Property Title <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g. Luxury 4-Bedroom Waterfront Penthouse with Private Jetty"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="rounded-xl h-11"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Property Type</Label>
                <Select value={propertyType} onValueChange={(v: any) => setPropertyType(v)}>
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Apartment">Apartment / Flat</SelectItem>
                    <SelectItem value="House">Detached / Semi-Detached House</SelectItem>
                    <SelectItem value="Condo">Penthouse / Condominium</SelectItem>
                    <SelectItem value="Land">Commercial / Residential Land</SelectItem>
                    <SelectItem value="Single Room">Self-Contained Room</SelectItem>
                    <SelectItem value="Office Space">Commercial Office Space</SelectItem>
                    <SelectItem value="Warehouse">Industrial Warehouse</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Listing Type</Label>
                <Select value={listingType} onValueChange={(v: any) => setListingType(v)}>
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RENT">For Rent (Annual / Lease)</SelectItem>
                    <SelectItem value="SALE">For Sale (Direct Purchase)</SelectItem>
                    <SelectItem value="LEASE">Commercial Long-Term Lease</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="description" className="text-xs font-bold">
                  Description & Context
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerateDescription}
                  disabled={isPending}
                  className="h-8 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1 text-blue-600" />
                  {isPending ? 'Generating...' : 'AI Generate Description'}
                </Button>
              </div>
              <Textarea
                id="description"
                placeholder="Highlight power autonomy, clean water treatment, security access, road network, and title clarity..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="rounded-xl resize-none text-xs leading-relaxed"
              />
            </div>
          </div>
        </Card>
      )}

      {/* STEP 2: LOCATION */}
      {currentStep === 2 && (
        <Card className="rounded-2xl border-slate-200/90 shadow-sm bg-white p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900">Geographic & Cadastral Location</h2>
            <p className="text-xs text-slate-500 mt-0.5">Exact coordinates allow verification officers to authenticate ground surveys.</p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="state" className="text-xs font-bold">State <span className="text-rose-500">*</span></Label>
                <Select value={state} onValueChange={setState}>
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Lagos">Lagos State</SelectItem>
                    <SelectItem value="Abuja">Abuja (FCT)</SelectItem>
                    <SelectItem value="Ogun">Ogun State</SelectItem>
                    <SelectItem value="Rivers">Rivers State</SelectItem>
                    <SelectItem value="Oyo">Oyo State</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="city" className="text-xs font-bold">City / LGA <span className="text-rose-500">*</span></Label>
                <Input
                  id="city"
                  placeholder="e.g. Eti-Osa / Lekki / Ikeja"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  className="rounded-xl h-11"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="area" className="text-xs font-bold">Area / Neighborhood <span className="text-rose-500">*</span></Label>
              <Input
                id="area"
                placeholder="e.g. Ikoyi, Victoria Island, Banana Island, Lekki Phase 1"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                required
                className="rounded-xl h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-xs font-bold">Physical Street Address <span className="text-rose-500">*</span></Label>
              <Input
                id="address"
                placeholder="e.g. 14 Admiralty Way, Lekki Phase 1"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                className="rounded-xl h-11"
              />
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-800">Cadastral Coordinates (Optional / Highly Recommended)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="latitude" className="text-[11px] font-semibold text-slate-600">Latitude</Label>
                  <Input
                    id="latitude"
                    placeholder="e.g. 6.4485"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="rounded-xl h-10 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="longitude" className="text-[11px] font-semibold text-slate-600">Longitude</Label>
                  <Input
                    id="longitude"
                    placeholder="e.g. 3.4735"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="rounded-xl h-10 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* STEP 3: PRICING & CHARGES */}
      {currentStep === 3 && (
        <Card className="rounded-2xl border-slate-200/90 shadow-sm bg-white p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900">Pricing & Granular Fee Breakdown</h2>
            <p className="text-xs text-slate-500 mt-0.5">PropHunta AI mandates zero hidden fees. All surcharges must be itemized upfront.</p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="price" className="text-xs font-bold">
                  Base Price (₦) <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="e.g. 25000000"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  className="rounded-xl h-11 text-base font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Billing Cycle</Label>
                <Select value={priceUnit} onValueChange={setPriceUnit}>
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="/year">Per Annum (/year)</SelectItem>
                    <SelectItem value="/month">Per Month (/month)</SelectItem>
                    <SelectItem value="total">Total Outright (Sale)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="agreementFee" className="text-xs font-bold">Legal & Documentation Fee (₦)</Label>
                <Input
                  id="agreementFee"
                  type="number"
                  placeholder="e.g. 2500000 (standard 10%)"
                  value={agreementFee}
                  onChange={(e) => setAgreementFee(e.target.value)}
                  className="rounded-xl h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cautionFee" className="text-xs font-bold">Refundable Caution Deposit (₦)</Label>
                <Input
                  id="cautionFee"
                  type="number"
                  placeholder="e.g. 1500000"
                  value={cautionFee}
                  onChange={(e) => setCautionFee(e.target.value)}
                  className="rounded-xl h-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="serviceCharge" className="text-xs font-bold">Annual Service Charge (₦)</Label>
                <Input
                  id="serviceCharge"
                  type="number"
                  placeholder="e.g. 3500000 (covers 24/7 diesel, security)"
                  value={serviceCharge}
                  onChange={(e) => setServiceCharge(e.target.value)}
                  className="rounded-xl h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="otherCharges" className="text-xs font-bold">Other Surcharges (₦)</Label>
                <Input
                  id="otherCharges"
                  type="number"
                  placeholder="e.g. 500000 (Estate development levy)"
                  value={otherCharges}
                  onChange={(e) => setOtherCharges(e.target.value)}
                  className="rounded-xl h-10"
                />
              </div>
            </div>

            {/* Total Calculation Card */}
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-blue-950">Total Initial Outlay for Seeker</span>
                <p className="text-[11px] text-blue-700">All fees itemized transparently on public offer</p>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-blue-900">
                  ₦{calculatedTotalUpfront.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* STEP 4: PROPERTY DETAILS */}
      {currentStep === 4 && (
        <Card className="rounded-2xl border-slate-200/90 shadow-sm bg-white p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900">Specifications & Amenities</h2>
            <p className="text-xs text-slate-500 mt-0.5">Physical attributes audited during the on-site verification inspection.</p>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Bedrooms</Label>
                <Select value={bedrooms} onValueChange={setBedrooms}>
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <SelectItem key={n} value={n.toString()}>{n} Bed</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Bathrooms</Label>
                <Select value={bathrooms} onValueChange={setBathrooms}>
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <SelectItem key={n} value={n.toString()}>{n} Bath</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sqft" className="text-xs font-bold">Floor Area (sqm)</Label>
                <Input
                  id="sqft"
                  type="number"
                  placeholder="e.g. 450"
                  value={sqft}
                  onChange={(e) => setSqft(e.target.value)}
                  className="rounded-xl h-11"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Intended Use</Label>
                <Select value={intendedUse} onValueChange={(v: any) => setIntendedUse(v)}>
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Residential">Residential</SelectItem>
                    <SelectItem value="Commercial">Commercial</SelectItem>
                    <SelectItem value="Mixed">Mixed-Use</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Label className="text-xs font-bold">Verified Features & Infrastructure</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {featuresList.map((f) => {
                  const isChecked = selectedFeatures.includes(f);
                  return (
                    <div
                      key={f}
                      className={`flex items-center space-x-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
                        isChecked ? 'border-blue-600 bg-blue-50/60 font-medium' : 'border-slate-200 hover:border-slate-300'
                      }`}
                      onClick={() => {
                        setSelectedFeatures((prev) =>
                          isChecked ? prev.filter((item) => item !== f) : [...prev, f]
                        );
                      }}
                    >
                      <Checkbox
                        id={`feat-${f}`}
                        checked={isChecked}
                        onCheckedChange={() => {}}
                      />
                      <label htmlFor={`feat-${f}`} className="text-xs cursor-pointer select-none">
                        {f}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* STEP 5: MEDIA WALKTHROUGHS */}
      {currentStep === 5 && (
        <Card className="rounded-2xl border-slate-200/90 shadow-sm bg-white p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Photos & Video Tours (PRD Section 7)</h2>
              <p className="text-xs text-slate-500 mt-0.5">Support for high-res images, drone video tours, ordering, captions, and primary thumbnail.</p>
            </div>
            <Badge variant="secondary" className="text-xs">
              {mediaList.length} Media Item{mediaList.length === 1 ? '' : 's'}
            </Badge>
          </div>

          <div className="space-y-4">
            {/* File Upload Drop Area */}
            <div className="border-2 border-dashed border-blue-200 rounded-2xl p-6 text-center bg-blue-50/30 hover:bg-blue-50/60 transition-colors">
              <UploadCloud className="h-10 w-10 text-blue-600 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800">Upload Media Files</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                Attach property photos (.jpg, .png) and virtual video tours (.mp4, .mov, .webm).
              </p>
              <label className="cursor-pointer inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm">
                <FileUp className="h-4 w-4" />
                Browse Device Storage
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={handleMediaFileUpload}
                />
              </label>
            </div>

            {/* Quick URL Adder */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row gap-2">
              <Select value={newMediaType} onValueChange={(v: any) => setNewMediaType(v)}>
                <SelectTrigger className="w-full sm:w-[120px] rounded-xl h-10 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Photo URL</SelectItem>
                  <SelectItem value="video">Video URL</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="https://..."
                value={newMediaUrl}
                onChange={(e) => setNewMediaUrl(e.target.value)}
                className="rounded-xl h-10 text-xs flex-1"
              />
              <Input
                placeholder="Optional Caption"
                value={newMediaCaption}
                onChange={(e) => setNewMediaCaption(e.target.value)}
                className="rounded-xl h-10 text-xs sm:w-[200px]"
              />
              <Button type="button" onClick={handleAddUrlMedia} className="rounded-xl h-10 text-xs font-bold">
                <Plus className="h-3.5 w-3.5 mr-1" /> Add
              </Button>
            </div>

            {/* Media Items List */}
            <div className="space-y-3">
              {mediaList.map((m, idx) => (
                <div
                  key={m.id}
                  className={`flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                    m.isPrimary ? 'border-emerald-500 bg-emerald-50/30 shadow-xs' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative h-14 w-20 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                      {m.type === 'video' ? (
                        <div className="h-full w-full flex items-center justify-center bg-slate-900 text-white">
                          <Video className="h-6 w-6 text-blue-400" />
                        </div>
                      ) : (
                        <img src={m.url} alt={m.caption} className="h-full w-full object-cover" />
                      )}
                      <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] font-bold px-1 rounded">
                        #{m.order}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Input
                          value={m.caption}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMediaList((prev) => prev.map((item) => (item.id === m.id ? { ...item, caption: val } : item)));
                          }}
                          placeholder="Caption..."
                          className="h-7 text-xs rounded-lg font-medium"
                        />
                        {m.isPrimary && (
                          <Badge className="bg-emerald-600 text-white text-[10px] shrink-0">
                            Primary
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 truncate">
                        {m.type === 'video' ? '🎬 Walkthrough Video' : '🖼️ High-Res Image'} • {m.fileName || m.url}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetPrimaryMedia(m.id)}
                      disabled={m.isPrimary}
                      className="h-8 text-[11px] font-semibold text-emerald-700"
                    >
                      <Star className="h-3.5 w-3.5 mr-1" />
                      {m.isPrimary ? 'Primary' : 'Make Primary'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={idx === 0}
                      onClick={() => handleMoveMedia(idx, 'up')}
                      className="h-8 w-8 text-slate-500"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={idx === mediaList.length - 1}
                      onClick={() => handleMoveMedia(idx, 'down')}
                      className="h-8 w-8 text-slate-500"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteMedia(m.id)}
                      className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* STEP 6: CONFIDENTIAL DOCUMENTS */}
      {currentStep === 6 && (
        <Card className="rounded-2xl border-slate-200/90 shadow-sm bg-white p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-emerald-600" />
                <h2 className="text-lg font-bold text-slate-900">Title & Due Diligence Documents (PRD Section 8)</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Stored in access-controlled confidential vault. Only Verification Officers and authorized owners can inspect.
              </p>
            </div>
            <Badge variant="secondary" className="text-xs">
              {docList.length} Document{docList.length === 1 ? '' : 's'}
            </Badge>
          </div>

          <div className="space-y-4">
            {/* Confidentiality Alert Box */}
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Confidential Access-Controlled Storage:</strong> Title documents are NOT public by default.
                Uploading registered Governor&apos;s Consent or Survey Plan establishes verified legal ownership for rapid audit approval.
              </div>
            </div>

            {/* Document Uploader */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="sm:col-span-1 space-y-1.5">
                <Label className="text-xs font-bold">Document Category</Label>
                <Select value={docType} onValueChange={(v: any) => setDocType(v)}>
                  <SelectTrigger className="rounded-xl h-10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_CATEGORIES.map((c) => (
                      <SelectItem key={c.type} value={c.type}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs font-bold">Attach File (.pdf, .jpg, .png)</Label>
                <div className="flex gap-2">
                  <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold text-xs px-3 py-2 rounded-xl">
                    <FileUp className="h-3.5 w-3.5 text-blue-600" />
                    Browse Confidential File
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      className="hidden"
                      onChange={handleDocFileUpload}
                    />
                  </label>
                  <Input
                    placeholder="or File Reference..."
                    value={docFileName}
                    onChange={(e) => setDocFileName(e.target.value)}
                    className="h-10 text-xs rounded-xl flex-1"
                  />
                  <Button type="button" onClick={handleAddManualDoc} className="rounded-xl h-10 text-xs font-bold">
                    Add
                  </Button>
                </div>
              </div>
            </div>

            {/* Document List */}
            <div className="space-y-3">
              {docList.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">{d.fileName}</span>
                        <Badge variant="outline" className="text-[10px] font-semibold border-blue-200 text-blue-700">
                          {d.type}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {d.sizeBytes ? `${(d.sizeBytes / (1024 * 1024)).toFixed(1)} MB` : 'Secured in Vault'} • Access: Confidential
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteDoc(d.id)}
                      className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* STEP 7: REVIEW & PREVIEW */}
      {currentStep === 7 && (
        <Card className="rounded-2xl border-slate-200/90 shadow-sm bg-white p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900">Review & Pre-Submission Audit</h2>
            <p className="text-xs text-slate-500 mt-0.5">Verify that all required data and legal titles are attached before queue submission.</p>
          </div>

          <div className="space-y-5">
            {/* Overview Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <Badge className="bg-blue-600 text-white text-[10px] mb-1.5">{propertyType} • {listingType}</Badge>
                  <h3 className="text-base font-bold text-slate-900">{title || 'Untitled Property'}</h3>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center">
                    <MapPin className="h-3.5 w-3.5 mr-1 text-blue-600" />
                    {address}, {area}, {city}, {state}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-slate-900">
                    ₦{Number(price || 0).toLocaleString()} {priceUnit}
                  </span>
                  <p className="text-[10px] text-slate-400">Total Upfront: ₦{calculatedTotalUpfront.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Audit Checklist Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
                <span className="text-xs font-bold text-slate-700">Specifications</span>
                <p className="text-xs text-slate-900 font-semibold">{bedrooms} Bed • {bathrooms} Bath • {sqft || '—'} sqm</p>
                <p className="text-[10px] text-slate-400">{selectedFeatures.length} amenities registered</p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
                <span className="text-xs font-bold text-slate-700">Media Gallery</span>
                <p className="text-xs text-slate-900 font-semibold">{mediaList.length} Items attached</p>
                <p className="text-[10px] text-slate-400">Primary thumbnail selected</p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
                <span className="text-xs font-bold text-slate-700">Title Documentation</span>
                <p className="text-xs text-slate-900 font-semibold">{docList.length} Confidential docs</p>
                <p className="text-[10px] text-emerald-600 font-medium">Ready for officer review</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* STEP 8: SUBMIT */}
      {currentStep === 8 && (
        <Card className="rounded-2xl border-slate-200/90 shadow-sm bg-white p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900">Submission & Verification Protocol</h2>
            <p className="text-xs text-slate-500 mt-0.5">Choose between keeping this property in draft or dispatching to the audit queue.</p>
          </div>

          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-blue-600" />
                <h3 className="text-sm font-bold text-blue-950">Verification Queue Routing Protocol</h3>
              </div>
              <ul className="text-xs text-blue-900 space-y-2 list-disc list-inside">
                <li>Submitting changes listing status strictly to <strong>SUBMITTED</strong>.</li>
                <li>The listing is <strong>NOT automatically verified</strong> upon submission.</li>
                <li>An administrator or certified verification officer will review legal title proofs, conduct GIS cross-checks, and dispatch field inspectors.</li>
                <li>Once all 6 audit parameters pass, the property will receive the Verified Trust Badge and go live on the public marketplace.</li>
              </ul>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSaveOrSubmit(false)}
                disabled={isSubmitting}
                className="h-14 rounded-2xl border-slate-300 font-bold text-sm text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save as Draft (Status: DRAFT)
              </Button>

              <Button
                type="button"
                onClick={() => handleSaveOrSubmit(true)}
                disabled={isSubmitting}
                className="h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 font-bold text-sm text-white shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Submit for Review (Status: SUBMITTED)
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Bottom Step Navigation Controls */}
      <div className="flex items-center justify-between gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={goToPrevStep}
          disabled={currentStep === 1 || isSubmitting}
          className="rounded-xl px-3 sm:px-5 h-11 text-xs font-bold border-slate-300 min-w-0"
        >
          <ChevronLeft className="h-4 w-4 mr-0.5 sm:mr-1 shrink-0" />
          <span className="truncate">Previous<span className="hidden xs:inline"> Step</span></span>
        </Button>

        {currentStep < 8 ? (
          <Button
            type="button"
            onClick={goToNextStep}
            className="rounded-xl px-4 sm:px-6 h-11 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm min-w-0"
          >
            <span className="truncate">Next<span className="hidden xs:inline"> Step</span></span>
            <ChevronRight className="h-4 w-4 ml-0.5 sm:ml-1 shrink-0" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => handleSaveOrSubmit(true)}
            disabled={isSubmitting}
            className="rounded-xl px-4 sm:px-6 h-11 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-900/20 min-w-0"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1 shrink-0" /> : <Send className="h-4 w-4 mr-1 shrink-0" />}
            <span className="truncate">Submit<span className="hidden xs:inline"> for Review</span></span>
          </Button>
        )}
      </div>
    </div>
  );
}

export default function AddPropertyPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto py-20 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800">Loading Add Property Flow...</h2>
        </div>
      }
    >
      <AddPropertyWizard />
    </Suspense>
  );
}
