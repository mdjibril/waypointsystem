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

### Step 1 — Create Staff User

**Goal:** Ensure a staff member exists to assign work to.

1. Navigate to **Staff Management** (Sidebar → Staff Management).
2. Click **"Add Staff Member"**.
3. Fill in:
   - Full Name: `QA Staff`
   - Email Address: `qastaff@waypoint.com`
   - Phone: `1234567890`
   - Role: `Staff`
4. Click **"Create Account"** — success: "Staff member added successfully! Default password is 'password123'."
5. The new staff member appears in the table with role badge "STAFF" and status "Active".

### Step 2 — Create a Client (CLIENT_INQUIRY)

**Goal:** Register a new client who wants a UK Tourist Visa.

1. Navigate to **Clients** tab.
2. Click **"Register Client"**.
3. Fill in:
   - First Name: `David`
   - Last Name: `Williams`
   - Email: `david@example.com`
   - Phone: `+2348012345678`
   - Address: `15 Broad Street, Lagos Island`
   - Passport Number: `B98765432`
   - Date of Birth: `1985-08-12`
   - Source: `Referral`
   - Assign Staff: `QA Staff`
4. Click **"Register Client"** — success: "Client registered successfully! File number: WP-2026-XXXX".
5. The new client row shows in the table with `QA Staff` as assigned staff.

Verify: This represents the **CLIENT_INQUIRY** stage — the client has made first contact.

### Step 3 — Create an Application

**Goal:** Open a visa application for the client.

1. Stay on Clients tab, find David Williams, click **"View File"** — client profile opens.
2. In the Applications section, click **"Create Application"** (green + button).
3. Fill in:
   - Service Type: `UK Tourist Visa`
   - Destination Country: `United Kingdom`
   - Travel Purpose: `Tourism / Holiday`
   - Expected Travel Date: pick a date 3 months from now
   - Assign Staff: `QA Staff`
4. Click **"Create Application"** — success message appears.
5. The application card shows in the client profile with:
   - Service type badge
   - Stage: `Client Inquiry`
   - Status: `NOT_STARTED`

Verify: Client inquiry is recorded, application exists at first pipeline stage.

### Step 4 — Move Through Pipeline Stages

For each stage below, use the **Application detail page** stage dropdown selector (or the Pipeline Board) to advance the application. Verify the stage updates after each move.

#### Stage 1 → 2: CUSTOMER_SERVICE_REGISTRATION

1. Open the application detail (click the application card).
2. Click the stage dropdown in the header — select **"Customer Service Registration"**.
3. Verify: Stage badge updates. Stage history shows "Client Inquiry → Customer Service Registration".
4. Status changes to `IN_PROGRESS`.

#### Stage 2 → 3: INITIAL_CONSULTATION

1. Select **"Initial Consultation"** from the stage dropdown.
2. Verify: Stage changes. History records the transition.

#### Stage 3 → 4: PAYMENT_SERVICE_AGREEMENT

1. Select **"Payment & Service Agreement"**.
2. **Create a task** for this stage:
   - Navigate to **Tasks** tab → **"Create Task"**
   - Title: `Send service agreement to David Williams`
   - Client: `David Williams`
   - Application: select the UK Tourist Visa application
   - Stage: `Payment & Service Agreement`
   - Assignee: `QA Staff`
   - Priority: `HIGH`
   - Click "Create Task" — success.
3. Navigate to **Payments** tab → **"Record Payment"**:
   - Client: `David Williams`
   - Amount: `150000`
   - Currency: `NGN`
   - Method: `Bank Transfer`
   - Click "Record Payment".
4. The payment appears with `PENDING` status. Click **"✓ Confirm"** — badge changes to `CONFIRMED` (green).
5. Return to the application detail — Payments card shows the ₦150,000 confirmed payment.

Verify: Payment recorded and confirmed. Task created and assigned.

#### Stage 4 → 5: DOCUMENT_COLLECTION_VERIFICATION

1. Select **"Document Collection & Verification"**.
2. **Upload documents** for this application:
   - Navigate to **Documents** tab → **"Upload File"**
   - Document Type: `Passport` (from templates dropdown)
   - Client: `David Williams`
   - File Name: `david_williams_passport.pdf`
   - Choose a file (any PDF/image).
   - Click **"Record Document"**.
3. Repeat for another document type (e.g., `Bank Statements`).
4. **Verify documents** (admin action):
   - Find the pending documents in the queue.
   - Click **"✓ Verify"** on each — status changes to `VERIFIED` (green).
5. Return to Dashboard — **Documents Pending Review** count should be 0.

Verify: Documents uploaded and verified. Application can proceed.

#### Stage 5 → 6: VISA_PROCESSING

1. Select **"Visa Processing"**.
2. **Create tasks** for visa processing work:
   - `Fill DS-160 form` → assigned to QA Staff, priority HIGH
   - `Prepare supporting letter` → assigned to QA Staff, priority MEDIUM
3. As QA Staff, mark tasks as Done via the Tasks tab status dropdown.
4. Verify tasks disappear from "High-Priority Tasks" dashboard panel when completed.

#### Stage 6 → 7: QUALITY_REVIEW

1. Select **"Quality Review"**.
2. On the application detail, scroll to the Quality Review panel.
3. Click **"Request Review"** — a PENDING review entry appears.
4. Click **"✓ Approve"** on the review — badge changes to green `APPROVED`.
5. The application stage updates to `Quality Review`.

Verify: Quality review approved. Application can proceed to submission.

#### Stage 7 → 8: APPLICATION_SUBMISSION

