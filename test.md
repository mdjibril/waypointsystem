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

## Task 7 — Admin Visibility for All Clients and Staff Visibility for Assigned Clients

### Setup Commands

```bash
# Start the dev server
npm run dev

# Ensure we have test data (at least 2 clients, one assigned to staff and one unassigned)
curl -s -X POST http://localhost:3000/api/clients \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "AdminVisible", "lastName": "Client", "email": "adminvisible@example.com",
    "phone": "+1111111111", "source": "website", "createdById": 1
  }' | jq

curl -s -X POST http://localhost:3000/api/clients \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "StaffVisible", "lastName": "Client", "email": "staffvisible@example.com",
    "phone": "+2222222222", "source": "referral", "createdById": 1, "assignedStaffId": 2
  }' | jq

# Create applications for both clients (using the client IDs from above — adjust as needed)
curl -s -X POST http://localhost:3000/api/applications \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": <UNASSIGNED_CLIENT_ID>,
    "serviceType": "UK Tourist Visa",
    "destinationCountry": "United Kingdom",
    "travelPurpose": "Tourism"
  }' | jq

curl -s -X POST http://localhost:3000/api/applications \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": <ASSIGNED_CLIENT_ID>,
    "serviceType": "Canada Study Permit",
    "destinationCountry": "Canada",
    "travelPurpose": "Study",
    "assignedStaffId": 2
  }' | jq

# Log in at http://localhost:3000 — you will switch between admin and staff accounts
```

---

### Test Steps

#### Part A — Backend API Permission Enforcement

1. **GET /api/clients as admin (sees all clients):**

   - Log in as admin (`admin@waypoint.com` / `password123`).

   ```bash
   curl -s http://localhost:3000/api/clients \
     -H "Cookie: mock-auth-user=admin@waypoint.com" | jq
   ```
   Expected: Returns 200 with all clients in the database. Both "AdminVisible Client" and "StaffVisible Client" are present in the response.

2. **GET /api/clients as staff (sees only assigned clients):**

   - Log in as staff (`staff@waypoint.com` / `password123`).

   ```bash
   curl -s http://localhost:3000/api/clients \
     -H "Cookie: mock-auth-user=staff@waypoint.com" | jq
   ```
   Expected: Returns 200 but only clients where `assignedStaffId` matches the staff user (id=2). "AdminVisible Client" (unassigned) should NOT appear. "StaffVisible Client" (assigned to staff) SHOULD appear.

3. **GET /api/clients as unauthenticated (empty response):**

   ```bash
   curl -s http://localhost:3000/api/clients | jq
   ```
   Expected: Returns 200 with `{ clients: [] }` — no error, just empty data.

4. **POST /api/clients as admin (allowed):**

   ```bash
   curl -s -X POST http://localhost:3000/api/clients \
     -H "Content-Type: application/json" \
     -H "Cookie: mock-auth-user=admin@waypoint.com" \
     -d '{
       "firstName": "PermTest", "lastName": "AdminCreate", "email": "permtest1@example.com",
       "phone": "+3333333333", "source": "walk-in", "createdById": 1
     }' | jq
   ```
   Expected: Returns 201 with the new client.

5. **POST /api/clients as staff (rejected):**

   ```bash
   curl -s -X POST http://localhost:3000/api/clients \
     -H "Content-Type: application/json" \
     -H "Cookie: mock-auth-user=staff@waypoint.com" \
     -d '{
       "firstName": "PermTest", "lastName": "StaffCreate", "email": "permtest2@example.com",
       "phone": "+4444444444", "source": "phone", "createdById": 2
     }' | jq
   ```
   Expected: Returns 403 with `{ error: "Only administrators can create clients" }`.

6. **PATCH /api/clients as admin (allowed):**

   - First note the ID of any existing client.

   ```bash
   curl -s -X PATCH http://localhost:3000/api/clients \
     -H "Content-Type: application/json" \
     -H "Cookie: mock-auth-user=admin@waypoint.com" \
     -d '{"id": <CLIENT_ID>, "firstName": "UpdatedByAdmin"}' | jq
   ```
   Expected: Returns 200 with the updated client.

