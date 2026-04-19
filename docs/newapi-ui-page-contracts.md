# New UI Page Contracts
Updated: 2026-04-19

This document describes the page-layer contracts that the current UI expects from future BFF hooks. No direct `newapi` client or auth wrapper is implemented here.

## Scope
- Only frontend page containers and presentational components are covered.
- Replace points currently live in `hooks/use-control-panel-data.ts`.
- All mock data is intentionally minimal and should be replaced by BFF-backed hooks later.

## Dashboard
- Data needed:
  - Current user summary: quota, used quota, request count, permissions.
  - Billing summary: subscription, remaining balance or quota, billing cycle.
  - Recent trend series for the last 7 days.
- Actions:
  - Refresh dashboard data.
  - Navigate to detail pages from cards.
- Loading state:
  - Show stat skeletons and a chart placeholder.
- Empty state:
  - Show neutral zero-value cards for new accounts with no usage.
- Error state:
  - Show a page-level error card and preserve the integration contract panel.
- Current replace point:
  - `hooks/use-control-panel-data.ts:createMockControlPanelData().pages.dashboard`

## API Keys
- Data needed:
  - Token list items: id, name, masked key, remaining quota, status, created time.
  - Search and pagination inputs.
  - Optional group, model limits, expiry display fields.
- Actions:
  - Create key.
  - Edit metadata.
  - Toggle status.
  - Delete single or batch items.
- Loading state:
  - Keep table chrome and replace rows with skeleton rows.
- Empty state:
  - Show a create-first-key empty state.
- Error state:
  - Show a recoverable list error without discarding filters.
- Current replace point:
  - `hooks/use-control-panel-data.ts:createMockControlPanelData().pages.keys`

## Usage Logs
- Data needed:
  - Usage log rows: timestamp, model, token count, quota charge, latency.
  - Filter options and pagination.
  - Optional summary metrics from `/api/log/self/stat`.
- Actions:
  - Change filters and refetch.
  - Paginate.
  - Open a future request detail panel.
- Loading state:
  - Keep filters interactive and swap rows for skeleton rows.
- Empty state:
  - Explain that no requests matched the filter set.
- Error state:
  - Show a recoverable list error while preserving filter controls.
- Current replace point:
  - `hooks/use-control-panel-data.ts:createMockControlPanelData().pages.logs`

## Models
- Data needed:
  - Visible model list.
  - Optional group, context window, pricing notes.
  - Optional feature flags for hidden or coming soon items.
- Actions:
  - Refresh visible models.
  - Open docs or usage guidance for a model.
- Loading state:
  - Render skeleton cards.
- Empty state:
  - Explain that the assigned group has no visible models.
- Error state:
  - Show a read-only error card.
- Current replace point:
  - `hooks/use-control-panel-data.ts:createMockControlPanelData().pages.models`

## Settings
- Data needed:
  - Current profile payload.
  - Current preference payload.
  - Feature flags for email verification, 2FA, password change, editable fields.
- Actions:
  - Update profile.
  - Update preferences.
  - Trigger password rotation or 2FA setup flow.
- Loading state:
  - Keep a static profile shell with placeholders.
- Empty state:
  - Rare case; show a neutral unavailable state if the instance returns no editable settings.
- Error state:
  - Preserve read-only values if available and surface fetch/save failure.
- Current replace point:
  - `hooks/use-control-panel-data.ts:createMockControlPanelData().pages.settings`

## Login
- Data needed:
  - Auth capability flags: login enabled, 2FA required, maintenance copy.
- Actions:
  - Submit username/password to future BFF.
  - Handle optional 2FA challenge.
  - Redirect after session creation.
- Loading state:
  - Disable submit and show spinner.
- Empty state:
  - No empty list state; keep neutral form.
- Error state:
  - Show inline invalid-credential or policy errors.
- Current replace point:
  - `hooks/use-control-panel-data.ts:useMockAuthForm()`

## Signup
- Data needed:
  - Signup policy flags: open signup, invite-only, email verification.
  - Optional password guidance and legal copy.
- Actions:
  - Submit username/password registration.
  - Optionally request or verify email code.
  - Redirect after success.
- Loading state:
  - Disable submit and show spinner.
- Empty state:
  - No empty list state; keep neutral form.
- Error state:
  - Show inline validation and policy errors without clearing form values.
- Current replace point:
  - `hooks/use-control-panel-data.ts:useMockAuthForm()`
