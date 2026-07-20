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

## Task 3 — Client List with Search and Filters

### Setup Commands

```bash
# Start the dev server
npm run dev

# Register test clients via API (so we have data to search/filter)
curl -s -X POST http://localhost:3000/api/clients \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Samantha", "lastName": "Cooper", "email": "samantha@example.com",
    "phone": "+1111111111", "source": "website", "createdById": 1
  }' | jq

curl -s -X POST http://localhost:3000/api/clients \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "David", "lastName": "Miller", "email": "david@example.com",
    "phone": "+2222222222", "source": "referral", "createdById": 1, "assignedStaffId": 2
  }' | jq

curl -s -X POST http://localhost:3000/api/clients \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Alice", "lastName": "Green", "email": "alice@example.com",
    "phone": "+3333333333", "source": "walk-in", "createdById": 1, "passportNumber": "CC1928374"
  }' | jq

# Log in at http://localhost:3000 and navigate to the Clients tab
```

---

### Test Steps

1. **Search bar is visible:**

   - On the Clients tab, a search input is visible below the header with placeholder text: "Search by name, email, file number, or passport..."
   - A search icon is positioned inside the input on the left.

2. **Filter dropdowns are visible:**

   - A "All Sources" dropdown is positioned next to the search bar.
   - An "All Staff" dropdown is positioned next to the source filter.
   - No "Clear filters" link is visible when all values are at their defaults.

3. **Search by name:**

   ```bash
   # Verify via API that the client exists
   curl -s http://localhost:3000/api/clients | jq '.clients[] | select(.firstName == "Samantha")'
   ```
   Expected: Returns the Samantha Cooper client record.

   - In the UI, type "Samantha" into the search bar — only Samantha Cooper's row is shown.
   - Type "david" — only David Miller's row is shown.
   - Type a partial match like "sam" — Samantha Cooper is shown.
   - Type "zzzz" — the table shows an empty state with "No clients match your filters" and a search icon.

4. **Search by email:**

   - Type "alice@example.com" — only Alice Green's row is shown.

5. **Search by file number:**

   - Type the file number of a client (e.g., "WP-2026-0001") — only that client is shown.

6. **Search by passport number:**

   - Type "CC1928374" — only Alice Green's row is shown (since she has that passport number).

7. **Source filter:**

   - Select "Website" from the source filter — only clients with source "website" are shown.
   - Select "Referral" — only David Miller is shown.
   - Select "Walk-in" — only Alice Green is shown.

8. **Staff filter:**

   - Select a staff member from the staff filter — only clients assigned to that staff member are shown.
   - Select "Unassigned" — only clients with no assigned staff are shown.
   - Select "All Staff" — all clients are shown again.

9. **Combined search and filters:**

   - Set Source to "Website" and type "Cooper" in search — Samantha Cooper is shown.
   - Set Staff to "Unassigned" and type "david" — no results (David has a staff assigned).
   - The filters work together with AND logic.

10. **Clear filters:**

    - After applying any search term or filter, a "Clear filters" link appears.
    - Click "Clear filters" — the search bar is emptied, both dropdowns reset to "All Sources" / "All Staff", and all clients are shown.
    - The "Clear filters" link disappears.

11. **Filter empty state:**

    - Apply a combination of filters and search that matches no clients.
    - A search icon is shown with text: "No clients match your filters".
    - Subtext: "Try adjusting your search or filter criteria."

12. **Build verification:**

    ```bash
    npm run build
    ```
    Expected: "✓ Compiled successfully" with no errors.

---

## Task 4 — Client Profile Page

### Setup Commands

```bash
# Start the dev server
npm run dev

# Ensure we have at least one client in the database with all fields
curl -s -X POST http://localhost:3000/api/clients \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Profile", "lastName": "Test", "email": "profiletest@example.com",
    "phone": "+9999999999", "address": "456 Oak Avenue, Lagos",
    "passportNumber": "B98765432", "dateOfBirth": "1985-08-20T00:00:00.000Z",
    "source": "phone", "createdById": 1, "assignedStaffId": 2
  }' | jq

# Log in at http://localhost:3000 and navigate to the Clients tab
```