7. **PATCH /api/clients as staff (rejected):**

   ```bash
   curl -s -X PATCH http://localhost:3000/api/clients \
     -H "Content-Type: application/json" \
     -H "Cookie: mock-auth-user=staff@waypoint.com" \
     -d '{"id": <CLIENT_ID>, "firstName": "AttemptedByStaff"}' | jq
   ```
   Expected: Returns 403 with `{ error: "Only administrators can update clients" }`.

8. **GET /api/applications as admin (sees all applications):**

   ```bash
   curl -s http://localhost:3000/api/applications \
     -H "Cookie: mock-auth-user=admin@waypoint.com" | jq
   ```
   Expected: Returns 200 with all applications, including those linked to unassigned clients and assigned clients. Both the UK Tourist Visa and Canada Study Permit applications are present.

9. **GET /api/applications as staff (sees only applications for assigned clients):**

   ```bash
   curl -s http://localhost:3000/api/applications \
     -H "Cookie: mock-auth-user=staff@waypoint.com" | jq
   ```
   Expected: Returns 200 but only applications where the linked client's `assignedStaffId` matches the staff user (id=2). The Canada Study Permit (assigned to staff) SHOULD appear. The UK Tourist Visa (for unassigned client) should NOT appear.

10. **GET /api/applications as unauthenticated (empty response):**

    ```bash
    curl -s http://localhost:3000/api/applications | jq
    ```
    Expected: Returns 200 with `{ applications: [] }`.

11. **POST /api/applications as admin (allowed):**

    ```bash
    curl -s -X POST http://localhost:3000/api/applications \
      -H "Content-Type: application/json" \
      -H "Cookie: mock-auth-user=admin@waypoint.com" \
      -d '{
        "clientId": <CLIENT_ID>,
        "serviceType": "Schengen Tourist Visa",
        "destinationCountry": "France",
        "travelPurpose": "Tourism"
      }' | jq
    ```
    Expected: Returns 201 with the new application.

12. **POST /api/applications as staff (rejected):**

    ```bash
    curl -s -X POST http://localhost:3000/api/applications \
      -H "Content-Type: application/json" \
      -H "Cookie: mock-auth-user=staff@waypoint.com" \
      -d '{
        "clientId": <CLIENT_ID>,
        "serviceType": "USA B1/B2 Visa",
        "destinationCountry": "USA",
        "travelPurpose": "Business"
      }' | jq
    ```
    Expected: Returns 403 with `{ error: "Only administrators can create applications" }`.

13. **PATCH /api/applications as admin (allowed):**

    ```bash
    curl -s -X PATCH http://localhost:3000/api/applications \
      -H "Content-Type: application/json" \
      -H "Cookie: mock-auth-user=admin@waypoint.com" \
      -d '{"id": <APP_ID>, "currentStage": "INITIAL_CONSULTATION"}' | jq
    ```
    Expected: Returns 200 with the updated application.

14. **PATCH /api/applications as staff (rejected):**

    ```bash
    curl -s -X PATCH http://localhost:3000/api/applications \
      -H "Content-Type: application/json" \
      -H "Cookie: mock-auth-user=staff@waypoint.com" \
      -d '{"id": <APP_ID>, "currentStage": "DOCUMENT_COLLECTION_VERIFICATION"}' | jq
    ```
    Expected: Returns 403 with `{ error: "Only administrators can update applications" }`.

#### Part B — Frontend UI Visibility Enforcement

15. **Admin sees "Register Client" button:**

    - Log in as admin via the browser (`http://localhost:3000`).
    - Navigate to the Clients tab.
    - The "Register Client" button is visible in the header area.

16. **Staff does NOT see "Register Client" button:**

    - Log in as staff (`staff@waypoint.com` / `password123`).
    - Navigate to the Clients tab.
    - The "Register Client" button is NOT visible. The header only shows the title and description.

17. **Admin sees "New Application" button:**

    - Log in as admin.
    - Navigate to the Applications tab.
    - The "New Application" button is visible.

18. **Staff does NOT see "New Application" button:**

    - Log in as staff.
    - Navigate to the Applications tab.
    - The "New Application" button is NOT visible.

19. **Admin sees "Edit Profile" button on client profile:**

    - Log in as admin.
    - Navigate to the Clients tab.
    - Click "View File" on any client to open the client profile page.
    - The "Edit Profile" button is visible in the profile header.

