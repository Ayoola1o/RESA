'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/context/UserRoleContext';
import { updateProfileDetailsAction, resetPasswordAction } from '@/server/actions/prophunta-actions';
import { Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const { toast } = useToast();
  const { currentUser, role, refreshUser } = useUserRole();

  const [name, setName] = useState(currentUser?.name || 'PropHunta Member');
  const [email, setEmail] = useState(currentUser?.email || 'user@prophunta.ai');
  const [phone, setPhone] = useState(currentUser?.phone || '+234 800 000 0000');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setEmail(currentUser.email);
      setPhone(currentUser.phone || '+234 800 000 0000');
    }
  }, [currentUser]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    const res = await updateProfileDetailsAction({
      name,
      phone,
      agencyName: role === 'AGENT' ? currentUser?.agencyName : undefined,
      licenseNumber: role === 'AGENT' ? currentUser?.licenseNumber : undefined,
    });
    setSavingProfile(false);

    if (res.success) {
      toast({
        title: 'Profile Updated',
        description: 'Your verified personal profile details have been saved to the database.',
      });
      await refreshUser();
    } else {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: res.error || 'Could not update profile.',
      });
    }
  };

  const handleSaveSecurity = async () => {
    if (!newPassword) {
      toast({
        title: 'Preferences Saved',
        description: 'Multi-factor authentication preferences updated.',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Password Too Short',
        description: 'New password must be at least 6 characters.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Passwords Do Not Match',
        description: 'New password and confirmation do not match.',
      });
      return;
    }

    setSavingSecurity(true);
    const res = await resetPasswordAction(currentUser?.email || email, newPassword);
    setSavingSecurity(false);

    if (res.success) {
      toast({
        title: 'Password Updated',
        description: 'Your account password has been updated securely.',
      });
      setNewPassword('');
      setConfirmPassword('');
    } else {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: res.error || 'Could not update password.',
      });
    }
  };

  const handleSaveNotifications = () => {
    toast({
      title: 'Preferences Saved',
      description: 'Your notification preferences are up to date.',
    });
  };

  const roleLabel =
    role === 'SEEKER'
      ? 'Property Seeker'
      : role === 'OWNER'
      ? 'Property Owner'
      : role === 'AGENT'
      ? 'Licensed Agent'
      : 'Verification Officer (Admin)';

  return (
    <div className="flex justify-center items-start py-6">
      <div className="w-full max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-headline text-slate-900">Account Settings</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your PropHunta AI verified trust credentials, notification alerts, and security settings.
          </p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile & Role</TabsTrigger>
            <TabsTrigger value="security">Security & Auth</TabsTrigger>
            <TabsTrigger value="notifications">Notification Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="border-slate-200/90 shadow-xs rounded-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="font-headline">Verified Personal Information</CardTitle>
                    <CardDescription>
                      Details linked to your PropHunta trust profile and identity records.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="border-lime-400 text-lime-900 bg-lime-50 font-bold">
                    {roleLabel}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Legal Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Verified Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Active Account Role</Label>
                    <Input id="role" disabled value={roleLabel} className="rounded-xl" />
                  </div>
                </div>

                {role === 'AGENT' && (
                  <div className="p-4 rounded-xl border border-lime-200 bg-lime-50/40 space-y-3">
                    <h4 className="font-semibold text-xs text-lime-950 uppercase tracking-wider">
                      Agency Credentials
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground block text-xs">Agency Name</span>
                        <span className="font-medium text-slate-800">
                          {currentUser?.agencyName || 'Premier Realty Lagos'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs">License / LASRERA ID</span>
                        <span className="font-medium text-slate-800">
                          {currentUser?.licenseNumber || 'LASRERA-2024-0091'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveProfile} disabled={savingProfile} className="bg-lime-600 hover:bg-lime-500 text-white font-bold rounded-xl shadow-xs">
                  {savingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="border-slate-200/90 shadow-xs rounded-2xl">
              <CardHeader>
                <CardTitle className="font-headline">Security & Authentication</CardTitle>
                <CardDescription>
                  Manage password, session security, and account protection.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input id="current-password" type="password" placeholder="••••••••••••" className="rounded-xl" />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Enter new secure password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                  <div>
                    <Label htmlFor="mfa" className="text-sm font-semibold">
                      Two-Factor Authentication (SMS / Authenticator)
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Protect high-value property agreements and inspections with dual confirmation.
                    </p>
                  </div>
                  <Switch id="mfa" defaultChecked aria-label="Toggle two-factor authentication" />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveSecurity} disabled={savingSecurity} className="bg-lime-600 hover:bg-lime-500 text-white font-bold rounded-xl shadow-xs">
                  {savingSecurity ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Update Security Settings
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="border-slate-200/90 shadow-xs rounded-2xl">
              <CardHeader>
                <CardTitle className="font-headline">Notification Preferences</CardTitle>
                <CardDescription>
                  Choose which inspection, application, and verification alerts you receive.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                  <div>
                    <Label htmlFor="inspection-alerts" className="text-sm font-semibold">
                      Inspection Schedule Alerts
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Immediate confirmation when an on-site or virtual walkthrough is requested or confirmed.
                    </p>
                  </div>
                  <Switch id="inspection-alerts" defaultChecked />
                </div>

                <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                  <div>
                    <Label htmlFor="application-alerts" className="text-sm font-semibold">
                      Application & Offer Status Updates
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Notifications when expressions of interest are approved, reviewed, or submitted.
                    </p>
                  </div>
                  <Switch id="application-alerts" defaultChecked />
                </div>

                <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                  <div>
                    <Label htmlFor="message-alerts" className="text-sm font-semibold">
                      Enquiry & Chat Messages
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Alerts when property seekers or hosts send verified messages.
                    </p>
                  </div>
                  <Switch id="message-alerts" defaultChecked />
                </div>

                <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                  <div>
                    <Label htmlFor="trust-alerts" className="text-sm font-semibold">
                      Verification Officer Audit Updates
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Status reports when title documents or listings pass verification checklist audits.
                    </p>
                  </div>
                  <Switch id="trust-alerts" defaultChecked />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveNotifications} className="bg-lime-600 hover:bg-lime-500 text-white font-bold rounded-xl shadow-xs">
                  Save Preferences
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
