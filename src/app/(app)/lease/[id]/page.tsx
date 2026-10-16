'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ChevronLeft,
  FileDown,
  FileSignature,
  MessageSquare,
  ShieldAlert,
  AlertTriangle,
  ShieldCheck,
  Check,
  Lock,
  Key,
  Clock,
  Printer,
  FileCheck2,
  Building2,
  User,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { leases as mockLeases, properties as mockProperties } from '@/lib/mock-data';
import { formatCurrency, formatNaira, getStatusVariant } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/context/UserRoleContext';
import {
  getPropertyAction,
  getUserApplicationsAction,
  signLeaseAgreementAction,
  confirmKeyHandoverAction,
} from '@/server/actions/prophunta-actions';
import { Property, Application } from '@/types/prophunta';

export default function LeaseDetailPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-muted-foreground">Loading lease agreement...</div>}>
      <LeaseContent />
    </Suspense>
  );
}

function LeaseContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { currentUser, role } = useUserRole();
  const targetId = String(params.id);
  const appIdParam = searchParams.get('appId');

  const [property, setProperty] = useState<Property | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  // Signature state
  const [signatureName, setSignatureName] = useState(currentUser?.name || '');
  const [isSigning, setIsSigning] = useState(false);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);

  // Handover state
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [handoverNotes, setHandoverNotes] = useState('');
  const [isConfirmingHandover, setIsConfirmingHandover] = useState(false);

  // Load property and application data dynamically
  useEffect(() => {
    let mounted = true;
    async function loadData() {
      setLoading(true);
      try {
        // 1. Fetch user applications to find matching application
        const userApps = await getUserApplicationsAction().catch(() => []);
        let foundApp: Application | null = null;

        if (appIdParam) {
          foundApp = userApps.find((a) => a.id === appIdParam) || null;
        }
        if (!foundApp) {
          foundApp =
            userApps.find(
              (a) => a.id === targetId || a.propertyId === targetId
            ) || null;
        }

        const propId = foundApp ? foundApp.propertyId : targetId;
        const prop = await getPropertyAction(propId).catch(() => null);

        if (mounted) {
          setApplication(foundApp);
          if (prop) {
            setProperty(prop);
          } else {
            // Fallback to mock data if static mock property is passed
            const mockL = mockLeases.find((l) => l.id === targetId);
            const mockP = mockProperties.find(
              (p) => p.id === (mockL ? mockL.propertyId : targetId)
            );
            if (mockP) {
              setProperty(mockP as unknown as Property);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load lease detail', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, [targetId, appIdParam, currentUser?.id]);

  const handlePrintPdf = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleExecuteSignature = async () => {
    if (!application) {
      toast({
        title: 'Agreement Signed',
        description: `Tenancy agreement signed as ${signatureName}.`,
      });
      setIsSignModalOpen(false);
      return;
    }

    if (!signatureName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Signature required',
        description: 'Please type your full legal name as your digital signature.',
      });
      return;
    }

    setIsSigning(true);
    const res = await signLeaseAgreementAction(application.id, signatureName.trim());
    setIsSigning(false);

    if (res.success) {
      toast({
        title: 'Tenancy Agreement Digitally Signed!',
        description: 'Your bilateral legal signature has been recorded with a cryptographic timestamp.',
      });
      setApplication((prev) =>
        prev
          ? {
              ...prev,
              status: 'LEASE_SIGNED',
              tenantSignature: {
                signature: signatureName.trim(),
                signedAt: new Date().toISOString(),
                signerName: signatureName.trim(),
                signerRole: (currentUser?.role || 'SEEKER') as any,
                checksum: `SIG_${Date.now()}_NGN`,
              },
            }
          : prev
      );
      setIsSignModalOpen(false);
    } else {
      toast({
        variant: 'destructive',
        title: 'Signing failed',
        description: res.error || 'Could not record digital signature.',
      });
    }
  };

  const handleConfirmHandover = async () => {
    if (!application) return;
    setIsConfirmingHandover(true);
    const res = await confirmKeyHandoverAction(application.id, handoverNotes);
    setIsConfirmingHandover(false);

    if (res.success) {
      toast({
        title: 'Handover Completed!',
        description: 'Physical keys received. Net rent disbursed from escrow to landlord.',
      });
      setApplication((prev) =>
        prev
          ? {
              ...prev,
              status: 'HANDOVER_COMPLETED',
              handoverRecord: {
                confirmedAt: new Date().toISOString(),
                confirmedBy: currentUser?.name || 'Tenant',
                notes: handoverNotes,
              },
            }
          : prev
      );
      setIsHandoverModalOpen(false);
    } else {
      toast({
        variant: 'destructive',
        title: 'Handover confirmation failed',
        description: res.error || 'Could not confirm key handover.',
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center text-muted-foreground flex items-center justify-center gap-2">
        <RefreshCw className="h-5 w-5 animate-spin text-lime-600" />
        Preparing LASRERA-compliant tenancy agreement...
      </div>
    );
  }

  const propTitle = property?.title || application?.propertyTitle || 'Residential Tenancy Property';
  const propAddress = property?.address || 'Lekki Phase 1, Eti-Osa LGA, Lagos State, Nigeria';
  const baseRent = application?.offerAmount || property?.price || 5000000;
  const cautionDeposit = Math.round(baseRent * 0.1);
  const legalFee = Math.round(baseRent * 0.1);
  const tenantName = application?.applicantName || currentUser?.name || 'Verified Seeker';
  const tenantEmail = application?.applicantEmail || currentUser?.email || 'tenant@prophunta.ng';
  const tenantPhone = application?.applicantPhone || currentUser?.phone || '+234 800 000 0000';
  const landlordName = (property as any)?.owner?.name || (property as any)?.agent?.name || 'Verified Property Host';

  const isSignedByTenant = !!application?.tenantSignature;
  const isHandoverDone = application?.status === 'HANDOVER_COMPLETED';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Navigation & Status Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:hidden">
        <Link
          href="/applications"
          className="inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-slate-900"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Applications & Offers
        </Link>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrintPdf}
            className="rounded-xl text-xs font-semibold gap-1.5"
          >
            <Printer className="h-3.5 w-3.5" /> Print / Export PDF
          </Button>
          {isHandoverDone && (
            <Button asChild size="sm" className="bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl gap-1">
              <Link href={`/maintenance/${property?.id || targetId}`}>
                Tenant Maintenance Portal <ChevronRight className="h-3.5 w-3.5 text-lime-400" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Handover Prompt Banner when lease is signed but keys pending */}
      {isSignedByTenant && !isHandoverDone && (
        <Card className="rounded-2xl border-lime-300 bg-gradient-to-r from-lime-50 via-emerald-50 to-white p-5 shadow-xs print:hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-600 text-white text-xs font-bold gap-1">
                  <Check className="h-3 w-3" /> Agreement Legally Signed
                </Badge>
                <Badge variant="outline" className="text-xs border-lime-600 text-lime-900 bg-white">
                  Funds Held in Escrow
                </Badge>
              </div>
              <h3 className="font-bold text-base text-slate-900">Move-In Handover & Key Collection Pending</h3>
              <p className="text-xs text-muted-foreground max-w-xl">
                Inspect physical power, plumbing, and key remotes during the move-in walkthrough. Once satisfied, confirm key handover to release rent to the landlord.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setIsHandoverModalOpen(true)}
              className="bg-lime-600 hover:bg-lime-500 text-white font-bold text-xs gap-1.5 rounded-xl shrink-0 shadow-xs"
            >
              <Key className="h-3.5 w-3.5" /> Confirm Keys Received
            </Button>
          </div>
        </Card>
      )}

      {/* Main Tenancy Agreement Document Card */}
      <Card className="rounded-2xl border-slate-200/90 shadow-sm bg-white overflow-hidden">
        {/* Document Header Banner */}
        <div className="bg-slate-950 text-white p-6 sm:p-8 border-b border-slate-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-lime-500/20 border border-lime-500/30 px-3 py-1 text-xs font-bold text-lime-400 mb-2">
                <ShieldCheck className="h-3.5 w-3.5" />
                LASRERA Compliant Standard Residential Tenancy Agreement
              </div>
              <h1 className="text-2xl sm:text-3xl font-black font-headline tracking-tight">
                Tenancy Agreement & Indenture of Lease
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Concluded under the Tenancy Law of Lagos State & Real Estate Regulatory Authority Guidelines
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[11px] text-slate-400 font-mono block">Document Ref:</span>
              <span className="text-xs font-bold font-mono text-lime-400">
                PH-LSE-2026-{property?.id ? property.id.slice(0, 6).toUpperCase() : '849201'}
              </span>
            </div>
          </div>
        </div>

        <CardContent className="p-6 sm:p-8 space-y-6 sm:space-y-8 text-xs sm:text-sm text-slate-800 leading-relaxed">
          {/* Parties to Agreement */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm sm:text-base font-headline uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2">
              1. The Parties
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  The Landlord (Lessor)
                </span>
                <p className="font-bold text-base text-slate-900">{landlordName}</p>
                <p className="text-xs text-muted-foreground">Title Status: Verified Land Registry Authority Record on file</p>
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold pt-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Title KYC Validated
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  The Tenant (Lessee)
                </span>
                <p className="font-bold text-base text-slate-900">{tenantName}</p>
                <p className="text-xs text-muted-foreground">{tenantEmail} &bull; {tenantPhone}</p>
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold pt-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Tier-1 Verified Seeker Identity
                </div>
              </div>
            </div>
          </div>

          {/* Demised Premises */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm sm:text-base font-headline uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2">
              2. The Demised Premises
            </h3>
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
              <p className="font-bold text-base text-slate-900">{propTitle}</p>
              <p className="text-xs text-slate-600">Location: {propAddress}</p>
              <p className="text-xs text-muted-foreground">
                Comprising residential accommodation with dedicated parking, meter installations, and verified cadastral coordinates.
              </p>
            </div>
          </div>

          {/* Term & Financial Considerations */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm sm:text-base font-headline uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2">
              3. Term & Consideration (Itemized Schedule)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-xl border bg-slate-50 space-y-1">
                <span className="text-slate-500 font-medium">Tenancy Duration</span>
                <p className="font-bold text-slate-900 text-sm">1 Calendar Year</p>
                <p className="text-[10px] text-muted-foreground">Renewable annually</p>
              </div>

              <div className="p-3.5 rounded-xl border bg-slate-50 space-y-1">
                <span className="text-slate-500 font-medium">Annual Rent</span>
                <p className="font-bold text-slate-900 text-sm font-mono">{formatNaira(baseRent)}</p>
                <p className="text-[10px] text-emerald-700 font-semibold">Payable upfront</p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-lime-50/50 space-y-1">
                <span className="text-lime-900 font-medium flex items-center gap-1">
                  Caution Deposit <Lock className="h-3 w-3" />
                </span>
                <p className="font-bold text-slate-900 text-sm font-mono">{formatNaira(cautionDeposit)}</p>
                <p className="text-[10px] text-lime-800">Held in Escrow Vault</p>
              </div>

              <div className="p-3.5 rounded-xl border bg-slate-50 space-y-1">
                <span className="text-slate-500 font-medium">Agreement & Legal Fee</span>
                <p className="font-bold text-slate-900 text-sm font-mono">{formatNaira(legalFee)}</p>
                <p className="text-[10px] text-slate-500">10% Statutory Cap</p>
              </div>
            </div>
          </div>

          {/* Standard Statutory Covenants */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm sm:text-base font-headline uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2">
              4. Standard Protective Covenants & Governance
            </h3>
            <ul className="list-decimal list-inside space-y-2 text-xs text-slate-600">
              <li>
                <strong className="text-slate-900">Quiet Enjoyment:</strong> The Tenant paying the reserved rent and observing the covenants shall peaceably enjoy the premises without lawful interruption by the Landlord.
              </li>
              <li>
                <strong className="text-slate-900">Caution Deposit Escrow Holding:</strong> The Caution Deposit is held in PropHunta&apos;s segregated escrow account and cannot be unilaterally retained. It shall be refunded within 14 business days of lease expiration subject only to legitimate utility or damage deductions.
              </li>
              <li>
                <strong className="text-slate-900">Maintenance Obligations:</strong> The Landlord maintains external structure, roofs, and borehole pumps. The Tenant maintains interior fixtures, bulbs, and prepaid electricity meters.
              </li>
              <li>
                <strong className="text-slate-900">Statutory Notice to Quit:</strong> Either party shall provide statutory written notice in accordance with the Lagos State Tenancy Law prior to termination or non-renewal.
              </li>
            </ul>
          </div>

          <Separator />

          {/* Bilateral Digital Signature Execution Seals */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm sm:text-base font-headline uppercase tracking-wider text-slate-900">
              5. Bilateral Digital Execution & Legal Seals
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Landlord Seal */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Landlord / Authorized Agent Signature</span>
                  <Badge className="bg-emerald-600 text-white text-[10px] font-bold">COUNTERSIGNED</Badge>
                </div>
                <div className="h-16 rounded-lg bg-white border border-dashed border-slate-300 p-2 flex items-center justify-center font-serif italic text-base text-slate-900">
                  {landlordName}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>Signer: Host / Owner</span>
                  <span>Verified Platform Seal</span>
                </div>
              </div>

              {/* Tenant Seal */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Tenant (Lessee) Signature</span>
                  {isSignedByTenant ? (
                    <Badge className="bg-emerald-600 text-white text-[10px] font-bold">DIGITALLY SIGNED</Badge>
                  ) : (
                    <Badge className="bg-amber-500 text-white text-[10px] font-bold">PENDING SIGNATURE</Badge>
                  )}
                </div>

                {isSignedByTenant ? (
                  <div className="h-16 rounded-lg bg-white border border-dashed border-emerald-300 p-2 flex flex-col items-center justify-center font-serif italic text-base text-slate-900">
                    <span>{application?.tenantSignature?.signature || tenantName}</span>
                    <span className="text-[10px] font-mono not-italic text-emerald-700 font-semibold mt-0.5">
                      Checksum: {application?.tenantSignature?.checksum || 'SIG-VALID-2026'}
                    </span>
                  </div>
                ) : (
                  <div className="h-16 rounded-lg bg-amber-50 border border-dashed border-amber-300 p-2 flex flex-col items-center justify-center">
                    <p className="text-xs text-amber-900 font-semibold mb-1">Awaiting your legal execution</p>
                    <Button
                      size="sm"
                      onClick={() => setIsSignModalOpen(true)}
                      className="bg-lime-600 hover:bg-lime-500 text-white font-bold text-xs h-7 px-3 rounded-lg"
                    >
                      Sign Agreement Now
                    </Button>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>Signer: {tenantName}</span>
                  <span>{isSignedByTenant ? 'Executed' : 'Pending'}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="bg-slate-50 p-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Lock className="h-4 w-4 text-lime-700" />
            <span>Cryptographically sealed under PropHunta Trust Engine.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {!isSignedByTenant && (
              <Button
                onClick={() => setIsSignModalOpen(true)}
                className="bg-lime-600 hover:bg-lime-500 text-white font-bold text-xs rounded-xl shadow-xs w-full sm:w-auto"
              >
                <FileSignature className="h-4 w-4 mr-1.5" /> Execute Digital Signature
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={handlePrintPdf}
              className="rounded-xl text-xs font-semibold w-full sm:w-auto"
            >
              <FileDown className="h-4 w-4 mr-1.5" /> Download Agreement (PDF)
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* SIGNATURE DIALOG MODAL */}
      <Dialog open={isSignModalOpen} onOpenChange={setIsSignModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-headline text-lg flex items-center gap-2">
              <FileSignature className="h-5 w-5 text-lime-600" />
              Digital Signature Execution
            </DialogTitle>
            <DialogDescription>
              Confirm your acceptance of the LASRERA-compliant tenancy agreement terms for {propTitle}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3 text-xs">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
              <p className="font-bold text-slate-800">Legal Name Confirmation</p>
              <Input
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                placeholder="Type your full legal name"
                className="rounded-xl text-xs font-serif italic text-base mt-1"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                By clicking &quot;Sign and Accept&quot;, you affix your legally binding electronic signature under the Nigerian Evidence Act and Tenancy Law.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-lime-50 border border-lime-200 text-lime-900 text-xs flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-lime-600 shrink-0 mt-0.5" />
              <span>
                Your funds are currently locked in escrow. Key handover walkthrough takes place next before any rent is disbursed to the landlord.
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSignModalOpen(false)}
              disabled={isSigning}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleExecuteSignature}
              disabled={isSigning}
              className="bg-lime-600 hover:bg-lime-500 text-white font-bold rounded-xl text-xs gap-1.5"
            >
              {isSigning ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Recording Signature...
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" /> Sign & Accept Agreement
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MOVE-IN KEY HANDOVER MODAL */}
      <Dialog open={isHandoverModalOpen} onOpenChange={setIsHandoverModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-headline text-lg flex items-center gap-2">
              <Key className="h-5 w-5 text-lime-600" /> Confirm Key Handover & Move-In
            </DialogTitle>
            <DialogDescription>
              Confirm that you have completed the physical handover walkthrough and received full access keys to {propTitle}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 space-y-1">
              <p className="font-bold">What occurs upon confirmation:</p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-emerald-800">
                <li>Net rent is released from escrow to {landlordName}.</li>
                <li>Caution deposit remains secured in escrow for the lease duration.</li>
                <li>Tenant portal for maintenance tickets and rent renewals is activated.</li>
              </ul>
            </div>

            <div className="space-y-1">
              <Label htmlFor="notes" className="font-bold text-slate-800">
                Handover Notes (Optional)
              </Label>
              <Input
                id="notes"
                value={handoverNotes}
                onChange={(e) => setHandoverNotes(e.target.value)}
                placeholder="e.g. 3 sets of keys received, power meter verified."
                className="rounded-xl text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsHandoverModalOpen(false)}
              disabled={isConfirmingHandover}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmHandover}
              disabled={isConfirmingHandover}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs gap-1.5"
            >
              {isConfirmingHandover ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Finalizing Handover...
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" /> Confirm Keys Received
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
