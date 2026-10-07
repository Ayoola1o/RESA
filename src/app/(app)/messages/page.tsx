'use client';

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { conversations } from "@/lib/mock-data";

export default function MessagesPage() {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredConversations = useMemo(() => {
        if (!searchQuery.trim()) return conversations;
        const q = searchQuery.toLowerCase();
        return conversations.filter(conv =>
            conv.name.toLowerCase().includes(q) ||
            conv.property.toLowerCase().includes(q) ||
            conv.messages.some(m => m.text.toLowerCase().includes(q))
        );
    }, [searchQuery]);

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="font-headline">Conversations</CardTitle>
                <div className="relative mt-2">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search conversations by name, property, or message..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="flex flex-col divide-y divide-slate-100">
                    {filteredConversations.map(conv => (
                        <Link href={`/messages/${conv.id}`} key={conv.id} passHref>
                            <div
                                className={cn(
                                    "flex items-center gap-4 p-4 cursor-pointer hover:bg-accent/60 transition-colors"
                                )}
                            >
                                <Avatar className="h-10 w-10 border">
                                    <AvatarImage src={conv.avatar} alt={conv.name} />
                                    <AvatarFallback>{conv.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 truncate">
                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold text-sm">{conv.name}</p>
                                        <span className="text-xs text-muted-foreground">{conv.property}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                                        {conv.messages[conv.messages.length - 1].text}
                                    </p>
                                </div>
                                {conv.messages.some(m => !m.read && m.from !== "John Doe") && (
                                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                                )}
                            </div>
                        </Link>
                    ))}
                    {filteredConversations.length === 0 && (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                            No conversations match &ldquo;{searchQuery}&rdquo;.
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
