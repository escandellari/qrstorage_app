# Storage Box QR App PRD

## Purpose
Build a web app with a mobile-friendly browser experience for households and small teams to manage physical storage boxes using QR codes. Each box has a printed QR label. Scanning the label opens that box in the app so users can view and update its contents quickly.

## Goals
- Let users create and manage boxes and their contents with minimal effort.
- Make scan-to-open the fastest path to the right box on a phone.
- Support shared household or team use with low-friction access.
- Provide a polished MVP suitable for daily personal use.

## Fixed product decisions
- Platform: web app only, optimised for mobile browsers.
- QR behaviour: each QR code contains a URL that opens one box page.
- Connectivity: internet connection required. No offline support in MVP.
- Users: multiple users can share one household or team workspace.
- Storage: cloud-backed data.
- Photos: excluded from MVP.
- AI features: excluded from MVP.
- Import and export: excluded from MVP.
- Printing: one permanent QR label per box, with reprint support.
- Search: global search across all user-entered fields.
- Locations: support simple location entry by default, with an optional fixed structured location mode.
- Security: basic shared-workspace security only.
- Authentication: passwordless email magic links only.
- Constraints: no subscriptions, no native mobile app, no high-friction login.

## Core user journeys

### Create a box
A user can create a box by entering a box name and optional supporting details such as location and notes. The system generates a unique box code automatically, creates a QR label for that box, and makes the box available in the shared workspace.

### Manage contents
A user can open a box page, add items, edit items, remove items, update quantities, assign categories, and edit notes. A box may exist with no items.

### Scan a box
A user scans a printed QR label with a phone and lands on the correct box page in the browser. The page must be mobile-friendly and immediately useful for viewing and editing contents.

### Search inventory
A user can search across boxes and items from anywhere relevant in the app and open the correct box from the results.

### Print a label
A user can open a box and print a clean single-label view containing the QR code and the key box identifier details.

## Functional requirements

### Box management
- Users can create, view, edit, archive, and restore boxes, subject to access rights.
- Every box has an automatically generated, unique, human-readable box code.
- The box code and QR label are permanent for the life of the box and continue to work after renaming, moving, archiving, and restoring.
- Users can reprint an existing label but cannot replace a box with a different code.
- Duplicating a box's contents creates a new box with a new box code and new QR label.
- The box code is visible on the box page, in search results, and on the printed label.
- A box stores a name, optional location details, and optional notes.
- Archived boxes remain identifiable but are clearly marked as archived.

### Item management
- Users can add, edit, and delete items within a box.
- Each item includes a name and may include quantity, category, and notes.
- A box can contain up to 500 items.
- Boxes with no items are valid and show a helpful prompt to add the first item.

### Location behaviour
- The default box form uses a simple free-text location field.
- Users can optionally expand location entry into a structured path with up to four optional levels: site or building, room, storage area, and shelf or position.
- Structured location levels are fixed for MVP and cannot be customised per workspace.
- Users are never required to complete both location modes.
- The box page shows one clear saved location summary.
- On mobile, structured location entry stays hidden until requested.
- The saved structured location appears everywhere as one concise summary in order, including on the box page, in search results, and on labels when space allows.

### QR code and label behaviour
- The system generates one QR code per box.
- Scanning the code opens that box page, not a generic landing page.
- The box page supports immediate viewing and editing after scan.
- The printable label includes the QR code, the box code, and the box name if present. It may also include a short location summary if space allows.
- The print view is clean, readable, and suitable for normal paper or label stock.

### Search behaviour
- Search is available from the main inventory screen and from a persistent search action on box pages.
- Search covers box codes, box names, locations, notes, item names, item categories, and item notes.
- Each result shows whether it is a box or item match, the box code, box name, location, and a short preview of the matched field.
- Item matches also show the item name and the parent box.
- Tapping any result opens the relevant box page.
- Exact box-code and title matches rank ahead of broader matches.
- Results show the first 50 matches in ranked order and offer load more in batches of 50 when more matches exist.
- Archived boxes and items in archived boxes are excluded by default and appear only when the user chooses to include archived results.
- Search results remain compact and scrollable on mobile.

