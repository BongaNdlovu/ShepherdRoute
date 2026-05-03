export type EventPermissionKey =
  | 'can_view_contacts'
  | 'can_assign_contacts'
  | 'can_view_reports'
  | 'can_export_reports'
  | 'can_edit_event_settings'
  | 'can_manage_event_team'
  | 'can_view_prayer_requests'
  | 'can_delete_event';

export type EventAssignmentPermissions = Record<EventPermissionKey, boolean>;

export const EVENT_PERMISSION_KEYS: EventPermissionKey[] = [
  'can_view_contacts',
  'can_assign_contacts',
  'can_view_reports',
  'can_export_reports',
  'can_edit_event_settings',
  'can_manage_event_team',
  'can_view_prayer_requests',
  'can_delete_event',
];

export const EVENT_PERMISSION_PRESETS = {
  viewer: {
    label: 'Viewer only',
    description: 'Can view basic event contacts, but cannot assign, export, manage team, or change settings.',
    permissions: {
      can_view_contacts: true,
      can_assign_contacts: false,
      can_view_reports: false,
      can_export_reports: false,
      can_edit_event_settings: false,
      can_manage_event_team: false,
      can_view_prayer_requests: false,
      can_delete_event: false,
    },
  },
  followUpWorker: {
    label: 'Follow-up worker',
    description: 'Can view contacts, prayer requests, and update assigned follow-ups.',
    permissions: {
      can_view_contacts: true,
      can_assign_contacts: false,
      can_view_reports: false,
      can_export_reports: false,
      can_edit_event_settings: false,
      can_manage_event_team: false,
      can_view_prayer_requests: true,
      can_delete_event: false,
    },
  },
  coordinator: {
    label: 'Coordinator',
    description: 'Can view and assign contacts, view reports, and help manage the event team.',
    permissions: {
      can_view_contacts: true,
      can_assign_contacts: true,
      can_view_reports: true,
      can_export_reports: false,
      can_edit_event_settings: false,
      can_manage_event_team: true,
      can_view_prayer_requests: true,
      can_delete_event: false,
    },
  },
  reporting: {
    label: 'Reporting',
    description: 'Can view reports but cannot export or manage sensitive event settings.',
    permissions: {
      can_view_contacts: false,
      can_assign_contacts: false,
      can_view_reports: true,
      can_export_reports: false,
      can_edit_event_settings: false,
      can_manage_event_team: false,
      can_view_prayer_requests: false,
      can_delete_event: false,
    },
  },
  fullEventAccess: {
    label: 'Full event access',
    description: 'Can manage the event team, view contacts and reports, and edit event settings. Cannot delete event by default.',
    permissions: {
      can_view_contacts: true,
      can_assign_contacts: true,
      can_view_reports: true,
      can_export_reports: true,
      can_edit_event_settings: true,
      can_manage_event_team: true,
      can_view_prayer_requests: true,
      can_delete_event: false,
    },
  },
} as const;

export type EventPermissionPresetKey = keyof typeof EVENT_PERMISSION_PRESETS;

export function sanitizeEventPermissions(input: Partial<EventAssignmentPermissions>): EventAssignmentPermissions {
  return {
    can_view_contacts: Boolean(input.can_view_contacts),
    can_assign_contacts: Boolean(input.can_assign_contacts),
    can_view_reports: Boolean(input.can_view_reports),
    can_export_reports: Boolean(input.can_export_reports),
    can_edit_event_settings: Boolean(input.can_edit_event_settings),
    can_manage_event_team: Boolean(input.can_manage_event_team),
    can_view_prayer_requests: Boolean(input.can_view_prayer_requests),
    can_delete_event: Boolean(input.can_delete_event),
  };
}
