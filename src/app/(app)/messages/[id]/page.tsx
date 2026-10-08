'use client';

import { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { Send, Check, CheckCheck, Sparkles, Loader2, ChevronLeft, Building2 } from 'lucide-react';
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
    <div className="flex flex-col h-[calc(100vh-140px)]">
      <div className="mb-3">
        <Link
          href="/messages"
          className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to all conversations
        </Link>
      </div>

      <Card className="flex-1 flex flex-col shadow-sm border overflow-hidden">
        {/* Chat Header */}
        <div className="border-b p-4 flex items-center justify-between bg-card">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border">
              {enquiry.propertyImage && (
                <AvatarImage src={enquiry.propertyImage} alt={otherPartyName} />
              )}
              <AvatarFallback className="bg-blue-100 text-blue-800 font-semibold text-sm">
                {otherPartyName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-base text-slate-900">{otherPartyName}</p>
                <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">
                  {otherPartyRole}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                <Building2 className="h-3 w-3 text-slate-400" />
                <span className="font-medium text-slate-700">{enquiry.propertyTitle}</span>
              </div>
            </div>
          </div>

          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
            <Link href={`/property/${enquiry.propertyId}`}>View Listing</Link>
          </Button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-slate-50/50">
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
                    <AvatarFallback className="text-[10px] bg-slate-200 text-slate-700">
                      {message.senderName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={cn(
                    'rounded-2xl px-4 py-2.5 max-w-sm md:max-w-md shadow-sm',
                    isMe
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white border text-slate-900 rounded-bl-none'
                  )}
                >
                  <p className="text-xs font-semibold mb-1 opacity-75">
                    {isMe ? 'You' : message.senderName}
                  </p>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p>
                  <div
                    className={cn(
                      'text-[10px] mt-1.5 flex items-center gap-1 justify-end',
                      isMe ? 'text-white/75' : 'text-muted-foreground'
                    )}
                  >
                    <span>{formattedTime}</span>
                    {isMe && <CheckCheck className="h-3.5 w-3.5 text-blue-200" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Message Input */}
        <div className="border-t p-3 bg-white">
          <form className="flex items-center gap-2" onSubmit={handleSendMessage}>
            <div className="relative flex-1">
              <Input
                placeholder="Type a verified message or schedule query..."
                className="pr-12"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={isSending}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
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
              className="bg-blue-600 hover:bg-blue-700 text-white"
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
