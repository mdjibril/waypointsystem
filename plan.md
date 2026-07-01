# Way Point Travel Limited Internal Workflow System Plan

## 1. Product Goal

Build an internal workflow management system for Way Point Travel Limited to help admins and staff manage client travel/visa service activities from inquiry to follow-up.

The system should make it easy to:

- Register clients and create client files.
- Move each client through the service workflow stages.
- Assign tasks to staff at the right stage.
- Track documents, payments, visa processing, submissions, decisions, bookings, and follow-ups.
- Give admins a clear dashboard of workload, delays, revenue, approvals, refusals, and staff activity.
- Keep a searchable history of all client updates and actions.

## 2. User Roles

### Admin

Admin users manage the business workflow and have full visibility.

Core permissions:

- Create, edit, and archive staff accounts.
- Register clients and assign staff.
- Create and assign tasks.
- Move client files between workflow stages.
- View all clients, applications, payments, documents, and reports.
- Approve quality review steps.
- View business metrics and staff performance.
- Configure service types, destinations, document checklists, and workflow rules.

### Staff

Staff users handle assigned work and update client files.

Core permissions:

- View assigned clients and tasks.
- Update task status.
- Upload and verify documents when permitted.
- Add notes, call logs, and client updates.
- Move a client file to the next stage only where their role allows it.
- Flag blockers, missing documents, urgent cases, or client follow-up needs.

## 3. Main Workflow Stages

Each client file should have one active workflow stage at a time. Every stage can contain assigned tasks, notes, deadlines, documents, and status updates.

1. **Client Inquiry**
   - Capture walk-in, phone, WhatsApp, referral, website, or social media inquiry.
   - Record intended destination, service type, travel purpose, expected travel date, and source.

2. **Customer Service Registration**
   - Create client profile.
   - Create client file/reference number.
   - Capture contact details, passport details, next of kin, and communication preference.

3. **Initial Consultation**
   - Perform eligibility check.
   - Record travel assessment, visa history, employment/business status, financial strength, and risk notes.
   - Recommend service path.

4. **Payment & Service Agreement**
   - Generate invoice.
   - Record payment status: unpaid, part-paid, paid, refunded.
   - Upload signed agreement and receipts.

5. **Document Collection & Verification**
   - Show checklist based on destination and service type.
   - Mark documents as pending, submitted, verified, rejected, or needs correction.
   - Assign document follow-up tasks.

6. **Visa Processing**
   - Track form completion.
   - Prepare cover letter.
   - Prepare itinerary.
   - Attach draft application documents.

7. **Quality Review**
   - Assign senior visa officer or admin for final check.
   - Record review outcome: approved for submission, corrections required, escalated.
   - Prevent submission until quality review is passed.

8. **Application Submission**
   - Record submission date, embassy/VFS/TLS/portal reference, and biometrics booking.
   - Upload appointment confirmation and submitted application copy.

9. **Application Tracking**
   - Track application status and client updates.
   - Schedule follow-up reminders.
   - Record embassy requests or additional document requests.

10. **Decision**
    - Record outcome: approved, refused, withdrawn, pending extra action.
    - Upload decision letter or visa copy.

11. **Visa Approved Path**
    - Flight booking.
    - Hotel booking.
    - Travel insurance.
    - Pre-departure briefing.
    - Client travels successfully.
    - Follow-up, testimonials, and referrals.

12. **Visa Refused Path**
    - Refusal review.
    - Identify refusal reasons.
    - Reapply strategy.
    - Optional new application workflow.

## 4. Core System Modules

### Authentication & Access Control

- Login/logout.
- Admin and staff roles.
- Optional future roles: customer service, visa officer, senior visa officer, accountant, manager.
- Role-based permissions for viewing, editing, assigning, approving, and reporting.

### Client Management

- Client profile.
- Client file number.
- Passport and travel details.
- Communication history.
- Multiple applications per client.
- Notes and internal comments.

### Workflow Pipeline

