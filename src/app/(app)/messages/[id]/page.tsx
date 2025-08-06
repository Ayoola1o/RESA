
'use client';

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { Send, Check, CheckCheck, Sparkles, Loader2, ChevronLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getSuggestedReply } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { conversations as allConversations } from "@/lib/mock-data";

export default function ChatRoomPage() {
    const { toast } = useToast();
    const params = useParams();
    const convId = Number(params.id);

    // In a real app, you'd fetch this data, but we'll manage state for the demo
    const [conversations, setConversations] = useState(allConversations);
    const [selectedConversation, setSelectedConversation] = useState(() => 
        conversations.find(c => c.id === convId)
    );
    const [newMessage, setNewMessage] = useState("");
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        const conversation = conversations.find(c => c.id === convId);
        setSelectedConversation(conversation);
    }, [convId, conversations]);

    if (!selectedConversation) {
        return notFound();
    }

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if(newMessage.trim() === "") return;
        
        const updatedMessages = [
            ...selectedConversation.messages,
            { from: "John Doe", text: newMessage, time: "Now" }
        ];
        
        const updatedConversation = { ...selectedConversation, messages: updatedMessages };

        const updatedConversations = conversations.map(c => 
            c.id === selectedConversation.id ? updatedConversation : c
        );

        setConversations(updatedConversations);
        setNewMessage("");
    }

    const handleSuggestReply = () => {
        startTransition(async () => {
            const conversationHistory = selectedConversation.messages
                .map(m => `${m.from}: ${m.text}`)
                .join('\n');
            
            const result = await getSuggestedReply({ conversationHistory, userName: 'John Doe' });

            if(result.error) {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: result.error,
                });
            } else if (result.data) {
                setNewMessage(result.data.suggestedReply);
            }
        });
    }

    return (
        <div className="flex flex-col h-full">
            <div className="mb-4">
                <Link href="/messages" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back to all messages
                </Link>
            </div>
            <Card className="flex-1 flex flex-col">
                {/* Chat Header */}
                <div className="border-b p-4 flex items-center gap-4">
                    <Avatar>
                        <AvatarImage src={selectedConversation.avatar} alt={selectedConversation.name} />
                        <AvatarFallback>{selectedConversation.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold text-lg">{selectedConversation.name}</p>
                        <p className="text-sm text-muted-foreground">Regarding: {selectedConversation.property}</p>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-muted/20">
                    {selectedConversation.messages.map((message, index) => (
                        <div
                            key={index}
                            className={cn(
                                "flex items-end gap-2",
                                message.from === "John Doe" ? "justify-end" : "justify-start"
                            )}
                        >
                            {message.from !== "John Doe" && (
                                    <Avatar className="h-8 w-8">
                                    <AvatarImage src={selectedConversation.avatar} />
                                    <AvatarFallback>{selectedConversation.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                            )}
                            <div
                                className={cn(
                                    "rounded-lg p-3 max-w-xs md:max-w-md",
                                    message.from === "John Doe"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-background border"
                                )}
                            >
                                <p className="text-sm">{message.text}</p>
                                <div className={cn(
                                    "text-xs mt-1 flex items-center gap-1",
                                        message.from === "John Doe" ? "text-primary-foreground/70 justify-end" : "text-muted-foreground"
                                )}>
                                    <span>{message.time}</span>
                                    {message.from === "John Doe" && (
                                        message.read ? <CheckCheck className="h-4 w-4 text-blue-400" /> : <Check className="h-4 w-4" />
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Message Input */}
                <div className="border-t p-4 bg-background">
                    <form className="flex items-center gap-2" onSubmit={handleSendMessage}>
                        <div className="relative flex-1">
                                <Input 
                                placeholder="Type a message..." 
                                className="pr-12"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                            />
                            <Button 
                                type="button" 
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                                onClick={handleSuggestReply}
                                disabled={isPending}
                                aria-label="Suggest Reply"
                            >
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                            </Button>
                        </div>
                        
                        <Button type="submit">
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </Card>
        </div>
    );
}
