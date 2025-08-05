import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";

export default function MessagesPage() {
    return (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
            <div className="flex flex-col items-center gap-1 text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground" />
                <h3 className="text-2xl font-bold tracking-tight font-headline">
                    In-App Communication
                </h3>
                <p className="text-sm text-muted-foreground">
                    Connect with agents and other parties directly.
                </p>
                <p className="text-sm text-muted-foreground">
                    This feature is coming soon!
                </p>
            </div>
        </div>
    )
}
