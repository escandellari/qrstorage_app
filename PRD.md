# Storage Box QR App PRD

## Problem Statement
Households and small teams need a simple way to track what is inside physical storage boxes without typing through long lists or remembering where things were put. The product solves this by giving each box a permanent QR label that opens the right box in a mobile-friendly web app.

## Goals
- Make scan-to-open the fastest path to the right box on a phone.
- Let shared workspaces create, update, search, and recover box information with minimal friction.
- Preserve low-friction passwordless access.
- Deliver the next phase as a React app with a clearer, more polished Tailwind-based interface.

## Technical Direction
- Project type: mobile-first web app for shared household or team box inventory.
- Stack and ecosystem: existing Node.js application, with React for application screens and Tailwind CSS for styling.
- Delivery approach: hybrid migration inside the existing Node app. React owns interactive screens, while the Node server continues to own routing, authentication, redirects, and data mutations.
- Authentication and sessions: passwordless email magic links with workspace-scoped membership and session switching.
- Persistence: retain the current file-backed JSON persistence model in this phase.
- Testing baseline: keep the existing Node integration suite and add Playwright browser coverage for critical user journeys before cutover.

## Fixed product decisions
- Platform: web app only, optimised for mobile browsers.
- QR behaviour: each QR code contains a URL that opens one box page.
- Connectivity: internet connection required. No offline support in this phase.
- Users: multiple users can share one household or team workspace.
- Storage: cloud-backed behaviour is still the product intent, but this phase does not replace the current persistence model.
- Photos: excluded.
- AI features: excluded.
- Import and export: excluded.
- Printing: one permanent QR label per box, with reprint support.
- Search: global search across saved box and item text.
- Security: basic shared-workspace security only.
- Authentication: passwordless email magic links only.
- Constraints: no subscriptions, no native mobile app, no high-friction login.
- Route ownership: all user-facing screens that present application content or forms move to React in this phase. Magic-link completion, QR entry, and workspace switching may remain server-handled only where they immediately redirect or show a minimal transitional message.
- Rollout: production ships as a full cutover to the React UI once parity, regression coverage, and end-to-end verification are complete. Old and new interfaces may coexist only behind an internal development switch before release.
- Visual direction: a pragmatic Tailwind-based redesign led by product judgement is the source of truth for presentation in this phase.

## Core user journeys

### Create and maintain a box
A signed-in member creates a box with a name and optional location and notes, then updates the box later without changing its permanent box code. A member can also archive, restore, or duplicate a box while keeping the original box link stable.

### Manage box contents
A signed-in member opens a box, adds items, edits item details, removes items, and sees clear feedback for validation problems or edit conflicts. A box can remain empty and should still prompt the next useful action.

### Scan a label
A user scans a printed QR label and lands on the correct box route. If the user is signed out, the product asks them to sign in and returns them to the intended box after authentication.

### Search inventory
A user searches across boxes and items, reviews compact ranked results, and opens the correct parent box. Search must stay usable on mobile and support archived results when explicitly requested.

### Share workspace access
An owner invites another person by email, and the invitee joins through the same magic-link flow. If a signed-in user reaches a box in the wrong workspace, the product offers a safe recovery path without exposing box details.

## Done
- Passwordless sign-in is live, including neutral email confirmation, expired-link recovery, session creation, and return-to-box behaviour after authentication.
- Shared workspace access is live, including owner-sent invites, invite acceptance, wrong-workspace recovery, workspace switching, request-invite guidance, and owner-only member management with last-owner protection.
- Box management is live, including box creation, box detail pages, permanent box codes, box editing, simple and structured location editing, archive and restore, duplicate box, and soft duplicate-name warnings.
- Box item management is live, including add, edit, delete, empty-box prompts, quantity, category, notes, item limits, and conflict handling that prevents silent overwrites.
- QR and print flows are live, including permanent scan URLs, scan-to-open routing, and printable single-label pages with QR code, box code, name, and optional location.
- Inventory search is live, including box and item matches, ranking, pagination, archived filtering, empty states, and links back to the parent box.

## Next
This phase converts the existing product into a React web app styled with Tailwind CSS, while preserving all current user-visible behaviour and deep links. The goal is a faster, clearer, more consistent interface rather than new product scope.

### User stories
- As a signed-in member, I can use the inventory, box, search, and workspace screens in a React interface that feels fast and touch-friendly on mobile.
- As a user scanning a QR label, I can still land on the correct box, sign in if required, and return to that box without confusion.
- As a workspace owner, I can still invite people and manage members from the React app with the same permissions and recovery paths.
- As a user printing labels, I can still open a clean print view that keeps the QR code and key identifiers readable.

