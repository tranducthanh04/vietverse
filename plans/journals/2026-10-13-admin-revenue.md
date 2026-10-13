# Admin revenue report

## Approved outcome

Add a read-only admin report for completed subscription payments. Exclude test orders and unpaid/failed/cancelled orders; preserve stored historic prices. No checkout, webhook, payment configuration, subscription, refund or customer-data mutation.

## Implementation and assumptions

- `GET /api/v1/admin/revenue`, `/admin/doanh-thu`, desktop/mobile navigation.
- Date boundaries and month grouping use Vietnam time; optional inclusive from/to filters. Current-month KPI remains independent of the filter and is labelled explicitly.
- Completed legacy orders with no paidAt appear in all-time totals but not dated reports; the UI requests reconciliation instead of inventing a date.
- Gross receipts before fees, tax and refunds, not profit or accounting recognition. These are the approved limits, not a new settlement integration.

## Verification

- RED: two API cases returned 404 before implementation; four real-router UI tests rendered the 404 page before route implementation.
- GREEN: root `npm test`: backend 427/427 in 45 suites; frontend 219/219 in 28 suites. Isolated MongoMemoryReplSet with installed MongoDB 8.2.3; no production DB tests. Version warning versus requested 7.0.24 is informational.
- Typecheck and root build passed. Client lint: zero errors, 87 pre-existing warnings. Bundle warning remains (~722 kB).
- Local Chromium smoke with fixture API: 1366px and 390px, revenue route/filter controls work, no pageerror or page horizontal overflow. Browser process/server closed; external and production API requests blocked. Screenshots kept outside Git in the local visualization directory.
- Independent scoped review/simplification ran clean, no edits or blocking findings. Residual gaps: deterministic month-rollover test and UI undated-warning test; no live payment was created.
- `ak` CLI unavailable in this environment; journal kept locally. AgentWiki publish skipped.

## Release

Deployment and read-only production smoke pending. No authenticated production revenue claim until an authorized admin session is available.
