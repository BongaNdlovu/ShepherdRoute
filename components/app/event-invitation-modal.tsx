'use client';

import { useState } from 'react';
import { EVENT_PERMISSION_PRESETS } from '@/lib/event-permission-presets';
import { EventPermissionSelector } from '@/components/app/event-permission-selector';
import { assignTeamMemberToEvent, inviteToEventByEmail } from '@/app/(dashboard)/_actions/event-assignments';
import type { EventAssignmentPermissions } from '@/lib/event-permission-presets';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

type Tab = 'email' | 'assign';

export function EventInvitationModal({
  eventId,
  onSuccess,
  onClose,
}: {
  eventId: string;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>('email');
  const [email, setEmail] = useState('');
  const [teamMemberId, setTeamMemberId] = useState('');
  const [permissions, setPermissions] = useState<EventAssignmentPermissions>(
    EVENT_PERMISSION_PRESETS.followUpWorker.permissions
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (tab === 'email') {
        await inviteToEventByEmail({
          eventId,
          email,
          permissions,
        });
      } else {
        await assignTeamMemberToEvent({
          eventId,
          teamMemberId,
          permissions,
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process invitation');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-lg border bg-white p-6 shadow-lg">
      <h2 className="text-lg font-semibold mb-4">Add to Event Team</h2>

      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setTab('email')}
          className={`px-4 py-2 rounded-lg ${tab === 'email' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
        >
          Invite by Email
        </button>
        <button
          type="button"
          onClick={() => setTab('assign')}
          className={`px-4 py-2 rounded-lg ${tab === 'assign' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
        >
          Assign Team Member
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {tab === 'email' ? (
          <div>
            <Label htmlFor="email">Email Address</Label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border"
              placeholder="person@example.com"
              required
            />
          </div>
        ) : (
          <div>
            <Label htmlFor="teamMemberId">Team Member</Label>
            <select
              id="teamMemberId"
              value={teamMemberId}
              onChange={(e) => setTeamMemberId(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border"
              required
            >
              <option value="">Select a team member</option>
              {/* TODO: Load team members from the church */}
            </select>
          </div>
        )}

        <div>
          <Label>Permissions</Label>
          <EventPermissionSelector value={permissions} onChange={setPermissions} />
        </div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Processing...' : tab === 'email' ? 'Send Invitation' : 'Assign'}
          </Button>
        </div>
      </form>
    </div>
  );
}