### Functional requirements
- The primary application UI must move to React, with Tailwind CSS used as the default styling approach for layout, spacing, typography, form states, navigation, and feedback states.
- This phase must use a hybrid delivery model inside the existing Node app. React must own interactive application screens, while the Node server must continue to own routing, authentication, redirects, and data mutations.
- Existing route paths and behaviours must remain stable for inventory, sign-in, magic-link completion, box pages, QR entry, search, invite acceptance, workspace switching, member management, and label printing.
- All user-facing screens that display application content or forms must move to React, including sign-in entry, inventory, search, box detail and edit states, workspace member management, access-denied and request-invite states, invite acceptance feedback screens, and the label print view.
- Magic-link completion, QR entry, and workspace switching may remain server-handled endpoints where their role is validation and redirection rather than sustained UI.
- The React app must support all current box capabilities: create, edit, archive, restore, duplicate, view permanent box codes, and display saved location summaries.
- The React app must support all current item capabilities: create, edit, delete, view empty states, enforce limits, and show clear validation and conflict feedback.
- The React app must support all current search capabilities: ranked box and item matches, archived filtering, empty states, and paginated loading.
- The React app must support all current access capabilities: passwordless sign-in, invite acceptance, owner-only actions, access-denied recovery, and return-to-intended-box behaviour.
- Visual design must be mobile-first, with clear hierarchy, touch-sized controls, compact search results, and consistent feedback for loading, success, validation, empty, archived, conflict, and access-denied states.
- The visual source of truth for this phase is a pragmatic Tailwind-based redesign led by product judgement and anchored to the behaviours and states defined in this PRD.
- Label printing may remain a dedicated print-focused view, but it must align visually with the new design language and preserve QR readability.

### Edge cases and error handling
- Deep links to box and QR routes must still work for signed-out users and must return them to the intended box after sign-in.
- Wrong-workspace access must still hide target box details and offer workspace switching or request-invite guidance.
- Archived boxes must still open in an archived state that blocks normal editing and offers restore where allowed.
- Conflict, deleted-item, expired-link, invalid-invite, invalid-box, and no-results states must remain explicit and understandable in the React UI.
- Mobile layouts must remain usable for long names, long notes, and search result sets that span multiple pages.

### Scope boundaries for this phase
- In scope: frontend migration to React, Tailwind-based redesign, parity for all existing user journeys, and regression coverage for the migrated experience.
- Out of scope: offline support, native mobile apps, new auth providers, new permissions, photos, AI features, import/export, billing, analytics, or persistence replacement.

## Non-functional requirements
- Mobile remains the primary experience.
- The interface must feel faster and more coherent than the current server-rendered UI.
- On a modern mobile browser with a normal 4G connection, a signed-in user scanning a QR code must reach a usable box page within 2 seconds.
- On a modern mobile browser with a normal 4G connection, opening a search result must show the destination box within 2 seconds.
- Saving a box or item change must show progress feedback within 500 milliseconds and complete with success or validation feedback within 2 seconds in normal conditions.
- On slower networks, the interface must remain responsive, clearly show loading state, and never leave the user unsure whether an action succeeded.
- Deep links, printed QR labels, and post-auth redirects must remain reliable through the migration.
- The migrated app must retain automated regression coverage for the main user journeys before the old UI is considered replaceable.
- Replacement of the old UI requires the existing Node integration suite to pass and Playwright browser coverage for sign-in, magic-link return-to-box, QR-to-box access, box create and edit, item create and edit and delete, search, invite acceptance, wrong-workspace recovery, workspace switching, member management, and label printing.

## In scope
- Shared box inventory for a household or team.
- Box creation, editing, archiving, restoration, and duplication.
- Item creation, editing, deletion, and quantity tracking.
- QR label generation and single-label printing.
- Scan-to-open box pages in a mobile browser.
- Global inventory search.
- Passwordless email magic-link authentication and invitation flow.
- Basic shared-workspace access control with owner and member roles.
- React and Tailwind migration of the existing user experience.

## Out of scope
- Native mobile apps.
- Offline mode.
- Photo upload or image storage.
- AI features.
- CSV or other import and export tools.
- Bulk label sheets.
- Advanced permissions, analytics, or enterprise security features.
- Subscriptions or billing.
- A backend rewrite in this phase.

## Alternatives Considered
- Pure client-side single-page application: rejected because it adds routing and authentication complexity without supporting the parity-focused goal.
- Full server-rendered React: considered, but not chosen because the hybrid model keeps migration risk lower while still improving perceived speed.

## Acceptance criteria
This phase is complete when a household or team member can complete every currently supported sign-in, box, item, QR, search, invite, workspace-switching, and member-management flow through the React interface without losing existing behaviour. The product must use Tailwind CSS as the primary styling system, preserve current URLs and recovery paths, and keep printable labels readable and reliable. Production cutover happens only when all in-scope routes reach behavioural parity, the required Node integration and Playwright regression suites pass, and print, deep-link, and post-auth redirect flows are verified end to end.