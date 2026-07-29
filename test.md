# Phase 1 — Test Plan

## Setup Commands

```bash
# Start the development server
npm run dev

# Generate Prisma client (after schema changes)
npm run db:generate

# Run database migrations (apply schema to Supabase)
npm run db:migrate

# Seed the database (admin/staff users, stages, services, templates)
npm run db:seed

# Open Prisma Studio to inspect data
npm run db:studio

# Run linter
npm run lint

# Build for production
npm run build
```

---

## Task 1 — Project Setup (Next.js, TypeScript, Tailwind, ESLint)

### Test Steps

1. Run `npm run dev` and confirm the dev server starts on `http://localhost:3000` without errors.
2. Open `http://localhost:3000` — the login page should render with:
   - WAY POINT branding (logo + "Travel Ltd" text) on the left panel
   - A "Staff Portal" sign-in card on the right
   - Email and password input fields
   - A "Sign In" button
3. Run `npm run lint` — should pass with no errors.
4. Run `npm run build` — should compile successfully.
5. Verify the project folder structure exists:
   - `src/app/` — Next.js app router pages
   - `src/components/` — shared components
   - `src/context/` — React context providers
   - `src/lib/` — utilities and Prisma client
   - `prisma/` — database schema and migrations
   - `public/` — static assets
6. Confirm `tailwindcss` is configured — check `src/app/globals.css` imports `@import "tailwindcss"` and CSS variables are defined for `--background`, `--foreground`, `--primary`, etc.

---

## Task 2 — Database Setup (Prisma + Supabase)

### Test Steps

1. Verify `.env` exists with a `DATABASE_URL` pointing to Supabase.
2. Run `npm run db:generate` — should generate Prisma client without errors.
3. Run `npm run db:studio` — Prisma Studio should open and show the schema models:
   - `User` (users table)
   - `WorkflowStage` (workflow_stages table)
   - `ServiceType` (service_types table)
   - `DocumentTemplate` (document_templates table)
4. Confirm the migration file exists at `prisma/migrations/` and was applied.
5. Verify `prisma/schema.prisma` uses `postgresql` provider and `@@map` directives map models to lowercase table names.

---

## Task 3 — UI Shell (Sidebar, Topbar, Dashboard Layout, Components)

### Test Steps

1. Log in as admin (`admin@waypoint.com` / `password123`) — dashboard should load.
2. Verify the **Sidebar** renders with:
   - WAY POINT branding at the top
   - User avatar with initials and role badge
   - Navigation links: Dashboard, Clients, Tasks, Documents, Payments, Quality Review, Reports, Settings
   - Active tab highlighted with primary color
   - Log Out button at the bottom
3. Verify the **Topbar** renders with:
   - Current page title and breadcrumb
   - Search input
   - Theme toggle button
   - Notification bell with dropdown
   - User profile avatar and name
4. Verify **dashboard page** content:
   - Welcome greeting with user name
   - Four metric cards (Active Clients, Visa Pipeline, Pending Reviews, Overdue Tasks)
   - Pipeline Overview panel
   - High-Priority Tasks panel
5. Test tab navigation — click each sidebar item and confirm the content area switches to the correct view.
6. Verify **reusable UI components** exist and render:

   | Component | File | What to check |
   |---|---|---|
   | Button | `src/components/ui/Button.tsx` | Primary, secondary, outline, ghost, destructive variants; loading spinner |
   | Card | `src/components/ui/Card.tsx` | Card with header, content, footer; border and shadow styling |
   | Badge | `src/components/ui/Badge.tsx` | Badge and StatusPill with default, primary, success, warning, danger, info variants |
   | Input | `src/components/ui/Input.tsx` | Input with label, error message, icon support; Select component |
   | Table | `src/components/ui/Table.tsx` | Generic table with typed columns, row click handler, empty state message |
   | EmptyState | `src/components/ui/EmptyState.tsx` | Icon, title, description, optional action button; dashed border styling |
   | DashboardShell | `src/components/DashboardShell.tsx` | Layout wrapper combining Sidebar + Topbar + content area |

7. Verify light/dark theme — toggle the theme button and confirm CSS variables switch.

---

## Task 4 — Seed Data (Users, Stages, Services, Templates)

### Test Steps

1. Run `npm run db:seed` — should complete with:
   ```
   ✓ Admin user: admin@waypoint.com
   ✓ Staff user: staff@waypoint.com
   ✓ 12 workflow stages
   ✓ 6 service types
   ✓ 8 document templates
   Seed complete.
   ```
2. Open Prisma Studio (`npm run db:studio`) and confirm the following records exist:

   **Users table:**
   | Email | Role | Status |
   |---|---|---|
   | admin@waypoint.com | ADMIN | active |
   | staff@waypoint.com | STAFF | active |

   **Workflow Stages table (12 rows):**
   | Order | Slug | Name |
   |---|---|---|
   | 1 | client-inquiry | Client Inquiry |
   | 2 | customer-service-registration | Customer Service Registration |
   | 3 | initial-consultation | Initial Consultation |
   | 4 | payment-service-agreement | Payment & Service Agreement |
   | 5 | document-collection-verification | Document Collection & Verification |
   | 6 | visa-processing | Visa Processing |
   | 7 | quality-review | Quality Review |
   | 8 | application-submission | Application Submission |
   | 9 | application-tracking | Application Tracking |
   | 10 | decision | Decision |
   | 11 | visa-approved-path | Visa Approved Path |
   | 12 | visa-refused-path | Visa Refused Path |

   **Service Types table (6 rows):** UK Tourist Visa, Canada Study Permit, Schengen Tourist Visa, USA B1/B2 Visa, Australia Visitor Visa, UK Student Visa.

   **Document Templates table (8 rows):** Passport, Photographs, Bank Statements, Employment Letter, Travel Itinerary, Accommodation Booking, Travel Insurance, Proof of Residence (all linked to UK Tourist Visa).

3. Verify password hashing works — attempt to log in with:
   - Correct credentials (`admin@waypoint.com` / `password123`) → should succeed
   - Wrong password (`admin@waypoint.com` / `wrongpass`) → should show error
   - Non-existent email (`nobody@waypoint.com` / `password123`) → should show error

---

# Phase 2 — Test Plan: Authentication And Roles

## Task 1 — Login/Logout Flow

### Test Steps

1. **Login page renders correctly:**
   - Navigate to `http://localhost:3000` (unauthenticated) — a split-panel login screen should display with WAY POINT branding on the left and a "Staff Portal" sign-in card on the right.
   - Email and password input fields are present.
   - "Sign In" button is visible.
   - Demo account quick-fill buttons for "Admin Profile" (`admin@waypoint.com`) and "Staff Profile" (`staff@waypoint.com`) are shown.

2. **Demo account quick-fill:**
   - Click "Admin Profile" — the email field populates with `admin@waypoint.com` and password with `password123`.
   - Click "Staff Profile" — the email field populates with `staff@waypoint.com` and password with `password123`.
   - The active demo button is visually highlighted.

3. **Login with valid admin credentials:**
   - Enter `admin@waypoint.com` / `password123` and click "Sign In".
   - The dashboard loads with a welcome greeting: "Welcome back, admin@waypoint.com!".
   - Sidebar and Topbar are visible.
   - Admin-protected tabs are accessible (Payments, Quality Review, Reports, Staff Management).

4. **Login with valid staff credentials:**
   - Enter `staff@waypoint.com` / `password123` and click "Sign In".
   - The dashboard loads with a welcome greeting: "Welcome back, staff@waypoint.com!".
   - Sidebar renders without admin-only tabs.

5. **Login with invalid credentials:**
   - Enter `admin@waypoint.com` / `wrongpass` — should display "Invalid email or password" error banner.
   - Enter `nobody@waypoint.com` / `password123` — should display "Invalid email or password" error banner.

6. **Login with empty fields:**
   - Submit the form with both fields empty — the browser's native required validation should prevent submission.
   - Submit with only email filled — browser validation prevents submission.

7. **Loading state during login:**
   - Submit valid credentials — the "Sign In" button should show a spinner and become disabled while the request is in progress.

8. **Logout flow:**
   - Click the "Log Out" button at the bottom of the Sidebar.
   - The session is cleared and the login screen reappears.
   - Navigating back to `http://localhost:3000` should show the login page, not the dashboard.

9. **Session persistence:**
   - Log in, then refresh the browser page — the user should remain authenticated and the dashboard should display.
   - Log in, close the tab, open a new tab to `http://localhost:3000` — the user should still be authenticated.

10. **API endpoint — POST /api/auth/login:**
    - Send `POST /api/auth/login` with `{ "email": "admin@waypoint.com", "password": "password123" }` — returns 200 with `{ user: { id, name, email, role, status } }` (no passwordHash).
    - Send with invalid password — returns 401 with `{ error: "Invalid email or password" }`.
    - Send with missing fields — returns 400 with `{ error: "Email and password are required" }`.

---

## Task 2 — Admin/Staff Role Model and Route Protection

### Test Steps

