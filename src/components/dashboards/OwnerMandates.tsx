'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getOwnerRelationshipsAction, inviteAgentAction, revokeRelationshipAction } from '@/server/actions/prophunta-actions';
import type { OwnerAgentRelationship } from '@/types/prophunta';

export default function OwnerMandates() {
  const [records, setRecords] = useState<OwnerAgentRelationship[] | null>(null);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getOwnerRelationshipsAction().then((items) => {
      if (active) setRecords(items);
    }).catch(() => {
      if (active) setError('Could not load mandates. Refresh to try again.');
    });
    return () => { active = false; };
  }, []);

  async function updateMandate(id?: string) {
    setBusy(true);
    setError('');
    try {
      const result = id ? await revokeRelationshipAction(id) : await inviteAgentAction({
        agentEmail: email.trim(),
        mandateType: 'NON_EXCLUSIVE',
      });
      if (!result.success || !result.relationship) throw new Error(result.error);
      const updated = result.relationship;
      setRecords((items) => id ? (items ?? []).map((item) => item.id === id ? updated : item) : [updated, ...(items ?? [])]);
      if (!id) setEmail('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not update the mandate.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle>Agent mandates</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {error && <p role="alert">{error}</p>}
        {records === null && !error && <p role="status">Loading mandates…</p>}
        {records !== null && (
          <>
            <form className="space-y-2" onSubmit={(event) => { event.preventDefault(); void updateMandate(); }}>
              <Label htmlFor="mandate-agent-email">Registered agent email</Label>
              <Input id="mandate-agent-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
              <p className="text-sm text-slate-600">This sends a non-exclusive invitation covering all your listings.</p>
              <Button disabled={busy || !email.trim()}>Invite agent</Button>
            </form>
            {records.length === 0 && <p>No agent mandates yet.</p>}
            {records.map((record) => (
              <div key={record.id} className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                <span>{record.agentName} · {record.status}</span>
                {['ACTIVE', 'INVITED'].includes(record.status) && (
                  <Button type="button" variant="outline" disabled={busy} onClick={() => updateMandate(record.id)}>Revoke</Button>
                )}
              </div>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
}
