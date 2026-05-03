'use client';

import { useMemo } from 'react';
import {
  EVENT_PERMISSION_KEYS,
  EVENT_PERMISSION_PRESETS,
  type EventAssignmentPermissions,
  type EventPermissionKey,
} from '@/lib/event-permission-presets';

const LABELS: Record<EventPermissionKey, string> = {
  can_view_contacts: 'View contacts',
  can_assign_contacts: 'Assign contacts',
  can_view_reports: 'View reports',
  can_export_reports: 'Export reports',
  can_edit_event_settings: 'Edit event settings',
  can_manage_event_team: 'Manage event team',
  can_view_prayer_requests: 'View prayer requests',
  can_delete_event: 'Delete event',
};

const WARNINGS: Partial<Record<EventPermissionKey, string>> = {
  can_export_reports: 'Sensitive: allows data export.',
  can_manage_event_team: 'Sensitive: allows changing event access.',
  can_delete_event: 'High risk: allows deleting the event.',
  can_view_prayer_requests: 'Sensitive: may contain private prayer requests.',
};

export function EventPermissionSelector(props: {
  value: EventAssignmentPermissions;
  onChange: (value: EventAssignmentPermissions) => void;
}) {
  const presetEntries = useMemo(() => Object.entries(EVENT_PERMISSION_PRESETS), []);

  function togglePermission(key: EventPermissionKey) {
    props.onChange({
      ...props.value,
      [key]: !props.value[key],
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {presetEntries.map(([key, preset]) => (
          <button
            key={key}
            type="button"
            className="rounded-lg border p-3 text-left hover:bg-muted"
            onClick={() => props.onChange(preset.permissions)}
          >
            <div className="font-medium">{preset.label}</div>
            <div className="text-sm text-muted-foreground">{preset.description}</div>
          </button>
        ))}
      </div>

      <div className="rounded-lg border divide-y">
        {EVENT_PERMISSION_KEYS.map((key) => (
          <label key={key} className="flex items-start gap-3 p-3">
            <input
              type="checkbox"
              className="mt-1"
              checked={props.value[key]}
              onChange={() => togglePermission(key)}
            />
            <span>
              <span className="block font-medium">{LABELS[key]}</span>
              {WARNINGS[key] ? (
                <span className="block text-sm text-amber-600">{WARNINGS[key]}</span>
              ) : null}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