---

### Test Steps

1. **Accessing client profile:**

   - On the Clients tab, find a client in the table.
   - Click the "View File" button in the Actions column.
   - The client list is replaced by the client profile view.
   - A loading spinner briefly appears while the data loads.

2. **Back to Client List:**

   - The profile page has a "← Back to Client List" button at the top.
   - Click it — the client list table reappears with the selected client cleared.

3. **Profile header:**

   - A large avatar shows the client's initials (first letter of first name + first letter of last name).
   - Full name displayed in large bold text (first name + last name).
   - File number shown in monospace font with primary color.
   - Source displayed as a badge (capitalized, e.g., "Phone").
   - "Edit Profile" button visible in the top-right corner.

4. **Contact Information card:**

   - Card heading: "Contact Information" with a mail icon.
   - Email row: displays the client's email address.
   - Phone row: displays the client's phone number.
   - Address row: displays the client's address, or "—" if empty.

5. **Personal Details card:**

   - Card heading: "Personal Details" with a user icon.
   - Passport Number row: displays the passport number, or "—" if empty.
   - Date of Birth row: displays the date formatted as "20 August 1985", or "—" if empty.
   - Assigned Staff row: displays the assigned staff member's name, or "Unassigned" if none.

6. **Record Details footer:**

   - Card heading: "Record Details".
   - Created By: shows the name of the staff who created the client record.
   - Created At: shows the formatted date the client was registered.
   - Last Updated: shows the formatted date of the last update.
   - Client ID: shown in monospace with a `#` prefix (e.g., `#3`).

7. **All fields populated correctly:**

   ```bash
   # Verify the profile data matches what's in the database
   curl -s http://localhost:3000/api/clients | jq '.clients[] | select(.email == "profiletest@example.com")'
   ```
   Expected: All fields from the profile view (name, email, phone, address, passport, DOB, source, staff) match the API response.

8. **Empty optional fields:**

   ```bash
   # Create a client with only required fields
   curl -s -X POST http://localhost:3000/api/clients \
     -H "Content-Type: application/json" \
     -d '{
       "firstName": "Minimal", "lastName": "Client", "email": "minimal@example.com",
       "phone": "+0000000000", "source": "walk-in", "createdById": 1
     }' | jq
   ```
   - View the profile of the new "Minimal Client".
   - Address, Passport Number, and Date of Birth should show "—".
   - Assigned Staff should show "Unassigned".

9. **Switch between profiles:**

   - View a client's profile, then click "Back to Client List".
   - Click "View File" on a different client — the new client's details load correctly.
   - No stale data from the previous profile is shown.

10. **Loading state:**

    - View a profile (or switch between them) — a centered spinner appears while the data is being fetched.

11. **Build verification:**

    ```bash
    npm run build
    ```
    Expected: "✓ Compiled successfully" with no errors.

---

## Task 5 — Application Database Model and API/Actions

### Setup Commands

```bash
# Regenerate Prisma client
npm run db:generate

# Start dev server
npm run dev
```

---

### Test Steps

1. **Prisma schema validation:**

   ```bash
   # Check the Application model is present
   grep -A 18 "model Application" prisma/schema.prisma
   ```
   Expected: Application model with fields `id`, `clientId`, `serviceType`, `destinationCountry`, `travelPurpose`, `expectedTravelDate`, `currentStage` (default `CLIENT_INQUIRY`), `status` (default `NOT_STARTED`), `decisionStatus`, `assignedStaffId`, plus relations to `Client` and `User`.

   ```bash
   # Check reverse relations
   grep -A 3 "applications" prisma/schema.prisma
   ```
   Expected: `applications Application[]` on the Client model and `applications Application[] @relation("ApplicationAssignedStaff")` on the User model.

   ```bash
   npm run db:generate
   ```
   Expected: Completes with "✔ Generated Prisma Client" and no errors.