1. Select **"Application Submission"**.
2. Scroll to Submission Details panel → click **"Record Submission"**:
   - Reference Number: `GWF-2026-0012345`
   - Submission Date: today's date
   - Biometrics Date: +2 weeks from today
   - Portal: `VFS Global`
   - Notes: `Submitted at VFS Lagos office`
   - Click "Save Submission".
3. Verify: Submission details panel shows all entered info with reference number and dates.

#### Stage 8 → 9: APPLICATION_TRACKING

1. Select **"Application Tracking"**.
2. Scroll to Application Tracking panel:
   - Status: `Submitted`
   - Message: `Application received by UKVI`
   - Click "Add" — first timeline entry appears.
3. Add another update:
   - Status: `Under Review`
   - Message: `Application under assessment`
   - Click "Add".
4. Add a 3rd update:
   - Status: `Decision Made`
   - Message: `Decision has been made`
   - Reference URL: `https://visa-status.example.com/ref/GWF-2026-0012345`
   - Click "Add".
5. Verify: Timeline shows 3 entries in reverse chronological order. Each has a colored status dot and timestamp.

#### Stage 9 → 10: DECISION

1. Select the current stage dropdown → pick **"Decision"**.
2. A decision modal opens with outcome options: Approved, Refused, Withdrawn, Pending Action.
   - Select **"Approved"**.
   - Note: `Application approved — client notified via email.`
   - Click "Confirm Decision".
3. The application moves to **VISA_APPROVED_PATH** stage. Status changes to `COMPLETED`.
4. Stage history shows the full path: ...→ Application Tracking → Decision → Visa Approved Path.

### Step 5 — Verify Dashboard and Reports

1. Navigate to **Dashboard**:
   - Active Clients card shows the client count.
   - Visa Pipeline card shows applications by stage.
   - Decision Outcomes panel shows 1 Approved.
   - Staff Workload panel shows QA Staff with completed tasks.
   - Outstanding Balance shows any remaining pending payments.

2. Navigate to **Reports**:
   - Visa Approval Rates by Destination shows 100% for United Kingdom.
   - Revenue by Service Type shows ₦150,000 for UK Tourist Visa.
   - Pipeline Bottleneck Analysis shows current stage distribution.
   - Task Completion by Staff shows QA Staff's completion rate.

### Step 6 — Verify Activity Log

1. Open David Williams' client profile (Clients → View File).
2. Scroll to the activity timeline — every action taken should be logged:
   - Client created
   - Application created
   - Stage transitions (all 10 moves)
   - Task creations and completions
   - Payment recorded and confirmed
   - Documents uploaded and verified
   - Quality review requested and approved
   - Submission details recorded
   - Tracking updates added
   - Decision made

### Step 7 — Verify Notification System

1. Click the **bell icon** in the topbar.
2. Verify notifications exist for:
   - Task assignments to QA Staff
   - Stage change notifications (when assigned staff isn't the person making the change)
3. Click a notification — should link to the relevant client/application view.

### Step 8 — Test Alternative Decision Path (Refused)

To verify the REFUSED path works:

1. Create another client (e.g., `Sarah Connor`, `sarah@example.com`).
2. Create a UK Tourist Visa application for Sarah.
3. Fast-track through stages 2-9 (each stage move via dropdown).
4. At DECISION stage, select **"Refused"** → confirm.
5. Verify: Application moves to **VISA_REFUSED_PATH** stage. Status is `COMPLETED`.
6. Dashboard Decision Outcomes now shows 1 Approved + 1 Refused.
7. Reports → Visa Approval Rates now shows 50% for United Kingdom.

### Step 9 — Test Task Reassignment (Admin Only)

1. Create a new task for any client: Title `QA reassignment test`, assign to QA Staff.
2. In the Tasks table, find the task row — in the Assignee column, a **dropdown** appears (admin only).
3. Change the assignee from QA Staff to your admin account using the dropdown.
4. Verify: The task immediately updates. The notification bell shows a new "TASK_ASSIGNED" notification for the admin user.
5. As staff (`qastaff@waypoint.com` / `password123`), the task should disappear from their task list (they only see their own tasks).
6. The assignee dropdown is **not** visible when logged in as staff — only static assignee name.

### Step 10 — Verify Test Suite

```bash
npm test
```

Expected: All 48 tests pass (16 permissions + 15 workflow + 17 integration).

### Step 11 — Build Verification

```bash
npm run build
```

Expected: Compiles successfully with no errors. Routes show in build output with `ƒ` (Dynamic) markers for API routes.

---

## Test Sign-off Checklist

After completing all steps above, verify:

- [ ] Client created with auto-generated file number
- [ ] Application created and linked to client
- [ ] All 10 pipeline stage transitions work (CLIENT_INQUIRY through DECISION)
- [ ] Stage history records every transition
- [ ] Tasks created, assigned, reassigned, and completed
- [ ] Payments recorded and confirmed
- [ ] Documents uploaded and verified
- [ ] Quality review requested, approved, rejected, corrections requested
- [ ] Submission details recorded and displayed
- [ ] Tracking updates form a timeline
- [ ] Both decision outcomes (APPROVED → VISA_APPROVED_PATH, REFUSED → VISA_REFUSED_PATH) work
- [ ] Activity log captures all actions
- [ ] Notifications generated for task assignments and stage changes
- [ ] Dashboard metrics reflect real data
- [ ] Reports page shows charts with actual data
- [ ] Staff user sees only assigned clients/tasks
- [ ] Admin-only actions hidden from staff
- [ ] Task reassignment dropdown works for admin
- [ ] All 48 tests pass
- [ ] Production build compiles

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
