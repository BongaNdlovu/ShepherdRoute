# SQL Migration Discipline

## Overview

This document describes the SQL migration discipline for the Guestloop/ShepardRoute project to ensure safe schema changes, especially for table-returning RPC functions.

## Table-Returning RPC Functions

PostgreSQL does not allow changing the return type of an existing function. When modifying a table-returning RPC function's return shape, you must use the exact `drop function if exists ...` signature immediately before `create or replace function ...` to avoid error `42P13: cannot change return type of existing function`.

## Required Pattern

For any table-returning RPC function that may change its return shape, always use this pattern:

```sql
drop function if exists public.function_name(param_type, param_type);
create or replace function public.function_name(param_type, param_type)
  returns table (
    -- return type definition
  )
  language sql
  security definer
  as $$
    -- function body
  $$;
```

## Current Functions Using This Pattern

The following table-returning RPC functions currently use this pattern:

- `public.owner_church_summaries()`
- `public.search_contacts(uuid, text, public.follow_up_status, uuid, public.interest_tag, uuid, boolean, integer, integer)`
- `public.export_contacts(uuid, text, public.follow_up_status, uuid, public.interest_tag, uuid, boolean)`
- `public.outreach_report_summary(uuid)`
- `public.event_report_summary(uuid, uuid)`

## Schema Files

SQL is maintained in two files:

1. `supabase/schema.sql` - The primary schema file
2. `docs/supabase-schema-copy-paste.sql` - A copy for documentation purposes

Both files must be kept in sync when making schema changes.

## When to Use This Pattern

Use the `drop function if exists` pattern when:

1. Adding a new column to the return type of a table-returning RPC
2. Removing a column from the return type
3. Changing the data type of a column in the return type
4. Reordering columns in the return type

Do NOT use this pattern for:

1. Simple function logic changes that don't affect the return type
2. Adding new functions (use `create function` directly)
3. Functions that return scalar values (non-table)

## Verification

The `tests/workflow-schema.spec.ts` test suite includes regression coverage for RPC return type shapes to ensure they match expectations.