- Kanban-style view of client files by workflow stage.
- List/table view with filters.
- Stage status: not started, in progress, blocked, waiting for client, completed.
- Stage deadlines and overdue indicators.
- Branching after decision: approved path or refused path.

### Task Management

- Admin assigns tasks to staff.
- Tasks can be linked to a client, application, workflow stage, or document.
- Fields: title, description, assignee, priority, due date, status, comments.
- Task statuses: todo, in progress, waiting, done, cancelled.
- Overdue task notifications.

### Document Management

- Upload documents per client/application.
- Document checklist templates by destination/service.
- Verification status per document.
- Rejection/correction reason.
- Secure document storage.

### Payment & Invoice Tracking

- Invoice creation.
- Payment records.
- Receipt upload/generation.
- Balance due.
- Payment status visible on client file.
- Admin metrics for revenue and outstanding balances.

### Quality Review

- Review checklist before submission.
- Senior officer/admin approval.
- Correction comments.
- Audit trail of who approved and when.

### Application Tracking & Client Updates

- Record submission reference.
- Track embassy/application status.
- Schedule client update reminders.
- Log every client communication.
- Store final decision and supporting files.

### Dashboard & Reports

Admin dashboard should show:

- Total active client files.
- New inquiries this week/month.
- Clients by workflow stage.
- Overdue tasks.
- Staff workload.
- Applications submitted.
- Approved vs refused visa outcomes.
- Revenue collected.
- Outstanding payments.
- Documents pending from clients.
- Files blocked or waiting for client.
- Average processing time per stage.

Staff dashboard should show:

- My assigned tasks.
- My active client files.
- Overdue tasks.
- Tasks due today.
- Clients waiting on my action.
- Recent updates on assigned files.

### Notifications

Initial version can use in-app notifications.

Later versions can add:

- Email reminders.
- WhatsApp/SMS reminders.
- Client update templates.
- Daily admin summary.

## 5. Recommended Data Model

### Users

- id
- name
- email
- phone
- role
- status
- password_hash
- created_at
- updated_at

### Clients

- id
- file_number
- first_name
- last_name
- email
- phone
- address
- passport_number
- date_of_birth
- source
- created_by
- assigned_staff_id
- created_at
- updated_at

### Applications

- id
- client_id
- service_type
- destination_country
- travel_purpose
- expected_travel_date
- current_stage
- status
- decision_status
- assigned_staff_id
- created_at
- updated_at

### WorkflowStageHistory

- id
- application_id
- stage
- status
- entered_at
- completed_at
- completed_by
- notes

### Tasks

- id
- application_id
- client_id
- stage
- title
- description
- assignee_id
- assigned_by
- priority
- due_date
- status
- completed_at
- created_at
- updated_at

### Documents

- id
- application_id
- client_id
- document_type
- file_url
- status
- verification_notes
- uploaded_by
- verified_by
- created_at
- updated_at

### DocumentChecklistTemplates

- id
- service_type
- destination_country
- document_name
- is_required
- sort_order

### Payments

- id
- application_id
- client_id
- invoice_number
- amount_due
- amount_paid
- balance
- payment_status
- payment_method
- receipt_url
- paid_at
- created_at
- updated_at

### Notes

- id
- client_id
- application_id
- author_id
- note_type
- body
- created_at

### ActivityLog

- id
- actor_id
- entity_type
- entity_id
- action
- metadata
- created_at

## 6. Main Screens

### Admin Screens

- Admin dashboard.
- Staff management.
- Client list.
- Client profile.
- Application pipeline.
- Task board.
- Document review queue.
- Payment/invoice dashboard.
- Quality review queue.
- Reports and analytics.
- Settings for workflow stages, document checklists, service types, and destinations.

### Staff Screens

- Staff dashboard.
- My tasks.
- Assigned clients.
- Client profile.
- Application details.
- Document upload/verification.
- Notes and client update log.

## 7. Workflow Rules