1. **Role field in database:**
   - Open Prisma Studio and inspect the `users` table — each user has a `role` column with values `admin` or `staff`.
   - Verify `admin@waypoint.com` has role `admin` and `staff@waypoint.com` has role `staff`.

2. **Admin user sees all navigation tabs:**
   - Log in as admin — the Sidebar shows: Dashboard, Clients, Tasks, Documents, Payments, Quality Review, Reports, Staff Management, Settings.
   - All tabs are clickable and navigate to the correct content area.

3. **Staff user sees restricted navigation:**
   - Log in as staff — the Sidebar shows only: Dashboard, Clients, Tasks, Documents, Settings.
   - Admin-only tabs (Payments, Quality Review, Reports, Staff Management) are not visible.

4. **Client-side route protection:**
   - Log in as staff and try to directly set the tab to `payments` via browser console — the page should automatically redirect to `dashboard`.
   - The same applies for `reviews`, `reports`, and `staff` tabs.

5. **Topbar shows user role:**
   - Log in as admin — the Topbar user section displays the user's initials, name, and role badge showing "admin".
   - Log in as staff — the role badge shows "staff".

6. **Supabase middleware is configured:**
   - Verify `src/middleware.ts` imports and calls `updateSession` from `@/utils/supabase/middleware`.
   - The middleware matcher excludes static assets and favicon.

7. **Auth context exposes role:**
   - The `useAuth()` hook returns `user.role` (uppercased, e.g., "ADMIN" or "STAFF").
   - `isAuthenticated` flag is `true` when a user is logged in.

---

## Task 3 — Staff Management Screen (Admin Only)

### Test Steps

1. **Accessing the Staff Management tab:**
   - Log in as admin — "Staff Management" appears in the Sidebar.
   - Click "Staff Management" — the content area shows the staff management header and table.
   - Log in as staff — "Staff Management" is not visible in the Sidebar.

2. **Staff list table:**
   - The table shows columns: Staff Member (avatar + name + email), Access Role, Phone, Status, Actions.
   - All staff members from the database are listed.
   - Admin and staff users are differentiated by role badge color (purple for admin, blue for staff).

3. **"Add Staff Member" button:**
   - Clicking the button opens a modal with the title "Add New Staff Member".
   - Modal has a cancel button in the top-right corner.

4. **Add staff form validation:**
   - Submit the form with empty fields — "Full Name" and "Email Address" are required.
   - Enter a name, a valid email, and select a role — form submits successfully.
   - Try to add a user with an existing email (`admin@waypoint.com`) — should show error "A user with this email address already exists".

5. **Add staff success flow:**
   - Fill in: Name "Test User", Email "test@waypoint.com", Phone "1234567890", Role "Staff".
   - Click "Create Account" — success message appears: "Staff member added successfully! Default password is 'password123'."
   - The new user appears in the staff table.
   - Close the modal — form fields are reset.

6. **Toggle role action:**
   - Click "Toggle Role" on a staff user — their role switches from STAFF to ADMIN (or vice versa).
   - The role badge updates instantly.
   - Refresh and verify the change persists.

7. **Activate/Deactivate action:**
   - Click "Deactivate" on an active user — the button changes to "Activate" (green) and the status badge shows "inactive".
   - Click "Activate" — the user becomes "active" again.

8. **API endpoint — GET /api/staff:**
   - `GET /api/staff` — returns 200 with `{ users: [...] }` containing all users, sorted by `createdAt` descending.
   - Password hash is stripped from the response.

9. **API endpoint — POST /api/staff:**
   - `POST /api/staff` with `{ name, email, role: "ADMIN" }` — returns 201 with the new user.
   - Password is hashed with bcrypt (default "password123").
   - Missing required fields returns 400.

10. **API endpoint — PATCH /api/staff:**
    - `PATCH /api/staff` with `{ userId, role: "STAFF" }` — updates the user's role.
    - `PATCH /api/staff` with `{ userId, status: "inactive" }` — deactivates the user.
    - `PATCH /api/staff` with `{ userId, name, phone }` — updates profile fields.
    - `PATCH /api/staff` with `{ userId, password: "newpass" }` — hashes and updates the password.
    - Missing userId returns 400.

---

## Task 4 — User Profile Menu and Password/Account Settings

### Test Steps

1. **Accessing Settings tab:**
   - Both admin and staff users see "Settings" in the Sidebar.
   - Clicking it shows "Account & Platform Settings" page.

2. **Profile Details form:**
   - Email field is displayed but disabled (read-only).
   - Display Name field is editable and pre-filled with the current user's name.
   - Contact Number field is editable and pre-filled with the current user's phone (or empty).
   - "Save Changes" button submits the form.

3. **Update profile:**
   - Change the display name to "Updated Admin" and click "Save Changes".
   - Success message: "Profile updated successfully!".
   - The name updates in the Topbar and localStorage session cache.
   - Refresh the page — the new name persists.

4. **Change password form:**
   - "New Password" input with placeholder "Min. 6 characters".
   - "Change Password" button submits the form.

5. **Password validation:**
   - Enter a password shorter than 6 characters — error: "Password must be at least 6 characters long.".
   - Enter a password of 6+ characters — success: "Password updated successfully! Log in next time with your new password.".
   - Log out, log in with the new password — succeeds.
   - Log in with the old password — fails with "Invalid email or password".

6. **General Platform Preferences:**
   - "Enable in-app notifications" toggle is present and clickable.
   - "Restrict document visibility" toggle is present and clickable.
   - Toggles are functional (UI state changes on click).

7. **Session cache update on profile change:**
   - Update the display name — verify `localStorage.setItem("waypoint_user", ...)` is called with updated values.
   - Refresh the page after profile update — user data reflects the changes.

---

# Phase 3 — Test Plan: Client And Application Management

## Task 1 — Client Database Model and API/Actions

### Setup Commands

```bash
# Start the dev server (required for API tests)
npm run dev

# Regenerate Prisma client after model changes
npm run db:generate

# Apply the migration to the database
npx prisma migrate dev

# Open Prisma Studio to inspect client records
npm run db:studio
```

---

### Test Steps

1. **Prisma schema validation:**

   ```bash
   # Check schema compiles and client is generated
   npm run db:generate
   ```
   Expected: Completes with "✔ Generated Prisma Client" and no errors.

   ```bash
   # Verify the Client model is present in the schema
   grep -A 20 "model Client" prisma/schema.prisma
   ```
   Expected: Client model with all fields including `fileNumber`, `firstName`, `lastName`, `email`, `phone`, `address`, `passportNumber`, `dateOfBirth`, `source`, `createdById`, `assignedStaffId`, `@@map("clients")`.

   ```bash
   # Verify reverse relations on User model
   grep -A 3 "clientsCreated\|clientsAssigned" prisma/schema.prisma
   ```
   Expected: `clientsCreated Client[] @relation("ClientCreatedBy")` and `clientsAssigned Client[] @relation("ClientAssignedStaff")` on the User model.

2. **Migration file exists:**

   ```bash
   # Check migration file
   cat prisma/migrations/20260720000000_add_clients/migration.sql
   ```
   Expected: SQL with `CREATE TABLE "clients"`, a unique index on `"fileNumber"`, and foreign keys referencing `"users"("id")` for both `createdById` and `assignedStaffId`.

3. **API — GET /api/clients (list all):**

   ```bash
   # Fetch all clients
   curl -s http://localhost:3000/api/clients | jq
   ```
   Expected: Returns 200 with `{ clients: [] }` (empty array if no clients exist yet). Each client includes nested `createdBy` and `assignedStaff` objects.

4. **API — POST /api/clients (create client, required fields only):**

   ```bash
   # Create a new client with required fields
   curl -s -X POST http://localhost:3000/api/clients \
     -H "Content-Type: application/json" \
     -d '{
       "firstName": "John",
       "lastName": "Doe",
       "email": "john@example.com",
       "phone": "+1234567890",
       "source": "website",
       "createdById": 1
     }' | jq
   ```
   Expected: Returns 201 with the new client object. `fileNumber` is auto-generated in format `WP-YYYY-NNNN`.

   ```bash
   # Try creating with missing required fields
   curl -s -X POST http://localhost:3000/api/clients \
     -H "Content-Type: application/json" \
     -d '{"firstName": "NoEmail"}' | jq
   ```
   Expected: Returns 400 with `{ error: "First name, last name, email, phone, source, and createdById are required" }`.

5. **API — POST /api/clients (with optional fields):**

   ```bash
   # Create a client with all fields including optional ones
   curl -s -X POST http://localhost:3000/api/clients \
     -H "Content-Type: application/json" \
     -d '{
       "firstName": "Jane",
       "lastName": "Smith",
       "email": "jane@example.com",
       "phone": "+9876543210",
       "address": "123 Main St, Lagos",
       "passportNumber": "A12345678",
       "dateOfBirth": "1990-05-15T00:00:00.000Z",
       "source": "referral",
       "createdById": 1,
       "assignedStaffId": 2
     }' | jq
   ```
   Expected: Returns 201. All optional fields are stored. `dateOfBirth` stored as timestamp. `assignedStaff` nested object includes staff name and email.

