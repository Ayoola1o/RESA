import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Logo from "@/components/logo"
import NewsSection from "@/components/news-section"

export default function LoginPage() {
  return (
    <div className="w-full max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div className="hidden md:block">
            <NewsSection />
        </div>
        <Card className="mx-auto w-full max-w-sm">
            <CardHeader>
                <div className="flex justify-center mb-4">
                    <Logo className="h-12 w-12 text-primary"/>
                </div>
                <CardTitle className="text-2xl font-headline text-center">Welcome to RESA</CardTitle>
                <CardDescription className="text-center">
                Enter your email below to login to your account
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    />
                </div>
                <div className="grid gap-2">
                    <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    <Link href="#" className="ml-auto inline-block text-sm underline">
                        Forgot your password?
                    </Link>
                    </div>
                    <Input id="password" type="password" required />
                </div>
                <Button type="submit" className="w-full" asChild>
                    <Link href="/dashboard">Login</Link>
                </Button>
                <Button variant="outline" className="w-full">
                    Login with Google
                </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="underline">
                    Sign up
                </Link>
                </div>
            </CardContent>
        </Card>
    </div>
  )
}
