
'use client';

import Link from "next/link";
import { Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { conversations } from "@/lib/mock-data";


export default function MessagesPage() {

    return (
        <Card className="h-full flex flex-col">
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
                        <Link href={`/messages/${conv.id}`} key={conv.id} passHref>
                            <div
                                className={cn(
                                    "flex items-center gap-4 p-4 cursor-pointer hover:bg-accent"
                                )}
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
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
