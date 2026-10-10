'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  User,
  Building,
  Briefcase,
  Shield,
  Loader2,
  RefreshCw,
  Sparkles,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUserRole } from '@/context/UserRoleContext';
import SeekerDashboard from '@/components/dashboards/SeekerDashboard';
import OwnerDashboard from '@/components/dashboards/OwnerDashboard';
import AgentDashboard from '@/components/dashboards/AgentDashboard';
import AdminDashboard from '@/components/dashboards/AdminDashboard';
import {
  Property,
  InspectionRequest,
  Application,
  PropertyEnquiry,
  ListingReport,
  AuditLog,
  User as UserType,
  UserRole,
} from '@/types/prophunta';
import {
  getPropertiesAction,
  getUserPropertiesAction,
  getUserInspectionsAction,
  getUserApplicationsAction,
  getUserEnquiriesAction,
  getReportsAction,
  getAuditLogsAction,
  getUsersAction,
} from '@/server/actions/prophunta-actions';

export default function DashboardPage() {
  const { currentUser, role, userRole, setUserRole, isLoading: isRoleLoading } = useUserRole();
  const activeRole = role || userRole || 'SEEKER';
  const userName = currentUser?.name ? currentUser.name.split(' ')[0] : 'User';

  const [properties, setProperties] = useState<Property[]>([]);
  const [userProperties, setUserProperties] = useState<Property[]>([]);
  const [inspections, setInspections] = useState<InspectionRequest[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [enquiries, setEnquiries] = useState<PropertyEnquiry[]>([]);
  const [reports, setReports] = useState<ListingReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const [allProps, userProps, inspData, appData, enqData] = await Promise.all([
          getPropertiesAction().catch(() => []),
          getUserPropertiesAction().catch(() => []),
          getUserInspectionsAction().catch(() => []),
          getUserApplicationsAction().catch(() => []),
          getUserEnquiriesAction().catch(() => []),
        ]);

        if (!mounted) return;
        setProperties(allProps || []);
        setUserProperties(userProps || []);
        setInspections(inspData || []);
        setApplications(appData || []);
        setEnquiries(enqData || []);

        // Load admin specific data if admin role
        if (activeRole === 'ADMIN') {
          const [repData, auditData, usersData] = await Promise.all([
            getReportsAction().catch(() => []),
            getAuditLogsAction().catch(() => []),
            getUsersAction().catch(() => []),
          ]);
          if (mounted) {
            setReports(repData || []);
            setAuditLogs(auditData || []);
            setAllUsers(usersData || []);
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, [currentUser?.id, activeRole]);

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Interactive Role Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 sm:p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
            Active Dashboard:
          </span>
          <Badge className="bg-lime-600 hover:bg-lime-500 text-white font-bold text-[11px]">
            {activeRole === 'SEEKER'
              ? 'Property Seeker'
              : activeRole === 'OWNER'
              ? 'Property Owner / Landlord'
              : activeRole === 'AGENT'
              ? 'Real Estate Agent'
              : 'Compliance Administrator'}
          </Badge>
        </div>

        {/* Role Switcher Controls for demo & role navigation */}
        <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl text-xs overflow-x-auto">
          <button
            type="button"
            onClick={() => setUserRole('SEEKER')}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeRole === 'SEEKER'
                ? 'bg-white text-lime-950 shadow-xs ring-1 ring-lime-500/30'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="h-3.5 w-3.5 text-lime-700" />
            Seeker
          </button>

          <button
            type="button"
            onClick={() => setUserRole('OWNER')}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeRole === 'OWNER'
                ? 'bg-white text-lime-950 shadow-xs ring-1 ring-lime-500/30'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="h-3.5 w-3.5 text-lime-700" />
            Owner
          </button>

          <button
            type="button"
            onClick={() => setUserRole('AGENT')}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeRole === 'AGENT'
                ? 'bg-white text-lime-950 shadow-xs ring-1 ring-lime-500/30'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="h-3.5 w-3.5 text-lime-700" />
            Agent
          </button>

          <button
            type="button"
            onClick={() => setUserRole('ADMIN')}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeRole === 'ADMIN'
                ? 'bg-white text-lime-950 shadow-xs ring-1 ring-lime-500/30'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="h-3.5 w-3.5 text-lime-700" />
            Admin
          </button>
        </div>
      </div>

      {/* 2. Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-lime-600" />
          <span className="text-xs font-semibold text-slate-600">Loading your verified dashboard...</span>
        </div>
      ) : (
        /* 3. Strictly Differentiated Role Dashboards */
        <>
          {activeRole === 'SEEKER' && (
            <SeekerDashboard
              properties={properties}
              inspections={inspections}
              applications={applications}
              enquiries={enquiries}
              userName={userName}
            />
          )}

          {activeRole === 'OWNER' && (
            <OwnerDashboard
              properties={userProperties.length > 0 ? userProperties : properties.slice(0, 3)}
              inspections={inspections}
              applications={applications}
              enquiries={enquiries}
              userName={userName}
            />
          )}

          {activeRole === 'AGENT' && (
            <AgentDashboard
              properties={userProperties.length > 0 ? userProperties : properties}
              inspections={inspections}
              applications={applications}
              enquiries={enquiries}
              userName={userName}
            />
          )}

          {activeRole === 'ADMIN' && (
            <AdminDashboard
              properties={properties}
              reports={reports}
              inspections={inspections}
              auditLogs={auditLogs}
              users={allUsers}
              userName={userName}
            />
          )}
        </>
      )}
    </div>
  );
}