6. **API — PATCH /api/clients (update client):**

   ```bash
   # Update client name
   curl -s -X PATCH http://localhost:3000/api/clients \
     -H "Content-Type: application/json" \
     -d '{"id": 1, "firstName": "UpdatedJohn", "lastName": "UpdatedDoe"}' | jq
   ```
   Expected: Returns 200 with updated client. Only the sent fields change.

   ```bash
   # Clear optional fields by setting to null
   curl -s -X PATCH http://localhost:3000/api/clients \
     -H "Content-Type: application/json" \
     -d '{"id": 1, "address": null, "passportNumber": null}' | jq
   ```
   Expected: Returns 200. `address` and `passportNumber` are now `null`.

   ```bash
   # Reassign staff
   curl -s -X PATCH http://localhost:3000/api/clients \
     -H "Content-Type: application/json" \
     -d '{"id": 1, "assignedStaffId": 2}' | jq
   ```
   Expected: Returns 200. `assignedStaff` nested object reflects the new staff member.

   ```bash
   # Missing id should fail
   curl -s -X PATCH http://localhost:3000/api/clients \
     -H "Content-Type: application/json" \
     -d '{"firstName": "NoId"}' | jq
   ```
   Expected: Returns 400 with `{ error: "Client ID is required" }`.

7. **Server action — getClientsAction:**

   ```bash
   # Test via a quick Node.js script
   node -e "
   const { getClientsAction } = require('./dist/app/actions/clientActions.js');
   getClientsAction().then(console.log);
   "
   ```
   Alternatively, test from the browser console or a React component:
   ```typescript
   import { getClientsAction } from "@/app/actions/clientActions";
   const { clients } = await getClientsAction();
   // clients contains array with nested createdBy and assignedStaff
   ```

8. **Server action — getClientAction:**

   ```typescript
   import { getClientAction } from "@/app/actions/clientActions";

   const { client } = await getClientAction(1);
   // client contains the client object with relations

   const { client: none } = await getClientAction(9999);
   // none === null for non-existent id
   ```

9. **Server action — createClientAction:**

   ```typescript
   import { createClientAction } from "@/app/actions/clientActions";

   const { client } = await createClientAction({
     firstName: "Alice",
     lastName: "Wonder",
     email: "alice@example.com",
     phone: "+1111111111",
     source: "walk-in",
     createdById: 1,
   });
   // client.fileNumber === "WP-2026-0003" (increments correctly)
   ```

10. **Server action — updateClientAction:**

    ```typescript
    import { updateClientAction } from "@/app/actions/clientActions";

    const { client } = await updateClientAction(1, { firstName: "Jane" });
    // client.firstName === "Jane"

    const { client: cleared } = await updateClientAction(1, { address: null });
    // cleared.address === null
    ```

11. **Error handling:**

    ```bash
    # Test with invalid JSON body
    curl -s -X POST http://localhost:3000/api/clients \
      -H "Content-Type: application/json" \
      -d 'not-json' | jq
    ```
    Expected: Returns 500 with a server error.

    ```bash
    # Test unhandled route
    curl -s -X PUT http://localhost:3000/api/clients | jq
    ```
    Expected: Returns 405 Method Not Allowed (Next.js default for unhandled methods).

12. **Build verification:**

    ```bash
    # Full production build
    npm run build
    ```
    Expected: "✓ Compiled successfully", "✓ Generating static pages", and `/api/clients` appears with the `ƒ` (Dynamic) marker in the route list.

---

## Task 2 — Client Registration Form

### Setup Commands

```bash
# Start the dev server (required for form testing)
npm run dev

# Open the app in a browser
# Navigate to http://localhost:3000 and log in as admin
```

---

### Test Steps

1. **Clients tab navigation:**

   - Log in as admin (`admin@waypoint.com` / `password123`).
   - Click "Clients" in the Sidebar — the Client Records page loads.
   - Header shows "Client Records" with description "Manage and filter client files and travel history."
   - A "Register Client" button is visible in the top-right area.

2. **Opening the registration modal:**

   - Click "Register Client" — a modal overlay appears with the heading "Register New Client".
   - The modal has a "Cancel" button in the top-right corner.
   - Clicking "Cancel" closes the modal and clears the form.

3. **Registration form fields:**

   The modal contains all required and optional fields matching the Client model:

   - First Name * (text input, placeholder "John")
   - Last Name * (text input, placeholder "Doe")
   - Email * (email input, placeholder "client@email.com")
   - Phone * (text input, placeholder "+1234567890")
   - Address (text input, placeholder "123 Main Street, City")
   - Passport Number (text input, placeholder "A12345678")
   - Date of Birth (date picker)
   - Source * (dropdown with options: Walk-in, Phone, WhatsApp, Referral, Website, Social Media)
   - Assign Staff (dropdown with all staff members from database, default: "Unassigned")

   Fields marked with * are required and use `required` attribute with browser validation.

4. **Submit with required fields only:**

   ```bash
   # Create a client via the API to verify form submission end-to-end
   curl -s -X POST http://localhost:3000/api/clients \
     -H "Content-Type: application/json" \
     -d '{
       "firstName": "Test",
       "lastName": "Client",
       "email": "testclient@example.com",
       "phone": "+1111111111",
       "source": "website",
       "createdById": 1
     }' | jq
   ```
   Expected: Returns 201 with auto-generated `fileNumber` (e.g., `WP-2026-XXXX`).

   **UI verification:**
   - Fill in First Name: "Test", Last Name: "Client", Email, Phone, select Source.
   - Leave optional fields blank.
   - Click "Register Client" — loading spinner shows on button.
   - Success message: "Client registered successfully! File number: WP-2026-XXXX".
   - The new client appears immediately in the table below.

5. **Submit with all fields including optional:**

   - Fill in all fields including Address, Passport Number, Date of Birth, and Assign Staff.
   - Click "Register Client" — success message appears.
   - New client row shows in table with the assigned staff member's name.

6. **Client list table — live data:**

   - After registering clients, the table shows them in descending order by creation date.
   - Columns: File Number (monospace), Client Name (with avatar + email), Phone, Source (badge), Assigned Staff, Actions.
   - The source badge is styled with primary color and capitalized text.
   - "View File" button appears in the Actions column for each row.

7. **Client list table — loading state:**

   - Navigate away from Clients tab and back — the table briefly shows a spinner while fetching data.

8. **Client list table — empty state:**

   - If no clients exist in the database:
     - A user icon is displayed.
     - Text: "No clients registered yet".
     - Subtext: "Click 'Register Client' to add the first client."

9. **Dashboard "New Client inquiry" CTA:**

   - On the Dashboard tab, click the "New Client inquiry" button in the header.
   - Should navigate to the Clients tab.
   - From there, "Register Client" opens the registration modal.

10. **Form validation:**

    - Submit the form with the email field empty — browser native validation prevents submission and shows "Please fill out this field."
    - The form uses `required` attribute on First Name, Last Name, Email, Phone, and Source.

11. **Error handling — duplicate or server error:**

    ```bash
    # Test API error handling that the form would display
    curl -s -X POST http://localhost:3000/api/clients \
      -H "Content-Type: application/json" \
      -d '{"firstName": "NoRequired"}' | jq
    ```
    Expected: Returns 400 with error message.

    - In the UI, any API error displays as a red banner inside the modal.

12. **Staff dropdown populated:**

    The "Assign Staff" dropdown lists all users from the database (fetched from `/api/staff`).
    Each option shows: `Name (role)` — e.g., `Admin User (admin)`.
    Selecting "Unassigned" (empty value) leaves the client without an assigned staff member.

13. **Build verification:**

    ```bash
    npm run build
    ```
    Expected: "✓ Compiled successfully" with no errors.

---

## Task 4 — Task status updates and completion flow

### Test Steps

1. **Inline status dropdown on each row:**

   - Navigate to the Tasks tab.
   - Each task row has a status dropdown with options: To Do, In Progress, Waiting, Done, Cancelled.
   - The dropdown is color-coded to match the current status.

2. **Change status via dropdown:**

   - Select "In Progress" on a TODO task.

   ```bash
   # Verify API was called
   curl -s -X PATCH http://localhost:3000/api/tasks \
     -H "Content-Type: application/json" \
     -d '{"id": <TASK_ID>, "status": "IN_PROGRESS"}' | jq '.task.status'
   ```
   Expected: Returns `"IN_PROGRESS"`.

3. **Mark as Done sets completedAt:**

   - Select "Done" on a task.

   ```bash
   curl -s http://localhost:3000/api/tasks | jq '.tasks[] | select(.id == <TASK_ID>) | .completedAt'
   ```
   Expected: `completedAt` is a non-null timestamp.

