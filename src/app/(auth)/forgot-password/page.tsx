import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ForgotPasswordPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Account recovery</CardTitle>
          <CardDescription>
            Online password recovery is currently unavailable. Contact PropHunta support to verify your identity and recover your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild><Link href="/login">Back to sign in</Link></Button>
        </CardContent>
      </Card>
    </main>
  );
}