20. **Staff does NOT see "Edit Profile" button on client profile:**

    - Log in as staff.
    - Navigate to the Clients tab.
    - Click "View File" on a client the staff member is assigned to.
    - The "Edit Profile" button is NOT visible in the profile header.

21. **Staff can still view client profiles for assigned clients:**

    - Log in as staff.
    - Navigate to the Clients tab.
    - Only clients assigned to the staff member appear in the list.
    - Click "View File" — the client profile loads with all read-only fields (contact info, personal details, record details).
    - All data renders correctly without edit controls.

22. **Staff sees empty client list when no clients are assigned:**

    - Create or ensure a staff user exists with no assigned clients.
    - Log in as that staff member and navigate to Clients.
    - The client list table should be empty, showing the empty state message ("No clients registered yet").

23. **Staff sees filtered applications list:**

    - Log in as staff.
    - Navigate to the Applications tab.
    - The applications table only shows applications for clients assigned to that staff member.
    - Applications linked to unassigned clients or clients assigned to other staff are not visible.

#### Part C — Auth Helper

24. **`getCurrentUserFromCookies` resolves admin correctly:**

    ```bash
    # Use a quick Node script to verify the auth helper
    node -e "
    const { createServer } = require('http');
    createServer((req, res) => {
      // Verify the mock-auth-user cookie is read
      const cookie = req.headers.cookie;
      if (cookie && cookie.includes('mock-auth-user=admin@waypoint.com')) {
        res.writeHead(200);
        res.end('admin resolved');
      } else {
        res.writeHead(200);
        res.end('no user');
      }
    }).listen(9999, () => {
      const http = require('http');
      const opts = { hostname: 'localhost', port: 9999, path: '/', headers: { Cookie: 'mock-auth-user=admin@waypoint.com' } };
      http.get(opts, (r) => { let d=''; r.on('data', c => d+=c); r.on('end', () => { console.log('Result:', d); process.exit(); }); });
    });
    " 2>/dev/null
    ```
    Alternatively, verify by sending curl requests and confirming the cookie is read — the API routes that call `getCurrentUserFromCookies` behave correctly based on user role in all steps above.

25. **Build verification:**

    ```bash
    npm run build
    ```
    Expected: "✓ Compiled successfully". No new TypeScript or build errors related to permissions code.

    ```bash
    npm run lint
    ```
    Expected: No new lint errors introduced by `src/lib/auth.ts`, the API route changes, or the frontend permission guards.

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

---

# Phase 4 — Test Plan: Workflow Pipeline

## Setup Commands

```bash
# Regenerate the Prisma client and apply the stage-history migration
npx prisma generate
npx prisma migrate dev

# Start the dev server
npm run dev

# Log in as admin, assign an existing client to staff (id=2), and create an application for it
curl -s -c admin.jar -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@waypoint.com", "password": "password123"}' | jq

curl -s -b admin.jar -X PATCH http://localhost:3000/api/clients \
  -H "Content-Type: application/json" \
  -d '{"id": <CLIENT_ID>, "assignedStaffId": 2}' | jq

curl -s -b admin.jar -X POST http://localhost:3000/api/applications \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": <CLIENT_ID>,
    "serviceType": "UK Tourist Visa",
    "destinationCountry": "United Kingdom",
    "travelPurpose": "Tourism",
    "assignedStaffId": 2
  }' | jq

# Also log in as staff for the scoped tests below
curl -s -c staff.jar -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "staff@waypoint.com", "password": "password123"}' | jq
```

---

## Task 1 — Workflow Stage Constants and Transition Rules

### Test Steps

1. **Stage order and labels are centralized:**

   - `src/lib/workflow.ts` exports `STAGE_ORDER` (the 12 stages, same order as the `WorkflowStage` seed rows) and `STAGE_LABELS` (human-readable titles).
   - Expected: Every place in the UI that shows a stage (applications table, application detail header, pipeline board columns) renders via `STAGE_LABELS`, not the raw enum string.

