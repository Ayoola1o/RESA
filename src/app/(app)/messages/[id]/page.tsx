'use client';

import { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { Send, Check, CheckCheck, Sparkles, Loader2, ChevronLeft, Building2, AlertTriangle, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getSuggestedReply } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { getEnquiryAction, replyEnquiryAction } from '@/server/actions/prophunta-actions';
import { useUserRole } from '@/context/UserRoleContext';
import { PropertyEnquiry } from '@/types/prophunta';
import { conversations as mockConversations } from '@/lib/mock-data';

export default function ChatRoomPage() {
  const { toast } = useToast();
  const params = useParams();
  const convId = String(params.id);
  const { currentUser } = useUserRole();

  const [enquiry, setEnquiry] = useState<PropertyEnquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSuggesting, startSuggesting] = useTransition();

  // Load enquiry
  useEffect(() => {
    let mounted = true;
    getEnquiryAction(convId)
      .then((data) => {
        if (!mounted) return;
        if (data) {
          setEnquiry(data);
          setLoading(false);
        } else {
          // Check mock fallback if it's a numeric mock id
          const numericId = Number(convId);
          const mock = mockConversations.find((c) => c.id === numericId);
          if (mock) {
            setEnquiry({
              id: String(mock.id),
              propertyId: 'prop-1',
              propertyTitle: mock.property,
              propertyImage: mock.avatar,
              seekerId: 'seeker-1',
              seekerName: mock.name,
              hostId: 'owner-1',
              hostName: 'Property Representative',
              lastMessageText: mock.messages[mock.messages.length - 1]?.text || '',
              lastMessageAt: new Date().toISOString(),
              unreadCountForSeeker: 0,
              unreadCountForHost: 0,
              messages: mock.messages.map((m, idx) => ({
                id: `mock-msg-${idx}`,
                senderId: m.from === 'John Doe' ? (currentUser?.id || 'seeker-1') : 'other-user',
                senderName: m.from,
                senderRole: 'SEEKER',
                text: m.text,
                timestamp: new Date().toISOString(),
                read: true,
              })),
            });
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [convId, currentUser?.id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!enquiry) {
    return notFound();
  }

  const isSeeker = currentUser?.id === enquiry.seekerId;
  const otherPartyName = isSeeker ? enquiry.hostName : enquiry.seekerName;
  const otherPartyRole = isSeeker ? 'Owner / Agent' : 'Property Seeker';

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    // Optimistic message update
    const optimisticMsg = {
      id: `temp_${Date.now()}`,
      senderId: currentUser?.id || 'curr_user',
      senderName: currentUser?.name || 'You',
      senderRole: currentUser?.role || 'SEEKER',
      text: messageText,
      timestamp: new Date().toISOString(),
      read: true,
    };

    setEnquiry((prev) =>
      prev ? { ...prev, messages: [...prev.messages, optimisticMsg] } : null
    );

    const res = await replyEnquiryAction(enquiry.id, messageText);
    setIsSending(false);

    if (!res.success) {
      toast({
        variant: 'destructive',
        title: 'Message Failed',
        description: res.error || 'Could not send message.',
      });
    } else {
      // Refresh enquiry
      const refreshed = await getEnquiryAction(enquiry.id);
      if (refreshed) setEnquiry(refreshed);
    }
  };

  const handleSuggestReply = () => {
    startSuggesting(async () => {
      const conversationHistory = enquiry.messages
        .map((m) => `${m.senderName}: ${m.text}`)
        .join('\n');

      const result = await getSuggestedReply({
        conversationHistory,
        userName: currentUser?.name || 'Me',
      });

      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'AI Suggestion Unavailable',
          description: result.error,
        });
      } else if (result.data) {
        const replyText =
          (result.data as any).suggestedReply || (result.data as any).reply || '';
        setNewMessage(replyText);
      }
    });
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-6rem)] md:h-[calc(100vh-120px)]">
      <div className="mb-2 sm:mb-3">
        <Link
          href="/messages"
          className="flex items-center text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to all conversations
        </Link>
      </div>

      <Card className="flex-1 flex flex-col shadow-xs border-slate-200/90 rounded-2xl overflow-hidden">
        {/* Chat Header */}
        <div className="border-b border-slate-100 p-3 sm:p-4 flex items-center justify-between bg-card">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 sm:h-10 sm:w-10 border border-slate-200">
              {enquiry.propertyImage && (
                <AvatarImage src={enquiry.propertyImage} alt={otherPartyName} />
              )}
              <AvatarFallback className="bg-lime-100 text-lime-900 font-bold text-xs sm:text-sm border border-lime-300">
                {otherPartyName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <p className="font-bold text-sm sm:text-base text-slate-900">{otherPartyName}</p>
                <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">
                  {otherPartyRole}
                </Badge>
                {enquiry.authorizedAgentId && (
                  <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4 bg-lime-50 text-lime-800 border-lime-200">
                    <Users className="h-2.5 w-2.5 mr-1" /> Authorized Agent Shared Thread
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                <Building2 className="h-3 w-3 text-slate-400" />
                <span className="font-medium text-slate-700 truncate max-w-[200px] sm:max-w-none">{enquiry.propertyTitle}</span>
              </div>
            </div>
          </div>

          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex rounded-xl h-8 text-xs font-semibold">
            <Link href={`/property/${enquiry.propertyId}`}>View Listing</Link>
          </Button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-3.5 sm:p-5 space-y-3.5 sm:space-y-4 overflow-y-auto bg-slate-50/50">
          {enquiry.messages.map((message) => {
            const isMe = message.senderId === currentUser?.id;
            const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={message.id}
                className={cn('flex items-end gap-2', isMe ? 'justify-end' : 'justify-start')}
              >
                {!isMe && (
                  <Avatar className="h-7 w-7 border shrink-0">
                    <AvatarFallback className="text-[10px] bg-slate-200 text-slate-700 font-bold">
                      {message.senderName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={cn(
                    'rounded-2xl px-3.5 sm:px-4 py-2 sm:py-2.5 max-w-[85%] sm:max-w-md shadow-xs',
                    isMe
                      ? 'bg-lime-600 text-white rounded-br-xs font-medium'
                      : 'bg-white border border-slate-200 text-slate-900 rounded-bl-xs'
                  )}
                >
                  <p className="text-[11px] font-bold mb-0.5 opacity-80">
                    {isMe ? 'You' : message.senderName}
                  </p>
                  <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p>

                  {/* Off-Platform Warning Notice (Non-punitive Trust & Safety) */}
                  {message.hasOffPlatformWarning && (
                    <div
                      className={cn(
                        'mt-2 p-2 rounded-lg text-xs flex items-start gap-1.5',
                        isMe
                          ? 'bg-amber-400/20 border border-amber-300/40 text-amber-100'
                          : 'bg-amber-50 border border-amber-200 text-amber-900'
                      )}
                    >
                      <AlertTriangle className={cn('h-3.5 w-3.5 shrink-0 mt-0.5', isMe ? 'text-amber-200' : 'text-amber-600')} />
                      <span className="text-[11px] leading-tight font-normal">
                        {message.warningNotice ||
                          'Trust & Safety Reminder: Contact requests outside PropHunta waive transaction verification protections and audit logs.'}
                      </span>
                    </div>
                  )}

                  <div
                    className={cn(
                      'text-[10px] mt-1 flex items-center gap-1 justify-end',
                      isMe ? 'text-white/80' : 'text-muted-foreground'
                    )}
                  >
                    <span>{formattedTime}</span>
                    {isMe && <CheckCheck className="h-3.5 w-3.5 text-lime-200" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Message Input */}
        <div className="border-t border-slate-100 p-2.5 sm:p-3 bg-white">
          <form className="flex items-center gap-2" onSubmit={handleSendMessage}>
            <div className="relative flex-1">
              <Input
                placeholder="Type a verified message or schedule query..."
                className="pr-10 h-10 rounded-xl text-xs sm:text-sm"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={isSending}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-lime-700 hover:text-lime-800 hover:bg-lime-50 rounded-lg"
                onClick={handleSuggestReply}
                disabled={isSuggesting || isSending}
                title="Use AI to suggest an appropriate reply"
              >
                {isSuggesting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
              </Button>
            </div>

            <Button
              type="submit"
              className="bg-lime-600 hover:bg-lime-500 text-white font-bold h-10 px-3.5 rounded-xl shrink-0"
              disabled={isSending || !newMessage.trim()}
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