4. **Reopening a completed task clears completedAt:**

   - Change a DONE task back to TODO.

   ```bash
   curl -s -X PATCH http://localhost:3000/api/tasks \
     -H "Content-Type: application/json" \
     -d '{"id": <TASK_ID>, "status": "TODO"}' | jq '.task.completedAt'
   ```
   Expected: Returns `null`.

5. **Optimistic local update:**

   - Change a task status via the dropdown — the UI updates immediately without a full page reload.

6. **Build verification:**

   ```bash
   npm run build
   ```
   Expected: "✓ Compiled successfully".

---

## Task 5 — Overdue task indicators and filters

### Test Steps

1. **Overdue tasks highlighted in table:**

   - Create a task with a due date in the past and status not DONE/CANCELLED.

   ```bash
   curl -s -X POST http://localhost:3000/api/tasks \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Overdue test task",
       "clientId": 1,
       "dueDate": "2024-01-01T00:00:00.000Z",
       "priority": "HIGH"
     }' | jq
   ```

   - Navigate to Tasks tab — the overdue task row has a red-tinted background (`bg-red-500/5`).
   - The due date column shows the date in red with an "OVERDUE" badge.

2. **Search bar filters tasks:**

   - Type a task title in the search bar — only matching tasks are shown.
   - Type a client name — tasks for that client are shown.
   - Type a file number — matching tasks are shown.
   - Clear the search — all tasks reappear.

3. **Status filter:**

   - Select "To Do" from the status filter — only TODO tasks are shown.
   - Select "Overdue" — only overdue tasks are shown.
   - Select "All Statuses" — all tasks reappear.

4. **Priority filter:**

   - Select "Urgent" — only URGENT tasks are shown.
   - Select "High" — only HIGH tasks are shown.
   - Select "All Priorities" — all tasks reappear.

5. **Clear filters:**

   - After applying any filter, a "Clear filters" link appears.
   - Click it — all filters reset and all tasks are shown.

6. **Filtered empty state:**

   - Apply a filter that matches no tasks.
   - A search icon is shown with text: "No tasks match your filters".

7. **Overdue counter on dashboard:**

   - The "Overdue Staff Tasks" card on the Dashboard shows the correct count of overdue tasks.

8. **Build verification:**

   ```bash
   npm run build
   ```
   Expected: "✓ Compiled successfully".

---

## Task 6 — Link tasks to workflow stages and client profile

### Test Steps

1. **Client name is clickable in task table:**

   - Navigate to Tasks tab.
   - Click on a client's name in the Client column.
   - The page navigates to that client's profile view.

2. **Client profile shows tasks:**

   - Open a client profile (via "View File" on Clients tab).
   - A "Tasks" card is displayed with all tasks for that client.
   - Each task shows: title, assignee, stage, priority badge, status badge.

3. **Tasks linked to workflow stages:**

   - Create a task with a specific stage (e.g., "DOCUMENT_COLLECTION_VERIFICATION").

   ```bash
   curl -s -X POST http://localhost:3000/api/tasks \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Stage-linked task",
       "clientId": 1,
       "stage": "DOCUMENT_COLLECTION_VERIFICATION",
       "priority": "MEDIUM"
     }' | jq
   ```

   - The stage column in the task table shows the human-readable label ("Document Collection & Verification").
   - The client profile tasks card also displays the stage.

4. **Application dropdown filters by client:**

   - Open the Create Task modal.
   - Select a client — the Application dropdown filters to only show applications for that client.

5. **Stage dropdown populated:

   - The Workflow Stage dropdown in the Create Task modal lists all 12 workflow stages from `STAGE_ORDER`.

6. **Build verification:**

   ```bash
   npm run build
   ```
   Expected: "✓ Compiled successfully" with no errors.

---

# Phase 6 — Test Plan: Documents And Checklists

## Setup

```bash
npm run dev
npx prisma generate
npx prisma db push
```

Log in via the browser at `http://localhost:3000` as admin (`admin@waypoint.com` / `password123`). Register a test client and application if you haven't already.

---

## Task 1 — Create document and checklist template database models

### Test Steps

1. **Schema models exist:**
   - Open `prisma/schema.prisma` — the `DocumentTemplate` model is present with fields: `id`, `name`, `serviceType`, `destinationCountry`, `isRequired`, `sortOrder`, `createdAt`, `updatedAt`.
   - The `Document` model is present with fields: `id`, `clientId`, `applicationId`, `documentType`, `fileName`, `fileUrl`, `status`, `verificationNotes`, `uploadedById`, `verifiedById`, `createdAt`, `updatedAt`.
   - The `DocumentTemplate` model has a `@@unique([name, serviceType])` constraint to prevent duplicate templates.

2. **API endpoint exists:**
   - `curl -v http://localhost:3000/api/documents/templates` returns status 200 with `{ "templates": [] }` (empty initially).
   - `curl -v http://localhost:3000/api/documents` returns status 200 with `{ "documents": [] }`.

3. **Database tables created:**
   - Run `npx prisma db push` — completes without errors.
   - Run `npx prisma studio` — the `document_templates` and `documents` tables appear with correct columns.

4. **Build verification:**
   - `npm run build` — compiles successfully.

---

## Task 2 — Build admin document checklist template management

### Test Steps

1. **Documents tab shows template panel:**
   - Log in and navigate to the Documents tab.
   - Two sections appear: "Checklist Templates" (left panel) and "Uploaded Documents Queue" (right panel).
   - If no templates exist, the left panel shows "No templates yet".

2. **Add a checklist template (admin only):**
   - Click "Add Template" — a modal appears with heading "Add Checklist Item".
   - Fill in: Document Name "Valid Passport", Service Type "UK Tourist Visa", Destination Country "United Kingdom", keep "Required document" checked.
   - Click "Add Template" — the modal closes and the template appears in the left panel.
   - The template shows the name, service type, and a "Required" red badge.

3. **Staff does not see "Add Template" button:**
   - Log out, log in as staff (`staff@waypoint.com` / `password123`).
   - Navigate to Documents tab — the "Add Template" button is not visible.
   - The "Upload File" button IS visible for staff.

4. **Add optional template:**
   - Log back in as admin.
   - Add another template with "Required document" unchecked.
   - The new template shows an "Optional" grey badge.

5. **Prevent duplicate templates:**
   - Try to add another "Valid Passport" with "UK Tourist Visa" again.
   - An error message appears: "A template named ... already exists for this service type".
   - The duplicate is not created.

6. **Build verification:**
   - `npm run build` — compiles successfully.

---

## Task 3 — Build document upload UI on application/client profile

### Test Steps

1. **Open upload modal:**
   - Navigate to the Documents tab.
   - Click "Upload File" — a modal appears with heading "Upload Document".

2. **Form fields:**
   - Document Type (dropdown — populated from checklist templates, includes "Other" option)
   - Client (dropdown — lists all clients, default "No client (unlinked)")
   - File Name (text input, placeholder "e.g. passport_scan.pdf")
   - File Upload (file picker input — allows selecting a file from local filesystem)
   - When a file is selected, its name and size are shown below the input.

3. **Record a document with file:**
   - Select a document type from the templates dropdown.
   - Select a client.
   - Enter a file name.
   - Choose a file using the file picker (any PDF or image).
   - Click "Record Document" — success message appears, modal closes.
   - The new document appears in the Uploaded Documents Queue with status "PENDING" (yellow badge).

4. **Record a document without file:**
   - Open upload modal, fill in type, client, and file name.
   - Do not select a file.
   - Submit — document is recorded without a file attachment.

5. **Record an unlinked document:**
   - Open upload modal, select a type, leave Client as "No client (unlinked)", enter a file name.
   - Submit — the document appears in the queue without a client name.

6. **Queue display:**
   - Each document row shows: file icon, file name, client name and document type, status badge.
   - Status badges: VERIFIED (green), PENDING (yellow), REJECTED (red).
   - The queue header shows the total count of documents.

7. **Build verification:**
   - `npm run build` — compiles successfully.

---

## Task 4 — Add document verification status and notes

### Test Steps

1. **Admin sees verify/reject buttons on pending documents:**
   - As admin, navigate to the Documents tab.
   - Find a PENDING document in the queue.
   - Two buttons appear: "✓ Verify" (green) and "✕ Reject" (red) next to each pending document.
   - Already verified or rejected documents show static status badges, not buttons.

2. **Staff does not see verification buttons:**
   - Log in as staff, navigate to Documents.
   - All documents show static status badges only — no verify/reject buttons.

3. **Verify a document:**
   - As admin, click "✓ Verify" on a pending document.
   - The status immediately changes to a green "VERIFIED" badge.
   - The Verify/Reject buttons disappear — replaced by the static VERIFIED badge.

4. **Reject a document:**
   - As admin, click "✕ Reject" on another pending document.
   - The status immediately changes to a red "REJECTED" badge.
   - The Verify/Reject buttons disappear.

5. **Optimistic update works:**
   - Verify a document — the badge updates instantly without a page reload.

6. **Build verification:**
   - `npm run build` — compiles successfully.

---

## Task 5 — Build document review queue for admin/senior staff

### Test Steps

