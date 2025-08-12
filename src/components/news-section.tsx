
'use client';

import { useEffect, useState } from "react";
import Image from "next/image";
import { getNews } from "@/app/actions";
import { type GenerateNewsOutput } from "@/ai/flows/generate-news-flow";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Rss } from "lucide-react";

export default function NewsSection() {
    const [news, setNews] = useState<GenerateNewsOutput['articles'] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchNews() {
            try {
                const result = await getNews({ topic: "US real estate market trends" });
                if (result.error) {
                    setError(result.error as string);
                } else if (result.data) {
                    setNews(result.data.articles);
                }
            } catch (err) {
                setError("An unexpected error occurred.");
            } finally {
                setLoading(false);
            }
        }
        fetchNews();
    }, []);

    return (
        <Card className="bg-muted/20 border-none shadow-none">
            <CardHeader>
                <CardTitle className="font-headline text-3xl flex items-center gap-2">
                   <Rss className="h-8 w-8 text-primary"/>
                    Real Estate Today
                </CardTitle>
                <CardDescription>
                    Your AI-powered daily brief on the real estate market.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {loading && (
                    <p>Loading real estate news...</p>
                )}
                {error && (
                    <p className="text-destructive">Could not load news: {error}</p>
                )}
                {news && news.map((article, index) => (
                    <div key={index} className="flex items-start gap-4">
                         <Image 
                            src={article.imageUrl}
                            alt={article.title}
                            width={120}
                            height={90}
                            className="rounded-lg object-cover aspect-video"
                            data-ai-hint={article.imageHint}
                        />
                        <div className="flex-1">
                             <Badge variant="outline" className="mb-1">{article.category}</Badge>
                             <h3 className="font-semibold font-headline text-lg leading-tight">{article.title}</h3>
                             <p className="text-sm text-muted-foreground mt-1">{article.summary}</p>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