2. **Migration file exists:**

   ```bash
   cat prisma/migrations/20260720000001_add_applications/migration.sql
   ```
   Expected: SQL creating `applications` table, foreign keys to `clients(id)` and `users(id)`.

3. **API — GET /api/applications:**

   ```bash
   curl -s http://localhost:3000/api/applications | jq
   ```
   Expected: Returns 200 with `{ applications: [] }`. Each app includes nested `client` (id, fileNumber, firstName, lastName) and `assignedStaff` objects. Results ordered by `createdAt` descending.

4. **API — POST /api/applications (create):**

   ```bash
   # First create a test client
   curl -s -X POST http://localhost:3000/api/clients \
     -H "Content-Type: application/json" \
     -d '{
       "firstName": "AppTest", "lastName": "Client", "email": "apptest@example.com",
       "phone": "+5555555555", "source": "website", "createdById": 1
     }' | jq
   ```

   ```bash
   # Create application linking to the client (use the client id from above)
   curl -s -X POST http://localhost:3000/api/applications \
     -H "Content-Type: application/json" \
     -d '{
       "clientId": 1,
       "serviceType": "UK Tourist Visa",
       "destinationCountry": "United Kingdom",
       "travelPurpose": "Tourism"
     }' | jq
   ```
   Expected: Returns 201. `currentStage` defaults to `CLIENT_INQUIRY`, `status` defaults to `NOT_STARTED`.

   ```bash
   # Try with non-existent client
   curl -s -X POST http://localhost:3000/api/applications \
     -H "Content-Type: application/json" \
     -d '{
       "clientId": 9999,
       "serviceType": "UK Tourist Visa",
       "destinationCountry": "UK",
       "travelPurpose": "Tourism"
     }' | jq
   ```
   Expected: Returns 404 with `{ error: "Client not found" }`.

   ```bash
   # Missing required fields
   curl -s -X POST http://localhost:3000/api/applications \
     -H "Content-Type: application/json" \
     -d '{"clientId": 1}' | jq
   ```
   Expected: Returns 400 with descriptive error.

5. **API — POST /api/applications (with optional fields):**

   ```bash
   curl -s -X POST http://localhost:3000/api/applications \
     -H "Content-Type: application/json" \
     -d '{
       "clientId": 1,
       "serviceType": "Canada Study Permit",
       "destinationCountry": "Canada",
       "travelPurpose": "Study",
       "expectedTravelDate": "2026-09-01T00:00:00.000Z",
       "assignedStaffId": 2
     }' | jq
   ```
   Expected: Returns 201. `expectedTravelDate` stored as timestamp, `assignedStaff` nested object present.

6. **API — PATCH /api/applications (update):**

   ```bash
   # Update stage
   curl -s -X PATCH http://localhost:3000/api/applications \
     -H "Content-Type: application/json" \
     -d '{"id": 1, "currentStage": "INITIAL_CONSULTATION", "status": "IN_PROGRESS"}' | jq
   ```
   Expected: Returns 200. Stage and status updated.

   ```bash
   # Update decision status
   curl -s -X PATCH http://localhost:3000/api/applications \
     -H "Content-Type: application/json" \
     -d '{"id": 1, "decisionStatus": "APPROVED"}' | jq
   ```
   Expected: Returns 200. `decisionStatus` set to `APPROVED`.

   ```bash
   # Clear assigned staff
   curl -s -X PATCH http://localhost:3000/api/applications \
     -H "Content-Type: application/json" \
     -d '{"id": 1, "assignedStaffId": null}' | jq
   ```
   Expected: Returns 200. `assignedStaff` is now `null`.

   ```bash
   # Missing id
   curl -s -X PATCH http://localhost:3000/api/applications \
     -H "Content-Type: application/json" \
     -d '{"currentStage": "QUALITY_REVIEW"}' | jq
   ```
   Expected: Returns 400 with `{ error: "Application ID is required" }`.

7. **Server action — getApplicationsAction:**

   ```typescript
   import { getApplicationsAction } from "@/app/actions/applicationActions";
   const { applications } = await getApplicationsAction();
   ```