1. **Pending Review section appears when documents are pending:**
   - As admin, ensure at least one document has PENDING status.
   - Navigate to the Documents tab.
   - A "Pending Review" panel appears below the main grid, with a yellow alert icon.
   - The panel header shows the count of pending documents.

2. **Review queue lists only pending documents:**
   - Each row shows: file icon, file name, client name, document type, uploaded by.
   - Each row has "✓ Verify" and "✕ Reject" buttons.

3. **Act on documents from the review queue:**
   - Click "✓ Verify" on a pending document in the review queue.
   - The document disappears from the queue and shows as VERIFIED in the main grid.
   - The queue count decreases by 1.

4. **Queue disappears when empty:**
   - Verify or reject all pending documents.
   - The "Pending Review" section disappears entirely.

5. **Staff does not see review queue:**
   - Log in as staff.
   - Navigate to the Documents tab.
   - The "Pending Review" section is not visible (even if pending documents exist).

6. **Build verification:**
   - `npm run build` — compiles successfully.

---

## Task 6 — Add missing document indicators to workflow and dashboard

### Test Steps

1. **Dashboard shows Documents Pending Review card:**
   - Navigate to the Dashboard tab.
   - The metric grid includes a "Documents Pending Review" card with a file icon (yellow).
   - The count matches the number of PENDING status documents.

2. **Count updates in real-time:**
   - Note the current pending count on the dashboard.
   - Navigate to Documents, verify a pending document.
   - Return to Dashboard — the count decreases by 1.
   - Record a new document from the Documents tab.
   - Return to Dashboard — the count increases by 1.