### Shared access
- Multiple members of one household or team can access the same inventory.
- Access must be low friction and suitable for non-technical users.
- The MVP uses two permission levels only: owner and member.
- Owners can perform all workspace actions, including inviting and removing members.
- Members can create, edit, archive, restore, and print labels for boxes and items within the workspace.
- When a member attempts an owner-only action, the app shows a clear permission message and directs them to contact the workspace owner.

## Authentication and access behaviour
- The MVP uses passwordless email magic links only.
- A signed-out user who scans a QR code sees a lightweight sign-in screen that explains access is required.
- After successful sign-in, the user returns directly to the originally scanned box.
- Invites are email links tied to a specific workspace.
- A newly invited user confirms their email through the same magic-link flow, joins the intended workspace, and lands directly on the intended box or inventory screen.
- A user signed in to the wrong household or team sees a clear access-denied screen that names the current workspace.
- Where possible, the user can switch workspace from that screen. Otherwise, they are prompted to request an invite.
- An expired or invalid invite opens a dedicated error screen with a clear action to resend or request a new invite.
- After recovering access, the user lands on the originally intended box page.

## Error and edge-case behaviour

### Missing or invalid boxes
- If a QR code is invalid or the box no longer exists, show a neutral not-found screen.
- The not-found screen must not expose box details.
- The not-found screen offers a clear path back to the main box list.

### Archived boxes
- Scanning or opening an archived box shows a limited archived-box screen.
- That screen shows the box code, archived status, and an action to return to inventory.
- Only users with edit access can restore or reopen an archived box.
- Users without edit access are directed to contact the household or team owner.

### Concurrent editing
- The app must prevent silent overwrites.
- Non-overlapping updates save normally, including edits to different items or box details changed separately from item details.
- If two users change the same box field, the same item field, or the same item quantity before the second save, the second user sees a conflict screen.
- The conflict state shows the latest saved content and asks the user to review and reapply their edits.
- If an item was deleted by another user, any attempted save to that item is blocked and the user sees that the item was removed.

### Search empty and broad states
- If there are no matches, show an empty state that includes the search term and a clear reset action.
- Broad searches must remain usable on mobile through compact, scrollable results.

### Validation
- A box requires a name.
- An item requires at least a name.
- Box names are limited to 80 characters.
- Box notes are limited to 1,000 characters and show a live remaining-character hint.
- Item names are limited to 80 characters.
- Category values are limited to 40 characters.
- Quantity must be a whole number from 1 to 9,999.
- Missing required fields show inline messages beside the relevant inputs and keep the user on the same screen.
- Values outside allowed limits show plain-language validation messages and prevent save until corrected.
- Duplicate-looking names may still be saved, but the app should show a soft warning.

## Non-functional requirements
- Mobile use is the primary experience.
- The app must feel fast for common actions such as scanning, opening a box, saving edits, and searching.
- The interface must be clear, lightweight, and polished.
- Key flows must require minimal taps: create a box, add items, scan and edit, search, and print.
- The system must be stable enough for daily use by a household or small team.
- Security must prevent unauthorised browsing of box pages while keeping sign-in lightweight.

## In scope
- Shared box inventory for a household or team.
- Box creation, editing, archiving, and restoration.
- Item creation, editing, deletion, and quantity tracking.
- QR label generation and single-label printing.
- Scan-to-open box pages in a mobile browser.
- Global inventory search.
- Passwordless email magic-link authentication and invitation flow.
- Basic shared-workspace access control with owner and member roles.

## Out of scope
- Native mobile apps.
- Offline mode.
- Photo upload or image storage.
- AI features.
- CSV or other import and export tools.
- Bulk label sheets.
- Advanced permissions, analytics, or enterprise security features.
- Subscriptions or billing.

## Acceptance criteria
The MVP is complete when a household or team member can:
- sign in with low friction through passwordless email magic links;
- create a box with a required name and optional location and notes;
- receive an automatically generated box code;
- generate and print a single QR label for that box;
- scan the label on a phone and open the correct box page;
- view and edit box contents immediately after scanning;
- add, edit, and remove items with name, quantity, category, and notes;
- search across boxes and items and confidently choose the correct result on mobile;
- encounter clear handling for signed-out access, wrong-workspace access, invalid invites, invalid QR codes, archived boxes, validation failures, and edit conflicts.