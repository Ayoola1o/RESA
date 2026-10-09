'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bath,
  BedDouble,
  Building,
  CheckCircle,
  ChevronLeft,
  Heart,
  MapPin,
  Share,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  FileText,
  MessageSquare,
  Banknote,
  FileSignature,
  AlertTriangle,
  Clock,
  Loader2,
  Info,
  BadgeCheck,
  Check,
  Flag,
  Video,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Property, ReportReason, VerificationSubStatus, User } from '@/types/prophunta';
import { formatCurrency } from '@/lib/utils';
import { useUserRole } from '@/context/UserRoleContext';
import { useToast } from '@/hooks/use-toast';
import {
  requestInspectionAction,
  submitApplicationAction,
  sendEnquiryAction,
  fileReportAction,
} from '@/server/actions/prophunta-actions';

interface PropertyDetailClientProps {
  initialProperty: Property;
  authorizedParty?: User;
}

export default function PropertyDetailClient({ initialProperty, authorizedParty }: PropertyDetailClientProps) {
  const router = useRouter();
  const { userRole, currentUser } = useUserRole();
  const { toast } = useToast();
  const [property] = useState<Property>(initialProperty);

  const [isLiked, setIsLiked] = useState(false);
  const [isTourDialogOpen, setIsTourDialogOpen] = useState(false);
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [isEnquiryDialogOpen, setIsEnquiryDialogOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [tourDate, setTourDate] = useState('');
  const [tourTimeSlot, setTourTimeSlot] = useState('10:00 AM - 12:00 PM');
  const [tourType, setTourType] = useState<'IN_PERSON' | 'VIDEO'>('IN_PERSON');
  const [tourNotes, setTourNotes] = useState('');

  const [offerAmount, setOfferAmount] = useState('');
  const [financingStatus, setFinancingStatus] = useState<'CASH' | 'MORTGAGE_PRE_APPROVED' | 'INSTALLMENT'>('CASH');
  const [occupation, setOccupation] = useState('');
  const [moveInDate, setMoveInDate] = useState('');
  const [occupants, setOccupants] = useState(1);
  const [applicationMessage, setApplicationMessage] = useState('');

  const [enquiryMessage, setEnquiryMessage] = useState('');

  const [reportReason, setReportReason] = useState<ReportReason>('Suspected Scam');
  const [reportDescription, setReportDescription] = useState('');

  // Cost breakdown calculations
  const basePrice = property.price;
  const agreementFee = property.agreementFee || 0;
  const cautionFee = property.cautionFee || 0;
  const serviceCharge = property.serviceCharge || 0;
  const otherCharges = property.otherCharges || 0;
  const totalOutlay = basePrice + agreementFee + cautionFee + serviceCharge + otherCharges;

  // Handlers
  const handleScheduleInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tourDate) {
      toast({ variant: 'destructive', title: 'Please select a date for the inspection.' });
      return;
    }

    setIsSubmitting(true);
    const res = await requestInspectionAction({
      propertyId: property.id,
      preferredDate: tourDate,
      preferredTimeSlot: tourTimeSlot,
      type: tourType,
      notes: tourNotes,
    });
    setIsSubmitting(false);

    if (res.success) {
      toast({
        title: 'Inspection Requested',
        description: `Your inspection for ${tourDate} has been sent to the host for confirmation.`,
      });
      setIsTourDialogOpen(false);
      setTourNotes('');
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to request inspection.' });
    }
  };

  const handleSubmitOfferOrApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const isRental = property.listingType === 'RENT';
    const res = await submitApplicationAction({
      propertyId: property.id,
      type: isRental ? 'RENTAL' : 'SALE_OFFER',
      occupation: isRental ? occupation : undefined,
      moveInDate: isRental ? moveInDate : undefined,
      occupants: isRental ? Number(occupants) : undefined,
      offerAmount: !isRental && offerAmount ? Number(offerAmount) : undefined,
      financingStatus: !isRental ? financingStatus : undefined,
      message: applicationMessage || (isRental ? 'Rental Application' : 'Formal Purchase Offer'),
    });
    setIsSubmitting(false);

    if (res.success) {
      toast({
        title: isRental ? 'Rental Application Submitted' : 'Offer Submitted',
        description: 'Your submission has been recorded and the owner/agent has been notified.',
      });
      setIsOfferDialogOpen(false);
      router.push('/profile?tab=applications');
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to submit.' });
    }
  };

  const handleSendEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enquiryMessage.trim()) return;

    setIsSubmitting(true);
    const res = await sendEnquiryAction(property.id, enquiryMessage.trim());
    setIsSubmitting(false);

    if (res.success) {
      toast({
        title: 'Enquiry Sent',
        description: 'Your enquiry is now active in your Messages.',
      });
      setIsEnquiryDialogOpen(false);
      setEnquiryMessage('');
      router.push('/messages');
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to send message.' });
    }
  };

  const handleReportListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await fileReportAction(property.id, reportReason, reportDescription.trim());
    setIsSubmitting(false);

    if (res.success) {
      toast({
        title: 'Report Submitted',
        description: 'Our verification and trust officers will investigate this property.',
      });
      setIsReportDialogOpen(false);
      setReportDescription('');
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to submit report.' });
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Link copied to clipboard!' });
    } catch {
      toast({ title: 'Could not copy link.' });
    }
  };

  const v = property.verification;

  const renderStatusBadge = (status?: VerificationSubStatus) => {
    switch (status) {
      case 'PASSED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
            <Check className="h-3 w-3" />
            Verified
          </span>
        );
      case 'IN_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
            <Clock className="h-3 w-3" />
            In Review
          </span>
        );
      case 'CHANGES_REQUIRED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md">
            <AlertTriangle className="h-3 w-3" />
            Clarification
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
            <ShieldAlert className="h-3 w-3" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
            Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Navigation Row */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="gap-2 text-slate-600 hover:text-slate-900">
          <Link href="/marketplace">
            <ChevronLeft className="h-4 w-4" />
            Back to Marketplace
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsReportDialogOpen(true)}
            className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
          >
            <Flag className="h-3.5 w-3.5 mr-1.5" />
            Report Listing
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsLiked(!isLiked)}
            className={isLiked ? 'text-red-500 border-red-200' : ''}
          >
            <Heart className={`h-4 w-4 mr-2 ${isLiked ? 'fill-red-500' : ''}`} />
            {isLiked ? 'Saved' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Main Grid: Left Details & Right Action / Verification Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Media Carousel (PRD Section 7: Persistent Media with ordering, captions, video, and primary display) */}
          <div className="relative rounded-2xl overflow-hidden shadow-md bg-slate-900 border border-slate-200/80">
            <Carousel className="w-full">
              <CarouselContent>
                {[...(property.media || [])]
                  .sort((a, b) => (a.isPrimary ? -1 : b.isPrimary ? 1 : (a.order || 0) - (b.order || 0)))
                  .map((med, index) => (
                    <CarouselItem key={med.id || index}>
                      <div className="relative h-[340px] sm:h-[460px] w-full bg-slate-950 flex items-center justify-center">
                        {med.type === 'video' ? (
                          <video
                            src={med.url}
                            controls
                            className="w-full h-full object-contain"
                            poster={property.media.find((m) => m.type === 'image')?.url}
                          />
                        ) : (
                          <Image
                            src={med.url}
                            alt={med.caption || property.title}
                            fill
                            className="object-cover"
                            priority={index === 0}
                          />
                        )}
                        <div className="absolute bottom-3 left-4 flex items-center gap-2 z-10">
                          {med.type === 'video' && (
                            <span className="bg-blue-600/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1 shadow-sm">
                              <Video className="h-3 w-3" /> Video Walkthrough
                            </span>
                          )}
                          {med.caption && (
                            <div className="bg-slate-900/80 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-lg border border-white/10 font-medium">
                              {med.caption}
                            </div>
                          )}
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
              </CarouselContent>
              <CarouselPrevious className="left-4" />
              <CarouselNext className="right-4" />
            </Carousel>

            {/* Badges Overlay */}
            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              <Badge
                className={`text-xs font-bold px-3 py-1 ${
                  property.listingStatus === 'VERIFIED' || property.listingStatus === 'ACTIVE'
                    ? 'bg-emerald-600 text-white'
                    : property.listingStatus === 'UNDER_REVIEW' || property.listingStatus === 'SUBMITTED'
                    ? 'bg-amber-500 text-white'
                    : property.listingStatus === 'CHANGES_REQUIRED'
                    ? 'bg-orange-500 text-white'
                    : property.listingStatus === 'RESERVED'
                    ? 'bg-purple-600 text-white'
                    : property.listingStatus === 'OCCUPIED'
                    ? 'bg-blue-600 text-white'
                    : property.listingStatus === 'SOLD'
                    ? 'bg-slate-800 text-white'
                    : property.listingStatus === 'SUSPENDED' || property.listingStatus === 'REJECTED'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-700 text-white'
                }`}
              >
                {property.listingStatus === 'VERIFIED'
                  ? '✓ Verified Listing'
                  : property.listingStatus === 'ACTIVE'
                  ? '✓ Verified Active'
                  : property.listingStatus === 'UNDER_REVIEW'
                  ? '⏳ Under Verification Review'
                  : property.listingStatus === 'SUBMITTED'
                  ? '📋 Submitted for Review'
                  : property.listingStatus === 'CHANGES_REQUIRED'
                  ? '⚠️ Changes Required'
                  : property.listingStatus === 'RESERVED'
                  ? '🔒 Reserved'
                  : property.listingStatus === 'OCCUPIED'
                  ? '🏠 Occupied'
                  : property.listingStatus === 'SOLD'
                  ? '🤝 Sold'
                  : property.listingStatus === 'SUSPENDED'
                  ? '⛔ Suspended'
                  : property.listingStatus === 'REJECTED'
                  ? '✕ Rejected'
                  : '📝 Draft'}
              </Badge>
              <Badge variant="secondary" className="text-xs font-bold bg-white/90 text-slate-800 shadow-sm">
                {property.listingType === 'RENT' ? 'For Rent' : 'For Sale'}
              </Badge>
              {property.intendedUse && (
                <Badge variant="secondary" className="text-xs font-bold bg-white/90 text-slate-800 shadow-sm">
                  {property.intendedUse}
                </Badge>
              )}
            </div>
          </div>

          {/* Title & Core Overview */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
                  {property.title}
                </h1>
                <p className="flex items-center text-sm font-medium text-slate-500 mt-1.5">
                  <MapPin className="h-4 w-4 mr-1 text-blue-600 shrink-0" />
                  {property.address}, {property.area}, {property.city}, {property.state}
                </p>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <div className="text-2xl sm:text-3xl font-black text-blue-700">
                  {formatCurrency(property.price, property.listingType === 'RENT' ? 'For Rent' : 'For Sale', property.priceUnit)}
                </div>
                <p className="text-xs font-semibold text-slate-400">
                  {property.listingType === 'RENT' ? 'Annual Rent' : 'Purchase Price'}
                </p>
              </div>
            </div>

            {/* Metric Pills */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-2">
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                <BedDouble className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-xs font-bold text-slate-900">{property.bedrooms} Beds</div>
                  <div className="text-[10px] text-slate-400">Bedrooms</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                <Bath className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-xs font-bold text-slate-900">{property.bathrooms} Baths</div>
                  <div className="text-[10px] text-slate-400">Bathrooms</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                <Building className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-xs font-bold text-slate-900">{property.propertyType}</div>
                  <div className="text-[10px] text-slate-400">Building Type</div>
                </div>
              </div>
              {property.sqft && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-xs font-bold text-slate-900">{property.sqft} sqm</div>
                    <div className="text-[10px] text-slate-400">Floor Area</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <Card className="rounded-2xl border-slate-200/80 shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-slate-900">About this Property</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-line">
                {property.description}
              </p>
            </CardContent>
          </Card>

          {/* Verified Features */}
          <Card className="rounded-2xl border-slate-200/80 shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-slate-900">Verified Features & Amenities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {property.features.map((feat) => (
                  <div key={feat} className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Full Cost Breakdown (PRD Section 11) */}
          <Card className="rounded-2xl border-slate-200/80 shadow-xs">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-slate-900">
                  Transparent Cost Breakdown
                </CardTitle>
                <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                  No Hidden Agency Fees
                </span>
              </div>
              <CardDescription className="text-xs text-slate-500">
                Detailed schedule of mandatory outlays, caution reserves, and service fees
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm divide-y divide-slate-100">
                <div className="flex justify-between pt-1">
                  <span className="text-slate-600 font-medium">Base Price ({property.listingType === 'RENT' ? 'Annual Rent' : 'Purchase'})</span>
                  <span className="font-bold text-slate-900">₦{basePrice.toLocaleString()}</span>
                </div>
                {agreementFee > 0 && (
                  <div className="flex justify-between pt-2">
                    <span className="text-slate-600 font-medium">Legal / Agreement Fee</span>
                    <span className="font-bold text-slate-900">₦{agreementFee.toLocaleString()}</span>
                  </div>
                )}
                {cautionFee > 0 && (
                  <div className="flex justify-between pt-2">
                    <span className="text-slate-600 font-medium">Refundable Caution Deposit</span>
                    <span className="font-bold text-slate-900">₦{cautionFee.toLocaleString()}</span>
                  </div>
                )}
                {serviceCharge > 0 && (
                  <div className="flex justify-between pt-2">
                    <span className="text-slate-600 font-medium">Annual Facility Service Charge</span>
                    <span className="font-bold text-slate-900">₦{serviceCharge.toLocaleString()}</span>
                  </div>
                )}
                {otherCharges > 0 && (
                  <div className="flex justify-between pt-2">
                    <span className="text-slate-600 font-medium">Survey / Documentation / Stamp</span>
                    <span className="font-bold text-slate-900">₦{otherCharges.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 text-base font-black text-blue-900 bg-blue-50/60 p-3 rounded-xl border border-blue-100">
                  <span>Total First Outlay</span>
                  <span>₦{totalOutlay.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Verification Panel & CTAs (PRD Section 11 & 12) */}
        <div className="space-y-6">
          {/* Granular Verification Panel */}
          <Card className="rounded-2xl border-blue-900/20 bg-white shadow-lg overflow-hidden">
            <div className="bg-[#0b132b] p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                  <span className="font-black text-sm tracking-wide">Verification Audit</span>
                </div>
                <span className="text-[10px] font-bold bg-blue-600/80 px-2 py-0.5 rounded text-white uppercase">
                  {v?.overallStatus || 'IN_REVIEW'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                Granular compliance parameters audited by PropHunta trust officers.
              </p>
            </div>

            <CardContent className="p-4 space-y-3">
              {/* Granular Checklist Items */}
              <div className="space-y-2.5 divide-y divide-slate-100">
                <div className="flex items-center justify-between pt-1">
                  <div className="text-xs">
                    <p className="font-bold text-slate-800">Owner Identity</p>
                    <p className="text-[10px] text-slate-400">KYC & Government ID verified</p>
                  </div>
                  {renderStatusBadge(v?.ownerIdentityStatus)}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs">
                    <p className="font-bold text-slate-800">Property Location</p>
                    <p className="text-[10px] text-slate-400">Cadastral coordinates authenticated</p>
                  </div>
                  {renderStatusBadge(v?.locationStatus)}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs">
                    <p className="font-bold text-slate-800">Documentation Reviewed</p>
                    <p className="text-[10px] text-slate-400">Governor&apos;s Consent / C of O / Survey</p>
                  </div>
                  {renderStatusBadge(v?.authorityDocumentStatus)}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs">
                    <p className="font-bold text-slate-800">Availability Status</p>
                    <p className="text-[10px] text-slate-400">Confirmed vacant & ready for handover</p>
                  </div>
                  {renderStatusBadge(v?.availabilityStatus)}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs">
                    <p className="font-bold text-slate-800">Media Authentication</p>
                    <p className="text-[10px] text-slate-400">Timestamped photos & verified video</p>
                  </div>
                  {renderStatusBadge(v?.mediaStatus)}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs">
                    <p className="font-bold text-slate-800">Physical Inspection</p>
                    <p className="text-[10px] text-slate-400">Field agent condition score logged</p>
                  </div>
                  {renderStatusBadge(v?.inspectionStatus)}
                </div>
              </div>

              {/* Disclaimer per PRD Section 11 */}
              <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 leading-snug flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Legal Notice:</strong> PropHunta audits public records and documentation reviewed. This constitutes verified due diligence, not an insurance guarantee.
                </span>
              </div>

              {v?.lastVerifiedAt && (
                <div className="text-[10px] text-slate-400 text-center pt-1 font-medium">
                  Last verified on {new Date(v.lastVerifiedAt).toLocaleDateString()}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action CTAs Card */}
          <Card className="rounded-2xl border-slate-200/80 shadow-md bg-white p-5 space-y-3.5">
            <h3 className="text-sm font-bold text-slate-900">Property Next Steps</h3>

            {/* Status-driven guidance banners */}
            {property.listingStatus === 'RESERVED' && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 leading-relaxed">
                <strong>🔒 Listing Reserved:</strong> A holding deposit or preliminary agreement has been recorded for this property. Booking new inspections and submitting offers is currently paused.
              </div>
            )}
            {property.listingStatus === 'OCCUPIED' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
                <strong>🏠 Currently Occupied:</strong> This property is actively leased and unavailable for new tenancy applications.
              </div>
            )}
            {property.listingStatus === 'SOLD' && (
              <div className="p-3 bg-slate-100 border border-slate-300 rounded-xl text-xs text-slate-800 leading-relaxed">
                <strong>🤝 Property Sold:</strong> This property transaction has been concluded.
              </div>
            )}
            {property.listingStatus === 'SUSPENDED' && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 leading-relaxed">
                <strong>⛔ Listing Suspended:</strong> This property has been suspended by compliance officers and cannot be transacted.
              </div>
            )}
            {(property.listingStatus === 'UNDER_REVIEW' || property.listingStatus === 'SUBMITTED') && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                <strong>⏳ In Verification Review:</strong> Title and field checks are underway. Applications will open once approved.
              </div>
            )}
            {(property.listingStatus === 'DRAFT' || property.listingStatus === 'CHANGES_REQUIRED' || property.listingStatus === 'REJECTED') && (
              <div className="p-3 bg-slate-100 border border-slate-300 rounded-xl text-xs text-slate-800 leading-relaxed">
                <strong>📝 Status: {property.listingStatus}</strong> — This listing is not publicly active.
              </div>
            )}

            {/* Request Inspection CTA */}
            <Button
              onClick={() => setIsTourDialogOpen(true)}
              disabled={property.listingStatus !== 'ACTIVE' && property.listingStatus !== 'VERIFIED'}
              className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-blue-900/20"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Inspection (Physical / Video)
            </Button>

            {/* Submit Application / Make Offer CTA */}
            <Button
              onClick={() => setIsOfferDialogOpen(true)}
              disabled={property.listingStatus !== 'ACTIVE' && property.listingStatus !== 'VERIFIED'}
              variant="outline"
              className="w-full h-11 rounded-xl border-blue-300 text-blue-700 hover:bg-blue-50 disabled:opacity-50 font-bold text-xs"
            >
              <Banknote className="h-4 w-4 mr-2" />
              {property.listingType === 'RENT' ? 'Submit Rental Expression of Interest' : 'Submit Purchase Offer'}
            </Button>

            {/* Send Enquiry CTA */}
            <Button
              onClick={() => setIsEnquiryDialogOpen(true)}
              disabled={property.listingStatus === 'SUSPENDED' || property.listingStatus === 'REJECTED'}
              variant="secondary"
              className="w-full h-10 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 font-semibold text-xs"
            >
              <MessageSquare className="h-3.5 w-3.5 mr-2 text-slate-600" />
              Send Direct Enquiry to Authorized Host
            </Button>
          </Card>

          {/* Inspection Information Card (PRD Section 11 & 15) */}
          <Card className="rounded-2xl border-slate-200/80 shadow-xs p-4 space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span>Inspection Information</span>
              </div>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Field-Agent Guided
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-800">Physical On-Site Walkthrough</p>
                  <p className="text-[11px] text-slate-500">Accompanied by a verified PropHunta inspection officer</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                <Video className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-800">Live Virtual Video Tour</p>
                  <p className="text-[11px] text-slate-500">Real-time HD interactive inspection for diaspora & remote buyers</p>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 space-y-1 pt-1">
                <p><strong>Available Days:</strong> Monday – Saturday (9:00 AM – 5:00 PM WAT)</p>
                <p><strong>Notice Period:</strong> Minimum 4 hours advance notice required</p>
                <p><strong>Escrow Guard:</strong> Never pay cash directly to any party at the inspection</p>
              </div>
            </div>

            <Button
              onClick={() => setIsTourDialogOpen(true)}
              disabled={property.listingStatus !== 'ACTIVE' && property.listingStatus !== 'VERIFIED'}
              variant="outline"
              className="w-full h-9 rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50 text-xs font-semibold"
            >
              <Calendar className="h-3.5 w-3.5 mr-1.5" />
              Book Inspection Slot
            </Button>
          </Card>

          {/* Authorized Party Info (PRD Section 11) */}
          <Card className="rounded-2xl border-slate-200/80 shadow-xs p-4 space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <BadgeCheck className="h-4 w-4 text-blue-600" />
                <span>Authorized Party</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {authorizedParty?.verificationStatus === 'VERIFIED' ? 'Verified Partner' : 'Authority Documented'}
              </span>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm shrink-0 border border-blue-200">
                {authorizedParty?.name ? authorizedParty.name.charAt(0).toUpperCase() : (property.authorizedAgentId ? 'A' : 'O')}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {authorizedParty?.name || (property.authorizedAgentId ? 'Authorized Licensed Broker' : 'Direct Property Title Holder')}
                </p>
                <p className="text-[11px] text-slate-500">
                  {authorizedParty?.role === 'AGENT' || property.authorizedAgentId
                    ? `Licensed Agent${authorizedParty?.agencyName ? ` • ${authorizedParty.agencyName}` : ''}`
                    : 'Registered Landlord / Owner'}
                </p>
                {authorizedParty?.licenseNumber && (
                  <p className="text-[10px] text-slate-400 font-mono">
                    Lic: {authorizedParty.licenseNumber}
                  </p>
                )}
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed pt-1 border-t border-slate-100">
              Identity documents and representation mandates have been audited by PropHunta trust compliance. Direct communications are secured.
            </p>

            <Button
              onClick={() => setIsEnquiryDialogOpen(true)}
              disabled={property.listingStatus === 'SUSPENDED' || property.listingStatus === 'REJECTED'}
              variant="secondary"
              className="w-full h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
            >
              <MessageSquare className="h-3 w-3 mr-1.5" />
              Contact Representative
            </Button>
          </Card>

          {/* Report Listing Trigger Card (PRD Section 11 & 18) */}
          <div className="p-3.5 rounded-2xl border border-rose-100 bg-rose-50/50 flex items-center justify-between gap-3">
            <div className="text-xs">
              <p className="font-bold text-slate-800">Notice a discrepancy?</p>
              <p className="text-[11px] text-slate-500">Report false claims or suspicious requests</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsReportDialogOpen(true)}
              className="text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-100 hover:text-rose-700 shrink-0 rounded-xl"
            >
              <Flag className="h-3.5 w-3.5 mr-1" />
              Report Listing
            </Button>
          </div>
        </div>
      </div>

      {/* --- DIALOG 1: SCHEDULE INSPECTION (PRD Section 15) --- */}
      <Dialog open={isTourDialogOpen} onOpenChange={setIsTourDialogOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Schedule Property Inspection</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Request a physical or live video walkthrough for {property.title}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleScheduleInspection} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="tourDate" className="text-xs font-bold">Preferred Inspection Date</Label>
              <Input
                id="tourDate"
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={tourDate}
                onChange={(e) => setTourDate(e.target.value)}
                required
                className="rounded-xl h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Preferred Time Window</Label>
              <Select value={tourTimeSlot} onValueChange={setTourTimeSlot}>
                <SelectTrigger className="rounded-xl h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM (Morning)</SelectItem>
                  <SelectItem value="12:00 PM - 02:00 PM">12:00 PM - 02:00 PM (Midday)</SelectItem>
                  <SelectItem value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM (Afternoon)</SelectItem>
                  <SelectItem value="04:00 PM - 06:00 PM">04:00 PM - 06:00 PM (Late Afternoon)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Inspection Format</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTourType('IN_PERSON')}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                    tourType === 'IN_PERSON'
                      ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  Physical On-Site Visit
                </button>
                <button
                  type="button"
                  onClick={() => setTourType('VIDEO')}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                    tourType === 'VIDEO'
                      ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  Live Video Walkthrough
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tourNotes" className="text-xs font-bold">Inspection Notes (Optional)</Label>
              <Textarea
                id="tourNotes"
                placeholder="e.g. Bringing independent surveyor to verify boundaries; check generator capacity..."
                value={tourNotes}
                onChange={(e) => setTourNotes(e.target.value)}
                rows={2}
                className="rounded-xl resize-none text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsTourDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-500 font-bold">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Confirm Inspection Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- DIALOG 2: SUBMIT APPLICATION / MAKE OFFER (PRD Section 17) --- */}
      <Dialog open={isOfferDialogOpen} onOpenChange={setIsOfferDialogOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {property.listingType === 'RENT' ? 'Rental Expression of Interest' : 'Submit Purchase Offer'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Formal submission to the property owner and authorized agent
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitOfferOrApplication} className="space-y-3.5 pt-2">
            {property.listingType === 'RENT' ? (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="occupation" className="text-xs font-bold">Occupation / Employer</Label>
                  <Input
                    id="occupation"
                    placeholder="e.g. Senior Partner, Advisory firm"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    required
                    className="rounded-xl h-10"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="moveInDate" className="text-xs font-bold">Desired Move-in Date</Label>
                    <Input
                      id="moveInDate"
                      type="date"
                      value={moveInDate}
                      onChange={(e) => setMoveInDate(e.target.value)}
                      required
                      className="rounded-xl h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="occupants" className="text-xs font-bold">Total Occupants</Label>
                    <Input
                      id="occupants"
                      type="number"
                      min={1}
                      max={20}
                      value={occupants}
                      onChange={(e) => setOccupants(Number(e.target.value))}
                      required
                      className="rounded-xl h-10"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="offerAmount" className="text-xs font-bold">Proposed Offer Amount (₦)</Label>
                  <Input
                    id="offerAmount"
                    type="number"
                    placeholder={`Guide price: ₦${property.price.toLocaleString()}`}
                    value={offerAmount}
                    onChange={(e) => setOfferAmount(e.target.value)}
                    required
                    className="rounded-xl h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Financing Status</Label>
                  <Select
                    value={financingStatus}
                    onValueChange={(v: any) => setFinancingStatus(v)}
                  >
                    <SelectTrigger className="rounded-xl h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Full Cash Settlement</SelectItem>
                      <SelectItem value="MORTGAGE_PRE_APPROVED">Bank Mortgage Pre-Approved</SelectItem>
                      <SelectItem value="INSTALLMENT">Milestone / Installment Plan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="applicationMessage" className="text-xs font-bold">Message & Terms</Label>
              <Textarea
                id="applicationMessage"
                placeholder="Include special clauses, lease term preference, or payment schedule..."
                value={applicationMessage}
                onChange={(e) => setApplicationMessage(e.target.value)}
                rows={3}
                required
                className="rounded-xl resize-none text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsOfferDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-500 font-bold">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Submit Application
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- DIALOG 3: DIRECT ENQUIRY (PRD Section 16) --- */}
      <Dialog open={isEnquiryDialogOpen} onOpenChange={setIsEnquiryDialogOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Send Property Enquiry</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Message will be tied directly to this property record and logged for compliance
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSendEnquiry} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="enquiryMessage" className="text-xs font-bold">Your Question or Enquiry</Label>
              <Textarea
                id="enquiryMessage"
                placeholder="e.g. Is the service charge payable quarterly or annually? Are pets permitted?"
                value={enquiryMessage}
                onChange={(e) => setEnquiryMessage(e.target.value)}
                rows={4}
                required
                className="rounded-xl resize-none text-xs"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEnquiryDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-500 font-bold">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Send Message
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- DIALOG 4: REPORT LISTING (PRD Section 18) --- */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-rose-700 flex items-center gap-2">
              <Flag className="h-5 w-5" />
              Report this Listing
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Trust & safety reports are audited by PropHunta verification officers within 2 hours
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleReportListing} className="space-y-3.5 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Reason for Report</Label>
              <Select value={reportReason} onValueChange={(r: any) => setReportReason(r)}>
                <SelectTrigger className="rounded-xl h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Suspected Scam">Suspected Scam</SelectItem>
                  <SelectItem value="Incorrect Information">Incorrect Information</SelectItem>
                  <SelectItem value="Unavailable Property">Unavailable Property</SelectItem>
                  <SelectItem value="Unauthorized Representation">Unauthorized Representation</SelectItem>
                  <SelectItem value="Duplicate Listing">Duplicate Listing</SelectItem>
                  <SelectItem value="Misleading Price/Photos">Misleading Price/Photos</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reportDescription" className="text-xs font-bold">Detailed Observations</Label>
              <Textarea
                id="reportDescription"
                placeholder="Provide specific reasons, links, or conflicting information..."
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                rows={3}
                required
                className="rounded-xl resize-none text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsReportDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-rose-600 hover:bg-rose-500 text-white font-bold">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Submit Report to Trust Officer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
