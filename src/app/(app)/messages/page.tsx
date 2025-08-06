
'use client';

import Image from "next/image";
import { useState } from "react";
import { Search, Send, Check, CheckCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const conversations = [
  {
    id: 1,
    name: "Jane Doe (Agent)",
    property: "Modern Villa",
    avatar: "https://placehold.co/100x100",
    messages: [
      { from: "Jane Doe (Agent)", text: "Hi John, I have some great news about the Modern Villa!", time: "10:00 AM", read: true },
      { from: "John Doe", text: "That's exciting! What's the update?", time: "10:01 AM" },
      { from: "Jane Doe (Agent)", text: "The seller has accepted your offer! Congratulations!", time: "10:02 AM", read: true },
      { from: "John Doe", text: "Wow, that's fantastic! Thanks for all your help, Jane.", time: "10:05 AM" },
    ]
  },
  {
    id: 2,
    name: "Tenant (456 Urban St)",
    property: "Cozy Downtown Apartment",
    avatar: "https://placehold.co/100x100",
    messages: [
        { from: "Tenant (456 Urban St)", text: "Hi John, the sink in the kitchen is leaking. Can you please take a look?", time: "Yesterday", read: true },
        { from: "John Doe", text: "Oh no, sorry to hear that. I'll get a plumber to come over tomorrow morning. Is that okay?", time: "Yesterday" },
        { from: "Tenant (456 Urban St)", text: "Yes, that works perfectly. Thank you!", time: "Yesterday", read: true },
    ]
  },
    {
    id: 3,
    name: "Michael Brown (Agent)",
    property: "Rustic Lakeside Cabin",
    avatar: "https://placehold.co/100x100",
    messages: [
      { from: "Michael Brown (Agent)", text: "Following up on the Rustic Lakeside Cabin - are you still interested in scheduling a viewing?", time: "3 days ago", read: false },
    ]
  },
];


export default function MessagesPage() {
    const [selectedConversation, setSelectedConversation] = useState(conversations[0]);
    const [newMessage, setNewMessage] = useState("");

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if(newMessage.trim() === "") return;
        
        // This is a demo, so we'll just add the message to the local state
        const updatedConversation = {
            ...selectedConversation,
            messages: [
                ...selectedConversation.messages,
                { from: "John Doe", text: newMessage, time: "Now" }
            ]
        };

        const convIndex = conversations.findIndex(c => c.id === selectedConversation.id);
        conversations[convIndex] = updatedConversation;

        setSelectedConversation(updatedConversation);
        setNewMessage("");
    }

    return (
        <Card className="h-full flex flex-col md:flex-row">
            {/* Conversations List */}
            <aside className="w-full md:w-1/3 lg:w-1/4 border-r">
                <CardHeader>
                    <CardTitle className="font-headline">Conversations</CardTitle>
                     <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search messages..." className="pl-8" />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="flex flex-col">
                        {conversations.map(conv => (
                            <div
                                key={conv.id}
                                className={cn(
                                    "flex items-center gap-4 p-4 cursor-pointer hover:bg-accent",
                                    selectedConversation.id === conv.id && "bg-accent"
                                )}
                                onClick={() => setSelectedConversation(conv)}
                            >
                                <Avatar className="h-10 w-10 border">
                                    <AvatarImage src={conv.avatar} alt={conv.name} />
                                    <AvatarFallback>{conv.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 truncate">
                                    <p className="font-semibold">{conv.name}</p>
                                    <p className="text-sm text-muted-foreground truncate">{conv.messages[conv.messages.length - 1].text}</p>
                                </div>
                                {conv.messages.some(m => !m.read && m.from !== "John Doe") && (
                                     <div className="w-2 h-2 rounded-full bg-primary" />
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </aside>

            {/* Chat Panel */}
            <main className="flex-1 flex flex-col">
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
                    <form className="flex items-center gap-4" onSubmit={handleSendMessage}>
                        <Input 
                            placeholder="Type a message..." 
                            className="flex-1"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                        />
                        <Button type="submit">
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </main>
        </Card>
    );
}