8. **Server action — createApplicationAction:**

   ```typescript
   import { createApplicationAction } from "@/app/actions/applicationActions";

   const { application } = await createApplicationAction({
     clientId: 1,
     serviceType: "Schengen Tourist Visa",
     destinationCountry: "France",
     travelPurpose: "Tourism",
     assignedStaffId: 2,
   });
   // application.currentStage === "CLIENT_INQUIRY"
   // application.status === "NOT_STARTED"
   ```

9. **Server action — updateApplicationAction:**

   ```typescript
   import { updateApplicationAction } from "@/app/actions/applicationActions";

   const { application } = await updateApplicationAction(1, {
     currentStage: "DOCUMENT_COLLECTION_VERIFICATION",
     status: "IN_PROGRESS",
   });
   ```

10. **Build verification:**

    ```bash
    npm run build
    ```
    Expected: "✓ Compiled successfully". `/api/applications` appears as a dynamic route (ƒ).

---

## Task 6 — Application Creation Form

### Setup Commands

```bash
# Start the dev server
npm run dev

# Ensure we have test clients and staff
curl -s http://localhost:3000/api/clients | jq '.clients | length'
curl -s http://localhost:3000/api/staff | jq '.users | length'

# Log in at http://localhost:3000 as admin
```

---

### Test Steps

1. **Applications tab in Sidebar:**

   - Log in as admin or staff — "Applications" appears in the sidebar between Clients and Tasks.
   - Click "Applications" — the Applications page loads with header "Applications".

2. **Opening the creation modal:**

   - Click "New Application" button — modal appears with heading "New Application".
   - Modal has "Cancel" button.

3. **Application form fields:**

   - Client * (dropdown showing all clients as "WP-XXXX-YYYY — FirstName LastName")
   - Service Type * (dropdown: UK Tourist Visa, Canada Study Permit, Schengen Tourist Visa, USA B1/B2 Visa, Australia Visitor Visa, UK Student Visa)
   - Destination Country * (text input)
   - Travel Purpose * (dropdown: Tourism, Business, Study, Work, Family Visit, Medical, Transit, Other)
   - Expected Travel Date (date picker, optional)
   - Assign Staff (dropdown with all staff members, default "Unassigned")

   Fields marked * are required.

4. **Submit with required fields:**

   - Select a client, choose "UK Tourist Visa", enter "United Kingdom" as destination, select "Tourism" as purpose.
   - Click "Create Application" — loading spinner shows.
   - Success message: "Application created successfully!"
   - New application row appears in the table.

5. **Client field populated correctly:**

   ```bash
   curl -s http://localhost:3000/api/clients | jq '.clients'
   ```
   - Every client in the database appears as an option in the Client dropdown.
   - Format: `WP-2026-0001 — John Doe`.

6. **Applications table — live data:**

   - After creating applications, table shows: Client (name + file number), Service Type, Destination, Stage (badge), Status (color-coded badge), Actions.
   - Stage default shows "CLIENT INQUIRY" (underscores replaced with spaces).
   - Status "NOT STARTED" shows in muted color.
   - Status "IN PROGRESS" shows in blue.
   - Status "BLOCKED" shows in red.
   - Status "COMPLETED" shows in green.

7. **Loading and empty states:**

   - When switching to Applications tab, a spinner appears while data loads.
   - When no applications exist, empty state shows a file icon and message.

8. **Backend validation:**

   ```bash
   # Submit without clientId
   curl -s -X POST http://localhost:3000/api/applications \
     -H "Content-Type: application/json" \
     -d '{"serviceType": "UK Tourist Visa", "destinationCountry": "UK", "travelPurpose": "Tourism"}' | jq
   ```
   Expected: Returns 400 with `{ error: "Client ID, service type, destination country, and travel purpose are required" }`.

9. **Build verification:**

    ```bash
    npm run build
    ```
    Expected: "✓ Compiled successfully" with no errors.
