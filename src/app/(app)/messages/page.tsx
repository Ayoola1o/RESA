'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Search, MessageSquare, ShieldCheck, Clock, Building2, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getUserEnquiriesAction } from '@/server/actions/prophunta-actions';
import { useUserRole } from '@/context/UserRoleContext';
import { PropertyEnquiry } from '@/types/prophunta';

export default function MessagesPage() {
  const { currentUser } = useUserRole();
  const [searchQuery, setSearchQuery] = useState('');
  const [enquiries, setEnquiries] = useState<PropertyEnquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getUserEnquiriesAction().then((data) => {
      if (mounted) {
        setEnquiries(data || []);
        setLoading(false);
      }
    }).catch(() => {
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const filteredEnquiries = useMemo(() => {
    if (!searchQuery.trim()) return enquiries;
    const q = searchQuery.toLowerCase();
    return enquiries.filter((e) =>
      e.propertyTitle?.toLowerCase().includes(q) ||
      e.seekerName?.toLowerCase().includes(q) ||
      e.hostName?.toLowerCase().includes(q) ||
      e.lastMessageText?.toLowerCase().includes(q)
    );
  }, [enquiries, searchQuery]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-headline">Property Enquiries & Messages</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Direct verified communications regarding properties, inspections, and negotiations.
        </p>
      </div>

      <Card className="h-full flex flex-col shadow-xs border-slate-200/90 rounded-2xl">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-lg font-headline flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-lime-700" /> Active Conversations
            </CardTitle>
            <span className="text-xs text-muted-foreground">
              {filteredEnquiries.length} {filteredEnquiries.length === 1 ? 'thread' : 'threads'}
            </span>
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by property, participant name, or message content..."
              className="pl-8 text-xs sm:text-sm rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              Loading verified conversations...
            </div>
          ) : filteredEnquiries.length === 0 ? (
            <div className="p-12 text-center">
              <Building2 className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900">No conversations found</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
                {searchQuery
                  ? `No conversations match "${searchQuery}".`
                  : 'You have not sent or received any property enquiries yet. Browse properties on Marketplace to initiate an enquiry.'}
              </p>
              {!searchQuery && (
                <Link
                  href="/marketplace"
                  className="inline-block mt-4 text-sm font-semibold text-lime-700 hover:underline"
                >
                  Browse Marketplace &rarr;
                </Link>
              )}
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-slate-100">
              {filteredEnquiries.map((conv) => {
                const isSeeker = currentUser?.id === conv.seekerId;
                const otherPartyName = isSeeker ? conv.hostName : conv.seekerName;
                const otherPartyRole = isSeeker ? 'Owner / Agent' : 'Property Seeker';
                const unread = isSeeker
                  ? conv.unreadCountForSeeker > 0
                  : conv.unreadCountForHost > 0;

                const formattedTime = conv.lastMessageAt
                  ? new Date(conv.lastMessageAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '';

                return (
                  <Link href={`/messages/${conv.id}`} key={conv.id} className="block">
                    <div
                      className={cn(
                        'flex items-center gap-3.5 sm:gap-4 p-3.5 sm:p-4 cursor-pointer hover:bg-slate-50 transition-colors',
                        unread && 'bg-lime-50/40'
                      )}
                    >
                      <Avatar className="h-11 w-11 sm:h-12 sm:w-12 border border-slate-200">
                        {conv.propertyImage ? (
                          <AvatarImage src={conv.propertyImage} alt={conv.propertyTitle} />
                        ) : null}
                        <AvatarFallback className="bg-lime-100 text-lime-900 font-bold border border-lime-300">
                          {otherPartyName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 truncate">
                            <span className="font-semibold text-sm text-slate-900 truncate">
                              {otherPartyName}
                            </span>
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 border-slate-300">
                              {otherPartyRole}
                            </Badge>
                          </div>
                          {formattedTime && (
                            <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                              {formattedTime}
                            </span>
                          )}
                        </div>

                        <p className="text-xs font-medium text-slate-700 truncate mt-0.5 flex items-center gap-1.5">
                          <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
                          <span className="truncate">{conv.propertyTitle}</span>
                        </p>

                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {conv.lastMessageText || 'No messages yet'}
                        </p>
                      </div>

                      {unread && (
                        <div className="w-2.5 h-2.5 rounded-full bg-lime-600 shrink-0 ring-4 ring-lime-100" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