- A client must be registered before an application can be processed.
- Payment/service agreement should be completed before full document processing starts, unless admin overrides.
- Application cannot move to submission until quality review is approved.
- Decision stage must branch to either approved path or refused path.
- Every stage movement should create an activity log entry.
- Every task assignment should notify the assigned staff member.
- Overdue tasks should be highlighted on dashboards.
- Staff should only see assigned work unless admin grants broader access.

## 8. Suggested Technology Stack

Recommended stack for fast implementation:

- **Frontend/Backend:** Next.js with TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** NextAuth/Auth.js or custom credentials auth
- **File Storage:** local storage for development, S3-compatible storage for production
- **UI:** Tailwind CSS plus a component library such as shadcn/ui
- **Charts:** Recharts
- **Deployment:** Vercel or a VPS, with managed PostgreSQL

This stack is suitable because it supports dashboards, forms, file uploads, role-based pages, and API routes in one codebase.

## 9. Implementation Phases

### Phase 1: Foundation

- Set up Next.js, TypeScript, Tailwind CSS, and database.
- Configure authentication.
- Create user roles: admin and staff.
- Add database schema and migrations.
- Seed initial admin account and workflow stages.

### Phase 2: Client & Application Management

- Build client registration.
- Build client list and search.
- Build client profile page.
- Create application records linked to clients.
- Add current workflow stage to each application.

### Phase 3: Task Assignment

- Build admin task creation and assignment.
- Build staff task dashboard.
- Add task status updates.
- Add overdue indicators.
- Add activity log entries for task changes.

### Phase 4: Workflow Pipeline

- Build admin pipeline view by workflow stage.
- Allow stage movement based on permissions.
- Add stage history.
- Add blocked/waiting statuses.
- Add approved/refused decision branching.

### Phase 5: Documents & Payments

- Build document checklist templates.
- Build document upload and verification.
- Build invoice/payment tracking.
- Add receipts and payment status to client/application profile.

### Phase 6: Quality Review & Submission

- Build quality review queue.
- Add review checklist and approval.
- Block submission until approval.
- Add submission details, biometrics booking, and application reference tracking.

### Phase 7: Metrics & Reporting

- Build admin dashboard charts.
- Add staff workload metrics.
- Add approval/refusal reports.
- Add revenue and outstanding payment reports.
- Add stage duration and bottleneck reports.

### Phase 8: Notifications & Polish

- Add in-app notifications.
- Add daily reminders for overdue tasks.
- Improve filters, exports, and audit logs.
- Add optional email/WhatsApp/SMS integrations.
- Harden permissions and production deployment settings.

## 10. Minimum Viable Product Scope

The first usable version should include:

- Admin and staff login.
- Client registration.
- Application creation.
- Workflow stage tracking.
- Admin task assignment.
- Staff task dashboard.
- Client/application notes.
- Basic document checklist.
- Payment status tracking.
- Admin dashboard with key metrics.

Features such as automated WhatsApp/SMS, advanced reports, and generated invoices can come after the MVP.

## 11. Key Metrics To Track

- Number of active clients.
- Number of applications by stage.
- New inquiries per day/week/month.
- Tasks completed per staff member.
- Overdue tasks.
- Average time spent per workflow stage.
- Total payments collected.
- Outstanding balances.
- Approval rate.
- Refusal rate.
- Reapplication count.
- Referral/testimonial count.

## 12. Risks And Mitigations

- **Unclear staff responsibilities:** define staff roles and permissions early.
- **Missing document requirements:** use configurable checklist templates by destination and service type.
- **Workflow delays:** use due dates, overdue flags, and dashboard alerts.
- **Poor auditability:** log every important change in the activity log.
- **Sensitive client documents:** restrict document access and use secure storage.
- **Manual communication gaps:** start with communication logs, then add automated reminders later.

## 13. Recommended Next Step

Start with Phase 1 and Phase 2, then build the task assignment and workflow pipeline immediately after. This gives Way Point Travel Limited a working internal system quickly, while leaving room to add payments, documents, quality review, and analytics in controlled phases.
