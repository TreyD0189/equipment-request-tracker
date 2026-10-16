# Priority Filter Specification

## Goal

Help managers focus on equipment requests by filtering the existing request list by priority.

## User Need

Managers need to view one priority at a time and quickly return to all requests without losing requests or repeating their selection after a refresh.

## Functional Rules

1. Provide a visibly labeled, keyboard-accessible priority filter with exactly four choices: All, Low, Normal, and High. Only one choice can be selected at a time.
2. Selecting all will show all requests.
3. Remember the selected choice in the current browser using localStorage and restore it after a refresh. A missing or unrecognized saved choice defaults to All.
4. Low, Normal, and High show only requests whose explicitly stored priority matches that choice.
5. Older requests without a stored priority appear only under All. Do not assign or persist Normal to those requests as part of loading, filtering, or saving other requests. Their priority cell displays "Not specified". Existing explicitly stored priorities remain unchanged.
6. Keep the list in newest-first order using each request's createdAt timestamp. Requests with the same timestamp retain their relative order.
7. When a selected priority has no matches, display "No requests match the selected priority." Hide the empty table and provide a "Show all requests" button. The button selects All, displays all requests, and remembers All for refresh.
8. When there are no requests at all, retain the application's existing empty-list guidance. Keep the filter available.
9. The request count reflects the number of requests currently displayed.
10. Adding a request preserves the active filter. The new request appears immediately if it matches the active filter or All is selected. Otherwise it remains saved and appears when the appropriate filter is selected.
11. Changing filters changes only the view and the saved filter preference; it does not rewrite, remove, or change stored requests.
12. If filter preference storage is unavailable, filtering still works during the current page session. Do not report a successful request as failed solely because saving the filter preference failed.

## Constraints

- Use the existing plain HTML, CSS, and JavaScript application.
- Require no login, database, framework, external service, or production dependency.
- Preserve the existing request storage key, request fields, explicit priorities, and all valid existing requests.
- Preserve request creation, required-field validation, the Normal default for new requests, and existing saved-request behavior.
- Keep business and storage logic in src/request-store.js and browser interaction in src/app.js.
- Use safe DOM APIs and retain visible labels and keyboard focus indicators.

## Acceptance Criteria

- **AC1 — Filter choices:** The request list has a visible priority label and a keyboard-operable control containing All, Low, Normal, and High; selecting one replaces the previous selection.
- **AC2 — Initial and restored selection:** With no saved filter preference, opening the application selects All and shows every request. Selecting High and refreshing restores High and its matching requests. An unrecognized saved preference opens as All.
- **AC3 — Exact matches:** With one explicitly prioritized request at each priority, selecting Low, Normal, or High shows only the request at that priority. Selecting All shows all three.
- **AC4 — Older requests:** With an existing request that has no priority property, All shows that request with "Not specified" in its priority cell. Low, Normal, and High each exclude it. After refresh and after adding another request, the older request still exists without an assigned priority.
- **AC5 — Ordering:** Given requests with different creation timestamps, All and each priority view display matching requests newest first. Equal timestamps retain their relative order.
- **AC6 — No matches and recovery:** With existing requests but none at the selected priority, the page shows "No requests match the selected priority.", hides the table, and offers "Show all requests". Activating it selects All and restores every request; refreshing retains All.
- **AC7 — No requests:** With no stored requests, the existing empty-list guidance and priority filter remain available. The displayed count is zero.
- **AC8 — Counts and adding requests:** The count equals the visible row count. With High active, adding a High request displays it immediately; adding a Low request saves it without displaying it or changing High. Selecting Low then shows the saved Low request.
- **AC9 — Data preservation and existing behavior:** Switching through every filter leaves the stored request data unchanged. A valid request still saves and survives refresh; required-field validation still rejects incomplete submissions; new requests still default to Normal. The application runs without a login or database.
- **AC10 — Preference storage failure:** When reading or writing the filter preference throws, the page still opens and filters work. A failed preference write does not prevent a valid request from being saved through otherwise working request storage.

## Out of Scope

- Selecting multiple priorities at once.
- Changing priorities on existing requests, bulk actions, or automatic assignment of priority to older requests.
- Search, department or date filters, notifications, approval workflows, or a new sorting control.
- Accounts, shared storage, cross-device preferences, databases, or interface redesign.
- Recovering original missing priorities from records that were already saved as Normal before this feature.

## Verification Results

Verified on October 16, 2026 using isolated sample records in local Chromium. No existing user browser data was accessed. All 10 automated tests passed with `npm test`; browser checks below passed with no JavaScript errors. Desktop and mobile layouts were also inspected.

| Criterion | Result | Test performed / how to repeat |
| --- | --- | --- |
| AC1 | Pass | Confirm the visible label and four options. Focus the filter and use Home, Arrow Down, and Enter to select Low with the keyboard. |
| AC2 | Pass | Start without a saved preference: All shows every record. Select High, refresh, and confirm High and its results remain. Set an unsupported saved preference and refresh: All is selected. |
| AC3 | Pass | Load Low, Normal, and High sample requests. Select each priority and confirm only exact matches appear; All restores every record. |
| AC4 | Pass | Load a legacy request without a priority property. Confirm All displays it as Not specified and each priority excludes it. Add another request and refresh; confirm the legacy record still exists without a priority property. |
| AC5 | Pass | Load records out of timestamp order, including two equal timestamps. Confirm All and each priority view are newest first and equal timestamps retain their relative order. |
| AC6 | Pass | With only a Low request, select High. Confirm the no-match message, hidden table, and Show all requests button. Activate the button and refresh: All and the Low request remain visible. |
| AC7 | Pass | Start with an empty request array. Confirm the original No requests yet guidance, available filter, and zero count, including after changing the filter. |
| AC8 | Pass | Select High, add a High request, then add a Low request. Confirm High stays selected, only the High request appears, and the count is one. Select Low to reveal the saved Low request and its correct count. |
| AC9 | Pass | Compare the raw request storage before and after changing every filter: unchanged. Save and refresh to confirm persistence. Submit an empty form to confirm required-field errors and no extra saved record. Confirm Normal defaults on new requests. Run locally without login or database. |
| AC10 | Pass | Make localStorage getItem/setItem throw only for mis4173-equipment-priority-filter. Reload: All opens. Select High and add a valid High request: filtering and request storage still work and Request added is displayed. |

Review: changes are limited to this specification, the filter markup, browser interaction, request/filter storage logic, and related tests. Request storage keeps its original key and records; filtering never writes request data. User content continues to use textContent. No dependencies were added to the application.