3. **Card visible to all roles:**
   - As admin: card is visible.
   - Log in as staff: card is visible (shows count from staff's assigned clients).

4. **Build verification:**
   - `npm run build` — compiles successfully with no errors.

---

# Phase 7 — Test Plan: Payments And Service Agreement

## Setup

```bash
npm run dev
npx prisma generate
```

Log in via the browser at `http://localhost:3000` as admin (`admin@waypoint.com` / `password123`). Have at least two clients on hand — one assigned to a staff member, one unassigned (or assigned to a different staff member) — to test the recording/permission scope below. If a dashboard/tab shows all-zero metrics right after logging in, refresh the page once — this is a pre-existing dev-mode data-loading quirk affecting all tabs (Clients/Tasks/Documents included), not specific to Payments.

---

## Task 1 — Create payment/invoice database model

### Test Steps

1. **Schema model exists:**
   - Open `prisma/schema.prisma` — the `Payment` model is present with fields: `id`, `clientId`, `applicationId`, `invoiceNumber`, `amount`, `currency`, `method`, `status`, `notes`, `receiptFileName`, `receiptUrl`, `recordedById`, `confirmedById`, `createdAt`, `updatedAt`.
   - `Client` and `Application` each have a `payments Payment[]` relation.

2. **API endpoint exists:**
   - `curl http://localhost:3000/api/payments` returns status 200 with `{ "payments": [] }` (empty initially, unauthenticated).

3. **Database table created:**
   - Run `npx prisma migrate status` — shows the `add_payment_model` migration applied, database in sync.
   - Run `npx prisma studio` — the `payments` table appears with the correct columns.

4. **Build verification:**
   - `npm run build` — compiles successfully.

---

## Task 2 — Build payment entry form and payment status display

### Test Steps

1. **Payments tab is visible to both roles:**
   - Log in as admin — "Payments" appears in the sidebar.
   - Log in as staff — "Payments" also appears in the sidebar (previously admin-only).

2. **Record a payment (admin):**
   - Navigate to Payments, click "Record Payment".
   - Select a client, enter an amount, leave currency at the default (NGN), pick a payment method, click "Record Payment".
   - The modal closes and a new row appears in the table with an auto-generated invoice number (`INV-YYYY-NNNN`), the amount formatted as `₦x,xxx.xx`, and a `PENDING` status badge with Confirm/Reject buttons (admin only).

3. **Confirm and reject:**
   - Click "✓ Confirm" on a pending row — the badge changes to a green `CONFIRMED` badge and the action buttons disappear.
   - Record another payment and click "✕ Reject" — the badge changes to a red `REJECTED` badge.

4. **Staff cannot confirm/reject:**
   - Log in as staff — any `PENDING` row shows a static yellow `PENDING` badge instead of Confirm/Reject buttons.

5. **Build verification:**
   - `npm run build` — compiles successfully.

---

## Task 3 — Add invoice number and receipt upload support

### Test Steps

1. **Invoice numbers are unique and sequential:**
   - Record several payments — each gets a distinct `INV-YYYY-NNNN`, incrementing regardless of which client it's for.

2. **Receipt upload:**
   - Open "Record Payment", choose a small file (e.g. a `.jpg` or `.pdf`) under "Receipt Upload" — the "Selected: name (size KB)" line appears.
   - Submit — the new row's "Receipt" column shows the file name as a clickable download link instead of "—".
   - Click the link — the file downloads (base64 data URL, same mechanism as Document uploads).

3. **Multi-currency support:**
   - Record one payment in each of NGN, USD, and GBP — amounts render as `₦`, `$`, `£` respectively.
   - Record a payment choosing "Other..." for currency, type a custom code (e.g. `EUR`) — the modal reveals a "Custom Currency Code" field; after submitting, the row shows `EUR x.xx` (code prefix, no symbol).

4. **Build verification:**
   - `npm run build` — compiles successfully.

---

## Task 4 — Show payment summary on client/application profile

### Test Steps

1. **Client profile Payments card:**
   - Open a client with recorded payments — a "Payments" card appears below the "Tasks" card, listing each invoice number, amount, method, and status badge.
   - If any payments for this client are `PENDING`, an "Outstanding:" line appears at the bottom showing the pending total(s) — one amount per currency if the client has pending payments in more than one currency.
   - A client with no payments shows "No payments recorded for this client" instead.

2. **Application detail Payments card:**
   - Record a payment against a specific application (not just a client).
   - Open that application's detail page — a "Payments" card appears below "Stage History", scoped only to payments linked to that application (client-level-only payments, with no `applicationId`, do not appear here).

3. **Build verification:**
   - `npm run build` — compiles successfully.

---

## Task 5 — Add outstanding balance metric to admin dashboard data

### Test Steps

1. **Card appears in the metric grid:**
   - Dashboard shows a 5th metric card, "Outstanding Balance", with a green wallet icon.
   - With no pending payments anywhere, it shows "—".

2. **Per-currency grouping:**
   - With pending payments in two different currencies (e.g. ₦200 and €300 outstanding), the card shows both amounts stacked on separate lines — never summed into one number.
   - Confirm a pending payment — refresh the dashboard — that currency's line disappears (or its total decreases) since confirmed payments no longer count as outstanding.

3. **Card visible to all roles:**
   - As admin: reflects the outstanding total across all clients.
   - Log in as staff: reflects only the outstanding total for clients assigned to that staff member.

4. **Build verification:**
   - `npm run build` — compiles successfully with no errors.
# Phase 8 — Test Plan: Quality Review, Submission & Tracking

## Setup

```bash
npm run dev
npx prisma generate
```

Log in as admin (`admin@waypoint.com` / `password123`). Ensure at least one application exists in the system (preferably at a stage after "Document Collection & Verification"). If you don't have one, register a client and create a new application.

---

## Task 1 — Create quality review model/checklist

### Test Steps

1. **Schema models exist:**
   - Open `prisma/schema.prisma` — the `QualityReview` model is present with fields: `id`, `applicationId`, `reviewerId`, `status`, `decision`, `notes`, `documentIds`, `decidedAt`.
   - The `SubmissionRecord` model exists with: `id`, `applicationId` (unique), `referenceNumber`, `submittedAt`, `biometricsAt`, `portal`, `notes`.
   - The `TrackingUpdate` model exists with: `id`, `applicationId`, `status`, `message`, `referenceUrl`.

2. **API endpoints respond:**
   - `curl http://localhost:3000/api/quality-reviews?applicationId=1` — returns `{ "reviews": [] }` (200).
   - `curl http://localhost:3000/api/submissions?applicationId=1` — returns `{ "submission": null }` (200).
   - `curl http://localhost:3000/api/tracking?applicationId=1` — returns `{ "updates": [] }` (200).

3. **Build verification:**
   - `npm run build` — compiles successfully.

---

## Task 2 — Build quality review queue

### Test Steps

1. **Quality Review panel visible on application detail:**
   - Navigate to Applications, click "View" on any application.
   - Scroll down below Payments — the "Quality Review" panel appears with a shield icon and "Request Review" button.

2. **Empty state:**
   - If no reviews exist for the application, the panel shows "No quality reviews requested yet".

3. **Request a review:**
   - Click "Request Review" — the review is submitted for the current application.
   - The panel now shows a new review entry with status "PENDING" (yellow badge) and the reviewer's name.

4. **Build verification:**
   - `npm run build` — compiles successfully.

---

## Task 3 — Add review approval/correction flow

### Test Steps

1. **Admin sees decision buttons on pending reviews:**
   - As admin, find a PENDING review in the Quality Review panel.
   - Three buttons appear: "✓ Approve", "Request Fixes", "✕ Reject".

2. **Staff does not see decision buttons:**
   - Log in as staff, navigate to an application with a pending review.
   - The review shows the status badge and reviewer name, but no decision buttons.

3. **Approve a review:**
   - As admin, click "✓ Approve" on a pending review.
   - The badge changes to a green "APPROVED" and the decision buttons disappear.
   - The application's stage in the header updates to "Quality Review".

4. **Request corrections:**
   - Create another review on a different application.
   - Click "Request Fixes" — the badge changes to orange "CORRECTIONS_REQUESTED".

5. **Reject a review:**
   - On a third application, click "✕ Reject" — the badge changes to red "REJECTED".

6. **Build verification:**
   - `npm run build` — compiles successfully.

---

## Task 4 — Block application submission until review passes

### Test Steps

1. **Approved review updates application stage:**
   - When a quality review is approved, the application currentStage advances to "QUALITY_REVIEW".
   - This is visible in both the application detail header and the Pipeline Board.

2. **Rejected/corrections reviews don't advance stage:**
   - When a review is rejected or corrections are requested, the application stage remains unchanged.
   - Verify this by checking the stage badge in the application header after each decision type.

3. **Build verification:**
   - `npm run build` — compiles successfully.

---

## Task 5 — Build submission details form

### Test Steps

1. **Submission panel visible on application detail:**
   - On any application detail page, below the Quality Review panel, find "Submission Details" panel with a send icon.
   - Initially shows "No submission details recorded yet".

2. **Record submission details:**
   - Click "Record Submission" — a modal opens with heading "Submission Details".
   - Fill in: Reference Number "GWF123456789", Submission Date (pick today), Biometrics Date (pick a future date), Portal "VFS Global", Notes "Documents submitted".
   - Click "Save Submission" — the modal closes and the panel now shows the entered details.

3. **Edit submission:**
   - Click "Edit Submission" — the modal reopens pre-filled with existing data.
   - Change the portal to "TLScontact" and click "Save Submission" — the panel updates.

4. **Submission form fields:**
   - Reference Number (text)
   - Submission Date (datetime-local picker)
   - Biometrics Date (datetime-local picker)
   - Portal (dropdown: VFS Global, TLScontact, UKVI, IRCC, USCIS, Other)
   - Notes (text)

5. **Build verification:**
   - `npm run build` — compiles successfully.

---

## Task 6 — Add application tracking updates and reminders

### Test Steps

1. **Tracking panel visible:**
   - Below Submission Details, find "Application Tracking" panel with a refresh icon.
   - Initially shows "No tracking updates yet".

2. **Add a tracking update:**
   - Select status "Submitted" from the dropdown.
   - Type a message "Application submitted at VFS Lagos".
   - Click "Add" — a new entry appears in the timeline with a colored dot and the update details.

3. **Color-coded status dots:**
   - Submitted/Under Review: primary color (blue/purple)
   - Info Requested: orange
   - Decision Made: blue
   - Passport Ready/Completed: green

4. **Multiple updates form timeline:**
   - Add 3-4 more updates with different statuses.
   - The timeline shows entries in reverse chronological order (newest at top).
   - Each entry shows: status, message, reference link (if provided), updated by, date/time.
   - The list scrolls if it exceeds the container height.

5. **Add update with reference URL:**
   - Use the tracking form but skip the message, instead paste a URL like `https://visa-status.example.com/ref/ABC123`.
   - The timeline entry shows a "View Reference" link that opens in a new tab.

6. **Build verification:**
   - `npm run build` — compiles successfully with no errors.

---

# Phase 11 — Test Plan: Testing And Deployment

## Setup

```bash
npm run dev
npx prisma generate
```

Log in as admin (`admin@waypoint.com` / `password123`). For Task 5 (full workflow), you'll also need a staff user and at least one staff member created.

---

## Task 1 — Add unit tests for workflow rules and permissions

### Test Steps

1. Run `npm test` — all existing tests should pass:
   ```bash
   npm test
   ```
   Expected output: 48 tests passed (16 permissions + 15 workflow + 17 integration).

2. Run the permissions test file in isolation:
   ```bash
   npx vitest run tests/permissions.test.ts
   ```
   Expected: 16 tests pass. Covers `isAdmin`, `canAccessClient`, `canManageClients`, `canManageApplications`, `canTransitionApplication`, `canCreateTask`, `canUpdateTask`, `canVerifyDocument`, `canRecordPayment`, `canConfirmPayment`, `canDecideQualityReview`.

3. Run the workflow test file in isolation:
   ```bash
   npx vitest run tests/workflow.test.ts
   ```
   Expected: 15 tests pass. Covers `STAGE_ORDER` integrity, `getAllowedNextStages` for every stage (including terminal stages and DECISION), `isValidTransition` rejection of invalid moves, and `stageForDecision` outcome mapping.

4. Verify test files exist at `tests/permissions.test.ts` and `tests/workflow.test.ts`.

5. Run `npx vitest run` — confirms that `vitest.config.ts` resolves the `@` alias correctly (maps to `./src`).

6. Run `npm run build` — compiles successfully with no test-related errors.

---

## Task 2 — Add basic integration tests for client, task, and application flows

### Test Steps

1. Run the integration test file:
   ```bash
   npx vitest run tests/integration.test.ts
   ```
   Expected: 17 tests pass across three suites:
   - **Client flow** (5 tests): admin create → 201, staff create blocked → 403, admin list all, staff list assigned only (`where: { assignedStaffId: 2 }`), admin reassign → 200.
   - **Application flow** (6 tests): admin create linked to client → 201, list all, staff sees assigned only (`where: { client: { assignedStaffId: 2 } }`), admin stage change via PATCH, stage transition via POST `[id]/stage` with valid move.
   - **Task flow** (6 tests): admin create with assignee → 201, staff sees own tasks only (`where: { assigneeId: 2 }`), admin sees all (`where: {}`), assignee marks own done → 200, non-assignee staff blocked → 403, admin reassign → 200, unauthenticated returns empty list.

2. Verify `tests/integration.test.ts` mocks `@/lib/prisma`, `next/headers`, `@/lib/activityLog`, and `@/lib/notifications` without hitting a live database.

3. Run `npm test` — all 48 tests pass (unit + integration).

---

## Task 3 — Add production environment configuration guide

### Test Steps

1. Open `README.md` — verify the following sections exist:
   - **Environment Variables** table: documents `DATABASE_URL`, `MIGRATION_DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
   - **Why two database URLs?** section: explains transaction pooler (6543, runtime) vs session pooler (5432, migrations).
   - **Connection pools** section: describes shared `pg.Pool` (max 5) with `PrismaPg` adapter and SSL config.
   - **Production Build** section: `npm run build` then `npm run start` on port 3000.
   - **Deployment** section with three options: Vercel, Docker, Bare Metal/VPS (including PM2 setup).

2. Verify `.env.example` shows both `DATABASE_URL` (port 6543, `sslmode=no-verify`) and `MIGRATION_DATABASE_URL` (port 5432, `sslmode=require`).

3. Verify `prisma.config.ts` reads `MIGRATION_DATABASE_URL` with fallback to `DATABASE_URL`.

4. Run `cat README.md | head -5` — should show "Way Point Travel — Visa & Workflow Management System".

---

## Task 4 — Prepare database migration/deployment checklist

### Test Steps

1. Open `DEPLOYMENT.md` — verify the following sections exist:
   - **Pre-Deployment**: 5 verification steps (migrations applied, env vars correct, Prisma client regenerated, migration history clean, build passes).
   - **Migration Steps (Production)**: `npm run db:deploy` and `npm run db:migrate` commands with explanations.
   - **After Migration — Verify Data Integrity**: SQL query listing all 12 table row counts.
   - **Rollback Plan**: Creating reverse migrations, Supabase backup restore, migration lock resolution.
   - **Current Migration History**: Table listing all 9 migrations with dates and contents.

2. Run `npx prisma migrate status` — should show "Database is up to date" (if connected to Supabase).

3. Verify the post-deployment checklist in the doc has checkboxes for all 12 verification items.

---

## Task 5 — Test full admin workflow from inquiry to decision (End-to-End Manual QA)

This test walks through the complete lifecycle of a visa application in Way Point: from first client contact through all 12 pipeline stages to a final decision. Follow each step in order — they depend on the preceding state.

### Pre-requisite: Seed Test Data

Run the reset-and-seed script to populate 8 test clients with full pipeline applications:

```bash
npx tsx scripts/reset-and-seed.ts
```

This creates:

| Client | Staff | Destination | Outcome | Final Stage |
|--------|-------|-------------|---------|-------------|
| Benjamin Bitrus | staff@waypoint.com | United Kingdom | APPROVED | VISA_APPROVED_PATH |
| Musa Ahmad | staff@waypoint.com | France | APPROVED | VISA_APPROVED_PATH |
| Bilkisu Yunus | staff@waypoint.com | Saudi Arabia | APPROVED | VISA_APPROVED_PATH |
| Fatima Kabir | staff@waypoint.com | Australia | APPROVED | VISA_APPROVED_PATH |
| Keneth David | staff@waypoint.com | Canada | REFUSED | VISA_REFUSED_PATH |
| Joshua David | user@waypoint.com | Saudi Arabia | REFUSED | VISA_REFUSED_PATH |
| Rechael Afolabi | user@waypoint.com | United Kingdom | WITHDRAWN | DECISION |
| Okoro Prince | user@waypoint.com | France | PENDING_ACTION | DECISION |

All applications have complete stage history from CLIENT_INQUIRY through to their current stage. Use these as reference data to verify the pipeline, reports, and dashboard.

### Step 1 — Verify Pre-Seeded Data

**Goal:** Confirm all 8 clients and applications loaded correctly.

1. Log in as admin (`admin@waypoint.com` / `password123`).
2. Navigate to **Clients** tab — verify all 8 clients appear with correct staff assignments:
   - Benjamin Bitrus, Musa Ahmad, Bilkisu Yunus, Fatima Kabir, Keneth David → `Staff Officer` (staff@)
   - Joshua David, Rechael Afolabi, Okoro Prince → `user@waypoint.com`
3. Click "View File" on Benjamin Bitrus — the client profile shows a UK Tourist Visa at `VISA_APPROVED_PATH` with stage history from CLIENT_INQUIRY through VISA_APPROVED_PATH.
4. Click "View File" on Okoro Prince — application is at `DECISION` stage with `PENDING_ACTION`.
5. Click "View File" on Rechael Afolabi — application is at `DECISION` stage with `WITHDRAWN`.
6. Click "View File" on Joshua David — application is at `VISA_REFUSED_PATH` with `REFUSED`.

### Step 2 — Verify Pipeline Board

1. Navigate to **Applications** tab.
2. Pipeline Board shows: DECISION (2 cards), VISA_APPROVED_PATH (4), VISA_REFUSED_PATH (2).
3. Click any application card — detail page loads with full stage history.

### Step 3 — Verify Dashboard Metrics

1. Navigate to **Dashboard**.
2. Active Clients: **8**. Pipeline: 2 at DECISION, 4 at VISA_APPROVED_PATH, 2 at VISA_REFUSED_PATH.
3. Decision Outcomes: Approved 4, Refused 2, Pending Decision 2.

### Step 4 — Verify Reports

1. Navigate to **Reports** (admin only).
2. Visa Approval Rates by Destination:
   - **United Kingdom**: 1 approved / 2 total (Benjamin OK, Rechael withdrawn)
   - **France**: 1 approved / 2 total (Musa OK, Okoro pending)
   - **Saudi Arabia**: 1 approved, 1 refused / 2 total
   - **Australia**: 1 approved / 1 total
   - **Canada**: 0 approved, 1 refused / 1 total
3. Pipeline Bottleneck Analysis shows full stage distribution.

### Step 5 — Verify Client Profiles and Activity Log

1. Open Benjamin Bitrus' profile — activity timeline shows all stage history entries.
2. The Applications panel shows the UK Tourist Visa with correct stage and decision badge.
3. Open Okoro Prince's profile — shows DECISION stage with PENDING_ACTION decision status badge.

### Step 6 — Test Task Reassignment (Admin Only)

1. Navigate to **Tasks** tab → **"Create Task"**.
2. Fill in: Title `Follow up with Okoro Prince`, Client `Okoro Prince`, Stage `Decision`, Assignee `user@waypoint.com`, Priority `HIGH`.
3. Click "Create Task" — success.
4. In the Tasks table, the Assignee column for this task shows a **dropdown** (admin only).
5. Change assignee from `user@waypoint.com` to your admin account via the dropdown.
6. Verify: Task updates. Notification bell shows "TASK_ASSIGNED" notification.

### Step 7 — Verify Staff Views (Permission Enforcement)

1. Log out, log in as staff (`staff@waypoint.com` / `password123`).
2. Clients tab: only 5 visible (Benjamin, Musa, Bilkisu, Fatima, Keneth).
3. Task assignee column: **static text only**, no dropdown.
4. Reports and Staff Management tabs are hidden from staff.

### Step 8 — Test Decision Action on PENDING_ACTION Application

1. Log in as admin again.
2. Open Okoro Prince's application detail (DECISION stage, PENDING_ACTION).
3. Click stage dropdown → select **"VISA_APPROVED_PATH"**.
4. Verify: Stage updates, status becomes COMPLETED.
5. Dashboard now shows 5 Approved, 2 Refused, 1 Pending (Rechael's WITHDRAWN).

### Step 9 — Verify Test Suite

```bash
npm test
```
Expected: 48 tests pass (16 permissions + 15 workflow + 17 integration).

### Step 10 — Build Verification

```bash
npm run build
```
Expected: Compiles with no errors. Routes show `ƒ` markers for API routes.

---

## Test Sign-off Checklist

After completing all steps above, verify:

- [ ] All 8 clients loaded with correct staff assignments (5 staff@, 3 user@)
- [ ] All 8 applications have complete stage history records
- [ ] Pipeline Board shows correct distribution (2 DECISION, 4 APPROVED, 2 REFUSED)
- [ ] Decision outcomes: 4 APPROVED, 2 REFUSED, 1 WITHDRAWN, 1 PENDING_ACTION
- [ ] Dashboard metrics reflect real data (8 clients, correct stage/decision counts)
- [ ] Reports show approval rates by destination with 2 Saudi Arabia entries
- [ ] Task reassignment dropdown works for admin
- [ ] Staff cannot see other staff's clients (only 5 of 8 visible)
- [ ] Staff cannot reassign tasks or access admin-only tabs
- [ ] Moving Okoro Prince from DECISION to VISA_APPROVED_PATH works
- [ ] All 48 tests pass
- [ ] Production build compiles

---

## Manual Walkthrough: Inquiry → Decision (Hands-On)

This is a step-by-step manual test where you create a brand new client and walk them through every pipeline stage from CLIENT_INQUIRY to DECISION. No pre-seeded data required — you build everything yourself, which verifies that every part of the system works from scratch.

**Prerequisites:** Dev server running (`npm run dev`), logged in as admin (`admin@waypoint.com` / `password123`).

Also create a staff user if you don't already have one named "QA Staff" (`qastaff@waypoint.com`):

1. Sidebar → **Staff Management** → **"Add Staff Member"**
2. Full Name: `QA Staff`, Email: `qastaff@waypoint.com`, Role: `Staff`
3. Click **"Create Account"** — success.

---

### Stage 1 — CLIENT_INQUIRY (Register the client)

A new client, Grace Emmanuel, walks into the office inquiring about a Canada Study Permit.

1. Navigate to **Clients** tab.
2. Click **"Register Client"**.
3. Fill in:
   - First Name: `Grace`
   - Last Name: `Emmanuel`
   - Email: `grace.emmanuel@example.com`
   - Phone: `+2348023456789`
   - Address: `42 Aminu Kano Crescent, Wuse 2, Abuja`
   - Passport Number: `C12345678`
   - Date of Birth: `1998-03-22`
   - Source: `Website`
   - Assign Staff: `QA Staff`
4. Click **"Register Client"** — success message: "Client registered successfully! File number: WP-2026-XXXX".
5. The new client row shows in the table. Note the **file number** (you'll use it later).

✅ **Verify:** Grace Emmanuel appears in the client list. She has no application yet.

---

### Stage 2 — Create the Application (CLIENT_INQUIRY → CUSTOMER_SERVICE_REGISTRATION)

1. On the Clients tab, find Grace Emmanuel, click **"View File"** — client profile opens.
2. In the Applications section, click the green **"+"** button (or **"Create Application"**).
3. Fill in:
   - Service Type: `Canada Study Permit` (or any available service type)
   - Destination Country: `Canada`
   - Travel Purpose: `Study / Education`
   - Expected Travel Date: pick a date 3 months from today
   - Assign Staff: `QA Staff`
4. Click **"Create Application"** — success message.
5. The application card appears showing:
   - Service type badge
   - Stage: `Client Inquiry`
   - Status: `NOT_STARTED`

✅ **Verify:** Application exists at CLIENT_INQUIRY stage. Stage history has one entry: `null → CLIENT_INQUIRY`.


Now advance to **CUSTOMER_SERVICE_REGISTRATION**:

1. Click the application card to open the detail view.
2. Click the stage dropdown in the header (next to the current stage badge).
3. Select **"Customer Service Registration"**.
4. Stage badge updates. Status changes to `IN_PROGRESS`.

✅ **Verify:** Stage history now shows two entries: `null → CLIENT_INQUIRY` and `CLIENT_INQUIRY → CUSTOMER_SERVICE_REGISTRATION`.

---

### Stage 3 — INITIAL_CONSULTATION

1. From the application detail, click stage dropdown → **"Initial Consultation"**.
2. Stage badge updates.

✅ **Verify:** Stage history has the new transition. This is now stage 3 of 12.

---

### Stage 4 — PAYMENT & SERVICE AGREEMENT

1. Stage dropdown → **"Payment & Service Agreement"**.

Now you need a payment record and a task for this stage:

**Create a task:**

1. Navigate to **Tasks** tab → **"Create Task"**.
2. Fill in:
   - Title: `Prepare service agreement for Grace Emmanuel`
   - Client: `Grace Emmanuel`
   - Application: select the Canada Study Permit application
   - Stage: `Payment & Service Agreement`
   - Assignee: `QA Staff`
   - Priority: `HIGH`
3. Click **"Create Task"** — success.

**Record a payment:**

1. Navigate to **Payments** tab → **"Record Payment"**.
2. Fill in:
   - Client: `Grace Emmanuel`
   - Amount: `250000`
   - Currency: `NGN`
   - Method: `Bank Transfer`
3. Click **"Record Payment"** — invoice number is auto-generated.
4. The new payment appears with `PENDING` status.
5. Click **"✓ Confirm"** on the payment row — badge changes to green `CONFIRMED`.

✅ **Verify:** Return to Grace's application detail — the Payments card shows ₦250,000.00 confirmed.

---

### Stage 5 — DOCUMENT COLLECTION & VERIFICATION

1. Stage dropdown → **"Document Collection & Verification"**.

**Upload documents:**

1. Navigate to **Documents** tab → **"Upload File"**.
2. Fill in:
   - Document Type: `Passport` (from the templates dropdown)
   - Client: `Grace Emmanuel`
   - File Name: `grace_emmanuel_passport.pdf`
   - File Upload: choose any local file (PDF or image)
3. Click **"Record Document"** — success.
4. Repeat for a second document:
   - Document Type: `Bank Statements`
   - File Name: `grace_emmanuel_bank_statement.pdf`
   - Choose another file.
5. Click **"Record Document"** — success.

**Verify documents:**

1. In the Documents tab, both documents show status `PENDING` (yellow badge).
2. Click **"✓ Verify"** on the first document — badge changes to green `VERIFIED`.
3. Click **"✓ Verify"** on the second document.
4. Return to **Dashboard** — "Documents Pending Review" should be 0.

✅ **Verify:** Both documents show as VERIFIED. Dashboard pending review count is 0.

---

### Stage 6 — VISA PROCESSING

1. Stage dropdown → **"Visa Processing"**.

**Create processing tasks:**

1. Navigate to **Tasks** → **"Create Task"** → Title: `Review passport and supporting docs`, Client: `Grace Emmanuel`, Stage: `Visa Processing`, Assignee: `QA Staff`, Priority: `HIGH`, click "Create Task".
2. **"Create Task"** → Title: `Prepare cover letter`, Client: `Grace Emmanuel`, Stage: `Visa Processing`, Assignee: `QA Staff`, Priority: `MEDIUM`, click "Create Task".

**Complete the tasks:**

1. In the Tasks table, find both tasks.
2. Change the status of each to **"Done"** using the status dropdown in each row.

✅ **Verify:** Tasks disappear from the "High-Priority Tasks" dashboard panel. Status shows DONE with green badge and completedAt timestamp.

---

### Stage 7 — QUALITY REVIEW

1. Stage dropdown → **"Quality Review"**.

**Request and approve a quality review:**

1. On the application detail, scroll down to the **Quality Review** panel (below Payments).
2. Click **"Request Review"** — a PENDING review entry appears with your name as reviewer.
3. Click **"✓ Approve"** on the PENDING review.
4. Badge changes to green `APPROVED`. Decision buttons disappear.

✅ **Verify:** Quality review shows status APPROVED. Application stage is now Quality Review.

---

### Stage 8 — APPLICATION SUBMISSION

1. Stage dropdown → **"Application Submission"**.

**Record submission details:**

1. On the application detail, scroll to **Submission Details** panel (below Quality Review).
2. Click **"Record Submission"**.
3. Fill in:
   - Reference Number: `CAN-STUDY-2026-000789`
   - Submission Date: today's date (use the datetime picker)
   - Biometrics Date: +2 weeks from today
   - Portal: `VFS Global`
   - Notes: `Documents submitted at VFS Abuja`
4. Click **"Save Submission"**.

✅ **Verify:** Submission panel shows reference number, dates, portal, and notes. The "Record Submission" button changes to "Edit Submission".

---

### Stage 9 — APPLICATION TRACKING

1. Stage dropdown → **"Application Tracking"**.

**Add tracking updates:**

1. Scroll to **Application Tracking** panel (below Submission Details).
2. Add Update 1:
   - Status dropdown: `Submitted`
   - Message: `Application received at VFS Abuja — forwarded to IRCC`
   - Click **"Add"** — a timeline entry appears with a colored dot.
3. Add Update 2:
   - Status: `Under Review`
   - Message: `Application is under review by the visa officer`
   - Click **"Add"**.
4. Add Update 3:
   - Status: `Decision Made`
   - Message: `Decision has been made. Awaiting passport collection.`
   - Reference URL: `https://tracking.example.com/ref/CAN-STUDY-2026-000789`
   - Click **"Add"**.
5. Scroll through the timeline — entries appear newest-first with colored status dots.

✅ **Verify:** Timeline shows 3 entries with timestamps. The "View Reference" link opens in a new tab.

---

### Stage 10 — DECISION (Approved Path)

1. Stage dropdown → **"Decision"**.

The Decision modal opens with outcome options.

1. Select **"Approved"**.
2. Note field: `Application approved — IRCC has issued the study permit.`
3. Click **"Confirm Decision"**.

✅ **Verify:**

- Application moves to **VISA_APPROVED_PATH** stage.
- Status changes to `COMPLETED`.
- Stage history shows the full path: CLIENT_INQUIRY → ... → APPLICATION_TRACKING → DECISION → VISA_APPROVED_PATH.
- Dashboard Decision Outcomes panel now counts this approved application.
- Reports → Visa Approval Rates by Destination reflects the new approved application for Canada.

---

### Post-Walkthrough Verification

1. **Activity Log:** Open Grace Emmanuel's client profile — the activity timeline shows every action:
   - Client created, application created
   - 10 stage transitions with timestamps and actor
   - Task creations and completions
   - Payment recorded and confirmed
   - Documents uploaded and verified
   - Quality review requested and approved
   - Submission details recorded
   - Tracking updates added
2. **Pipeline Board** (Applications tab): Grace's application card is in the VISA_APPROVED_PATH column.
3. **Notifications**: Click the bell icon — notifications exist for task assignments.

---

### Test the REFUSED Path (Bonus)

Repeat the walkthrough with a second client to verify the REFUSED path:

1. Register a new client: **James Okonkwo**, email `james.okonkwo@example.com`, assign to QA Staff.
2. Create a UK Tourist Visa application.
3. Fast-track through stages 2-9 (each stage move via the dropdown, no need for tasks/payments/documents this time).
4. At DECISION stage, select **"Refused"** → confirm.
5. Verify: Application moves to **VISA_REFUSED_PATH**. Status is COMPLETED.
6. Reports now show both an approved and a refused application.

---

## Task 6 — Fix final bugs from QA

### Test Steps

1. **Verify task reassignment dropdown works:**
   - Log in as admin (`admin@waypoint.com` / `password123`).
   - Navigate to **Tasks** tab.
   - In the Assignee column, each task row should show a **dropdown** with all staff members, not static text.
   - Select a different staff member from the dropdown on any task.
   - The task's assignee updates immediately — no page reload needed.
   - Open the notification bell — a "TASK_ASSIGNED" notification is generated for the new assignee.
   - Navigate to the client's profile for that task — activity log shows "Task was assigned to [Staff Name]".

2. **Verify non-admin sees static assignee:**
   - Log in as staff (`staff@waypoint.com` / `password123`).
   - Navigate to Tasks tab.
   - The Assignee column shows plain text (name or "Unassigned"), never a dropdown.

3. **Verify migration URL configuration:**
   - Open `prisma.config.ts` — should read `MIGRATION_DATABASE_URL` with fallback to `DATABASE_URL`.
   - Open `.env` — `MIGRATION_DATABASE_URL` should point to port 5432 (session pooler), `DATABASE_URL` to port 6543 (transaction pooler).
   - Run `npm run db:migrate` — should use the session pooler URL. (If no pending migrations, it will report "No pending migrations to apply.")

4. **Verify `.env.example` is updated:**
   - Open `.env.example` — shows both URLs with correct port numbers and `sslmode` flags.
   - The comment for `DATABASE_URL` says "transaction pooler, port 6543 — used at runtime".
   - The comment for `MIGRATION_DATABASE_URL` says "session pooler, port 5432 — used for prisma migrate commands".

5. **Run full test suite:**
   ```bash
   npm test
   ```
   Expected: 48 tests pass.

6. **Run production build:**
   ```bash
   npm run build
   ```
   Expected: Compiles successfully, no errors.
