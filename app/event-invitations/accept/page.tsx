'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { acceptEventInvitation } from '@/app/(dashboard)/_actions/event-assignments';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AcceptEventInvitationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [eventId, setEventId] = useState<string | null>(null);

  useEffect(() => {
    async function acceptInvitation() {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('Invalid invitation link.');
        return;
      }

      try {
        const result = await acceptEventInvitation({ token });
        setStatus('success');
        setEventId(result.eventId);
        setMessage('You have been successfully added to the event team!');
      } catch (error) {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Failed to accept invitation.');
      }
    }

    acceptInvitation();
  }, [searchParams]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p>Processing invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invitation Error</CardTitle>
            <CardDescription>Could not accept the event invitation</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-destructive mb-4">{message}</p>
            <Button onClick={() => router.push('/')}>Return to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Invitation Accepted</CardTitle>
          <CardDescription>You've been added to the event team</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <p className="mb-4">{message}</p>
          {eventId && (
            <Button onClick={() => router.push(`/events/${eventId}/team`)}>
              Go to Event Team
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
