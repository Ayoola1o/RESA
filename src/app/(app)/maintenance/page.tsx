
'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getCategorizedMaintenance } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full" size="lg">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wrench className="mr-2 h-4 w-4" />}
      Submit Request
    </Button>
  );
}

export default function MaintenanceRequestPage() {
  const { toast } = useToast();
  const [state, formAction, isPending] = useActionState(getCategorizedMaintenance, null);

  useEffect(() => {
    if (state?.error && typeof state.error !== 'object') {
       toast({
         variant: 'destructive',
         title: 'Error',
         description: state.error,
       });
    }
  }, [state, toast]);

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Submit a Maintenance Request</CardTitle>
          <CardDescription>
            Please describe the issue you are experiencing in detail. Our team will review it shortly.
          </CardDescription>
        </CardHeader>
        <form action={formAction}>
            <CardContent>
            <div className="grid w-full gap-2">
              <Label htmlFor="requestText">Maintenance Issue Description</Label>
              <Textarea
                id="requestText"
                name="requestText"
                placeholder="e.g., 'The kitchen sink is clogged and water is not draining properly. I've tried using a plunger but it did not work.'"
                rows={6}
              />
               {state?.error?.requestText && <p className="text-sm text-destructive">{state.error.requestText[0]}</p>}
            </div>
            </CardContent>
            <CardFooter>
                <SubmitButton />
            </CardFooter>
        </form>
      </Card>

      {state?.data && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> AI Analysis Complete</CardTitle>
            <CardDescription>We've received and analyzed your request. Here are the details for our team:</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Category</p>
                    <Badge>{state.data.category}</Badge>
                </div>
                 <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Priority</p>
                    <Badge variant={state.data.priority === 'Emergency' || state.data.priority === 'High' ? 'destructive' : 'secondary'}>{state.data.priority}</Badge>
                </div>
            </div>
             <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Summary</p>
                <p className="text-card-foreground">{state.data.summary}</p>
            </div>
             <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Suggested Action</p>
                <p className="text-card-foreground">{state.data.suggestedAction}</p>
            </div>
            <p className="text-sm text-muted-foreground pt-4">Thank you! A member of our property management team will be in touch with you shortly to schedule the repair.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