2. **Illegal transition rejected (skipping stages):**

   ```bash
   curl -s -w "\nHTTP_STATUS:%{http_code}\n" -b admin.jar -X POST http://localhost:3000/api/applications/<APP_ID>/stage \
     -H "Content-Type: application/json" \
     -d '{"toStage": "DECISION"}'
   ```
   Expected: `400` with `{ error: "Cannot move from CLIENT_INQUIRY to DECISION" }` (or whatever the application's actual current stage is) — a fresh application cannot jump straight to `DECISION`.

3. **Legal one-step-forward transition accepted:**

   ```bash
   curl -s -w "\nHTTP_STATUS:%{http_code}\n" -b admin.jar -X POST http://localhost:3000/api/applications/<APP_ID>/stage \
     -H "Content-Type: application/json" \
     -d '{"toStage": "CUSTOMER_SERVICE_REGISTRATION"}'
   ```
   Expected: `200` with the updated `application.currentStage`.

4. **`DECISION` branches to both terminal paths, plus one step back:**

   - Drive the application (repeating step 3 with each next stage) up to `DECISION`.
   - Expected: `getAllowedNextStages("DECISION")` (and therefore the detail page's Move Stage buttons) offers `VISA_APPROVED_PATH`, `VISA_REFUSED_PATH`, and `APPLICATION_TRACKING` (step back) — never a skip to some other unrelated stage.

## Task 2 — Workflow Stage History Model

### Test Steps

1. **History row created on every transition:**

   ```bash
   curl -s -b admin.jar http://localhost:3000/api/applications/<APP_ID>/stage | jq
   ```
   Expected: `200` with `{ history: [...] }` — one entry per transition made so far, each with `fromStage`, `toStage`, `changedBy.name`, and `createdAt`, ordered oldest first.

2. **History survives an application delete via cascade (schema check):**

   - `prisma/schema.prisma`: `ApplicationStageHistory.application` uses `onDelete: Cascade` — deleting an `Application` also removes its history rows, no orphaned foreign keys left behind.

## Task 3 — Application Detail Page with Current Stage

### Test Steps

1. **"View" opens the detail page:**

   - Log in as admin in the browser, navigate to Applications, click "View" on any row.
   - Expected: The list is replaced by the detail page — client name/file number, service type, destination, travel purpose, expected travel date, assigned staff, and the current stage/status/decision badges.

2. **Back button returns to the list:**

   - Click "Back to Applications".
   - Expected: The applications table reappears (list state, not detail).

3. **Stage history renders on the detail page:**

   - Expected: The "Stage History" card lists every transition recorded for this application (see Task 2), most recent last.

## Task 4 — Admin Pipeline Board by Stage

### Test Steps

1. **Pipeline nav item visible to both roles:**

   - Log in as admin, then as staff — in both cases the "Pipeline" item appears in the sidebar.

2. **Board renders one column per stage:**

   - Open the Pipeline tab.
   - Expected: 12 horizontally-scrollable columns, one per `STAGE_ORDER` entry, each showing its applications as cards with client name, service type, file number, and assigned staff.

3. **Staff sees only their assigned applications on the board:**

   - Log in as staff, open Pipeline.
   - Expected: Only applications whose client is assigned to this staff member appear in any column; unassigned/other-staff applications are absent (same scoping as the Applications list).

4. **Clicking a card opens its detail page:**

   - Click a card's client name (not the drag handle).
   - Expected: Navigates to the Applications tab with that application's detail page open (Task 3's view).

## Task 5 — Stage Movement Actions and Activity Logging

#### Part A — Backend API Permission Enforcement

1. **Admin can move any application:**

   ```bash
   curl -s -w "\nHTTP_STATUS:%{http_code}\n" -b admin.jar -X POST http://localhost:3000/api/applications/<ANY_APP_ID>/stage \
     -H "Content-Type: application/json" \
     -d '{"toStage": "INITIAL_CONSULTATION"}'
   ```
   Expected: `200`.

2. **Assigned staff can move their own application:**

   ```bash
   curl -s -w "\nHTTP_STATUS:%{http_code}\n" -b staff.jar -X POST http://localhost:3000/api/applications/<ASSIGNED_APP_ID>/stage \
     -H "Content-Type: application/json" \
     -d '{"toStage": "INITIAL_CONSULTATION"}'
   ```
   Expected: `200`.

3. **Staff is rejected on an application not assigned to them:**

   ```bash
   curl -s -w "\nHTTP_STATUS:%{http_code}\n" -b staff.jar -X POST http://localhost:3000/api/applications/<OTHER_APP_ID>/stage \
     -H "Content-Type: application/json" \
     -d '{"toStage": "INITIAL_CONSULTATION"}'
   ```
   Expected: `403` with `{ error: "You do not have permission to move this application" }`.

4. **Unauthenticated request rejected:**

   ```bash
   curl -s -w "\nHTTP_STATUS:%{http_code}\n" -X POST http://localhost:3000/api/applications/<APP_ID>/stage \
     -H "Content-Type: application/json" \
     -d '{"toStage": "INITIAL_CONSULTATION"}'
   ```
   Expected: `401`.

5. **Every successful move writes a history row (see Task 2, step 1)** — confirm the `changedById` matches whichever user (admin or staff) performed the move.

#### Part B — Frontend UI Enforcement

6. **Detail page hides Move Stage controls for unauthorized staff:**

   - Log in as staff, open the detail page of an application not assigned to them (via direct navigation/URL is not possible in this single-page app, so this is enforced primarily server-side — verify via Part A step 3).
   - For an application assigned to them: the Move Stage buttons are visible and functional.

7. **Pipeline card drag handle hidden when not permitted:**

   - Log in as staff, open Pipeline.
   - Expected: Cards for applications not assigned to this staff member render without the grip/drag handle (not draggable); assigned cards show the handle.

8. **Drag-and-drop moves a card and calls the same endpoint:**

   - Log in as admin, open Pipeline, drag a card from its column into an adjacent legal column.
   - Expected: The card moves to the new column; `GET /api/applications/<id>/stage` shows a new history entry with the matching `toStage`.

9. **Illegal drag target is rejected client-side:**

   - Drag a card into a non-adjacent, non-legal column (e.g. `CLIENT_INQUIRY` straight into `QUALITY_REVIEW`).
   - Expected: No request is sent, the card stays in its original column, and an inline error banner explains the invalid move.

## Task 6 — Approved/Refused Decision Branching

### Test Steps

1. **Drive an application to `DECISION`:**

   - Repeat legal one-step transitions (Task 1) until `currentStage` is `DECISION`.

2. **Approve branches to the approved path:**

   ```bash
   curl -s -w "\nHTTP_STATUS:%{http_code}\n" -b admin.jar -X POST http://localhost:3000/api/applications/<APP_ID>/stage \
     -H "Content-Type: application/json" \
     -d '{"toStage": "VISA_APPROVED_PATH", "decisionStatus": "APPROVED"}'
   ```
   Expected: `200`, `currentStage: "VISA_APPROVED_PATH"`, `decisionStatus: "APPROVED"`.

3. **Refuse branches to the refused path:** same as step 2 with `toStage: "VISA_REFUSED_PATH"`, `decisionStatus: "REFUSED"` on a different application at `DECISION`. Expected: `200`, `currentStage: "VISA_REFUSED_PATH"`.

4. **Mismatched decision/stage pair rejected:**

   ```bash
   curl -s -w "\nHTTP_STATUS:%{http_code}\n" -b admin.jar -X POST http://localhost:3000/api/applications/<APP_ID>/stage \
     -H "Content-Type: application/json" \
     -d '{"toStage": "VISA_REFUSED_PATH", "decisionStatus": "APPROVED"}'
   ```
   Expected: `400` with `{ error: "Decision \"APPROVED\" must move the application to VISA_APPROVED_PATH" }`.

5. **Withdrawn / Pending Action update `decisionStatus` without leaving `DECISION`:**

   ```bash
   curl -s -w "\nHTTP_STATUS:%{http_code}\n" -b admin.jar -X POST http://localhost:3000/api/applications/<APP_ID>/stage \
     -H "Content-Type: application/json" \
     -d '{"toStage": "DECISION", "decisionStatus": "WITHDRAWN"}'
   ```
   Expected: `200`, `currentStage` unchanged (`"DECISION"`), `decisionStatus: "WITHDRAWN"`, and a new history row is still recorded (`fromStage` === `toStage`).

6. **Detail page decision buttons match this endpoint:**

   - Log in as admin, open the detail page of an application at `DECISION`.
   - Expected: Four buttons — Approve, Refuse, Mark Withdrawn, Pending Action — each calling the same endpoint/payload combinations as steps 2–5.

7. **Build and lint verification:**

   ```bash
   npm run build
   ```
   Expected: "✓ Compiled successfully" with no new TypeScript errors.

   ```bash
   npm run lint
   ```
   Expected: No new errors beyond the codebase's pre-existing lint baseline.

---

# Phase 5 — Test Plan: Task Assignment

## Setup Commands

```bash
# Start the dev server
npm run dev

# Regenerate Prisma client after model changes
npx prisma generate
npx prisma migrate dev

# Ensure we have test data
curl -s -X POST http://localhost:3000/api/clients \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "TaskTest", "lastName": "Client", "email": "tasktest@example.com",
    "phone": "+5555555555", "source": "website", "createdById": 1
  }' | jq

curl -s -X POST http://localhost:3000/api/applications \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": <CLIENT_ID>,
    "serviceType": "UK Tourist Visa",
    "destinationCountry": "United Kingdom",
    "travelPurpose": "Tourism"
  }' | jq
```

---

## Task 1 — Create task database model and API/actions

### Test Steps

1. **Prisma schema validation:**

   ```bash
   grep -A 20 "model Task" prisma/schema.prisma
   ```
   Expected: Task model with `id`, `title`, `description`, `clientId`, `applicationId`, `stage`, `assigneeId`, `assignedById`, `priority`, `status`, `dueDate`, `completedAt`, `@@map("tasks")`.

   ```bash
   npm run db:generate
   ```
   Expected: "✔ Generated Prisma Client" with no errors.

2. **Migration file exists:**

   ```bash
   ls prisma/migrations/*add_task_model/migration.sql
   ```
   Expected: Migration file creates the `tasks` table with foreign keys to `clients`, `applications`, and `users`.

3. **API — POST /api/tasks (create task):**

   ```bash
   curl -s -X POST http://localhost:3000/api/tasks \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Review passport documents",
       "description": "Check passport validity and expiry date",
       "clientId": <CLIENT_ID>,
       "applicationId": <APP_ID>,
       "stage": "DOCUMENT_COLLECTION_VERIFICATION",
       "assigneeId": 2,
       "priority": "HIGH",
       "dueDate": "2026-08-01T00:00:00.000Z"
     }' | jq
   ```
   Expected: Returns 201. `status` defaults to `"TODO"`, `assignedBy` nested object present, `assignee` nested object present.

4. **API — POST /api/tasks (validation):**

   ```bash
   # Missing required fields
   curl -s -X POST http://localhost:3000/api/tasks \
     -H "Content-Type: application/json" \
     -d '{"title": "No client"}' | jq
   ```
   Expected: Returns 400 with `{ error: "Title and client ID are required" }`.

5. **API — GET /api/tasks (list tasks):**

   ```bash
   curl -s http://localhost:3000/api/tasks | jq
   ```
   Expected: Returns 200 with `{ tasks: [...] }`. Each task includes nested `client`, `application`, `assignee`, and `assignedBy`.

6. **API — PATCH /api/tasks (update task):**

   ```bash
   # Update status to IN_PROGRESS
   curl -s -X PATCH http://localhost:3000/api/tasks \
     -H "Content-Type: application/json" \
     -d '{"id": 1, "status": "IN_PROGRESS"}' | jq
   ```
   Expected: Returns 200. `status` is now `"IN_PROGRESS"`, `completedAt` remains `null`.

   ```bash
   # Mark as done
   curl -s -X PATCH http://localhost:3000/api/tasks \
     -H "Content-Type: application/json" \
     -d '{"id": 1, "status": "DONE"}' | jq
   ```
   Expected: Returns 200. `status` is `"DONE"`, `completedAt` is set to the current timestamp.

   ```bash
   # Update priority and reassign
   curl -s -X PATCH http://localhost:3000/api/tasks \
     -H "Content-Type: application/json" \
     -d '{"id": 1, "priority": "URGENT", "assigneeId": 2}' | jq
   ```
   Expected: Returns 200. `priority` is `"URGENT"`, `assignee` is updated.

   ```bash
   # Missing id
   curl -s -X PATCH http://localhost:3000/api/tasks \
     -H "Content-Type: application/json" \
     -d '{"title": "No ID"}' | jq
   ```
   Expected: Returns 400 with `{ error: "Task ID is required" }`.

   ```bash
   # Non-existent task
   curl -s -X PATCH http://localhost:3000/api/tasks \
     -H "Content-Type: application/json" \
     -d '{"id": 9999, "status": "DONE"}' | jq
   ```
   Expected: Returns 404 with `{ error: "Task not found" }`.

7. **Build verification:**

   ```bash
   npm run build
   ```
   Expected: "✓ Compiled successfully". `/api/tasks` appears as a dynamic route (ƒ).

---

## Task 2 — Admin task creation and assignment UI

### Test Steps

1. **Tasks tab visible for both roles:**

   - Log in as admin — "Tasks" appears in the sidebar.
   - Log in as staff — "Tasks" appears in the sidebar.
   - Click "Tasks" — the Task Manager page loads with header "Task Manager".

2. **Admin sees "Create Task" button:**

   - Log in as admin — a "Create Task" button is visible in the top-right area.

   ```bash
   # Verify the button is only for admins
   grep -n "role.*ADMIN.*Create Task\|Create Task.*ADMIN" src/app/page.tsx
   ```
   Expected: The Create Task button is wrapped in `{user?.role === "ADMIN" && (`.

3. **Opening the creation modal:**

   - Click "Create Task" — a modal overlay appears with heading "Create New Task".
   - Modal has a "Cancel" button in the top-right.
   - Form fields: Title (required), Description (textarea), Client (dropdown), Application (dropdown), Workflow Stage (dropdown), Assignee (dropdown), Priority (dropdown), Due Date.

4. **Creating a task:**

   ```bash
   # Create via the UI, or test via API:
   curl -s -X POST http://localhost:3000/api/tasks \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Review passport documents",
       "description": "Check passport validity and expiry date",
       "clientId": 1,
       "applicationId": 1,
       "stage": "DOCUMENT_COLLECTION_VERIFICATION",
       "assigneeId": 2,
       "priority": "HIGH",
       "dueDate": "2026-08-01T00:00:00.000Z"
     }' | jq
   ```
   Expected: Returns 201. Task appears in the tasks table.

5. **Tasks table displays correctly:**

   - Columns: Task, Client, Stage, Assignee, Priority, Due, Status.
   - Priority is color-coded: URGENT (red), HIGH (orange), MEDIUM (blue), LOW (muted).
   - Status is color-coded: DONE (green), IN_PROGRESS (blue), WAITING (yellow), CANCELLED (red), TODO (muted).
   - Stage column shows human-readable stage label from `STAGE_LABELS`.
   - Due date formatted as "DD Mon".

6. **Client dropdown populated:**

   - The Client dropdown in the create modal lists all clients as "WP-XXXX-YYYY — FirstName LastName".

7. **Application dropdown filtered by client:**

   - Selecting a client filters the Application dropdown to only show applications for that client.

8. **Staff does NOT see "Create Task" button:**

   - Log in as staff (`staff@waypoint.com` / `password123`).
   - Navigate to Tasks tab.
   - The "Create Task" button is not visible.

---

## Task 3 — Staff task dashboard

### Test Steps

1. **Dashboard loads live data:**

   - Log in as admin and navigate to Dashboard.
   - "Active Client Profiles" card shows the count from `/api/clients`.

   ```bash
   curl -s http://localhost:3000/api/clients | jq '.clients | length'
   ```

2. **Pipeline Overview panel:**

   - Shows each workflow stage with a count of applications in that stage.
   - Counts match the actual application data.

   ```bash
   curl -s http://localhost:3000/api/applications | jq '.applications | group_by(.currentStage) | map({stage: .[0].currentStage, count: length})'
   ```

3. **High-Priority Tasks panel:**

   - Shows active tasks (not DONE and not CANCELLED), limited to 6 items.
   - Each task shows title, client name, and a color-coded priority badge.
   - Priority colors: URGENT (red), HIGH (orange), MEDIUM/LOW (blue).

4. **Recent Tasks table:**

   - Shows 5 most recent tasks.
   - Columns: Task, Client, Assignee, Priority, Status.
   - "View All" link navigates to the Tasks tab.

5. **Overdue counter is accurate:**

   - "Overdue Staff Tasks" card counts tasks where `dueDate < now` AND `status !== "DONE"` AND `status !== "CANCELLED"`.

6. **Build verification:**

   ```bash
   npm run build
   ```
   Expected: "✓ Compiled successfully" with no errors.
