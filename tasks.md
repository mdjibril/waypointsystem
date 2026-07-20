# Way Point Travel Limited Development Task Breakdown

This task plan is designed for a two-person development team. Each task should be done on its own branch and merged through a pull request.

## Team Roles

### Developer 1: Platform, Auth, Admin, Reporting

Owns the system foundation, admin controls, permissions, dashboards, reports, and deployment setup.

### Developer 2: Client Workflow, Staff Tools, Documents

Owns client records, application workflow, staff work screens, document handling, and day-to-day operational features.

Both developers should review each other's pull requests before merging into `main`.

## Branch Rules

- Work from latest `main`.
- Use one branch per task.
- Keep branches short-lived.
- Run lint/build before opening a pull request.
- Do not edit the same feature files at the same time unless agreed.
- Merge foundation/database changes before dependent UI work.

Example branch names:

- `feature/project-setup`
- `feature/auth-roles`
- `feature/client-registration`
- `feature/workflow-pipeline`
- `feature/task-assignment`
- `feature/admin-dashboard`

## Phase 1: Project Foundation

These tasks should be completed first because all other features depend on them.

| Task | Owner | Branch | Depends On |
| --- | --- | --- | --- |
| [x] Set up Next.js, TypeScript, Tailwind CSS, app layout, linting, and basic folder structure | Developer 1 | `feature/project-setup` | None |
| [x] Configure database, Prisma, environment variables, and base migration | Developer 1 | `feature/database-setup` | Project setup |
| [x] Create shared UI shell: sidebar, top bar, dashboard layout, empty states, buttons, tables, forms | Developer 2 | `feature/ui-shell` | Project setup |
| [x] Add seed data for admin user, staff user, workflow stages, service types, and document templates | Developer 1 | `feature/seed-data` | Database setup |

Merge order:

1. `feature/project-setup`
2. `feature/database-setup`
3. `feature/ui-shell`
4. `feature/seed-data`

## Phase 2: Authentication And Roles

| Task | Owner | Branch | Depends On |
| --- | --- | --- | --- |
| [x] Build login/logout flow | Developer 1 | `feature/auth-login` | Database setup |
| [x] Add admin/staff role model and route protection | Developer 1 | `feature/role-protection` | Auth login |
| [x] Build staff management screen for admin | Developer 1 | `feature/staff-management` | Role protection |
| [x] Add current user profile menu and password/account basics | Developer 2 | `feature/user-profile` | Auth login |

Merge order:

1. `feature/auth-login`
2. `feature/role-protection`
3. `feature/staff-management`
4. `feature/user-profile`

## Phase 3: Client And Application Management

| Task | Owner | Branch | Depends On |
| --- | --- | --- | --- |
| [x] Create client database model and API/actions | Developer 2 | `feature/client-model` | Database setup |
| [x] Build client registration form | Developer 2 | `feature/client-registration` | Client model, UI shell |
| [x] Build client list with search and filters | Developer 2 | `feature/client-list` | Client registration |
| [x] Build client profile page | Developer 2 | `feature/client-profile` | Client list |
| [x] Create application database model linked to client | Developer 2 | `feature/application-model` | Client model |
| [x] Build application creation form | Developer 2 | `feature/application-create` | Application model |
| [x] Add admin visibility for all clients and staff visibility for assigned clients | Developer 1 | `feature/client-permissions` | Role protection, client profile |

Merge order:

1. `feature/client-model`
2. `feature/client-registration`
3. `feature/client-list`
4. `feature/client-profile`
5. `feature/application-model`
6. `feature/application-create`
7. `feature/client-permissions`

## Phase 4: Workflow Pipeline

| Task | Owner | Branch | Depends On |
| --- | --- | --- | --- |
| [ ] Define workflow stage constants and transition rules | Developer 1 | `feature/workflow-rules` | Application model |
| [ ] Add workflow stage history model | Developer 1 | `feature/stage-history` | Workflow rules |
| [ ] Build application detail page with current stage | Developer 2 | `feature/application-detail` | Application create, workflow rules |
| [ ] Build admin pipeline board by stage | Developer 2 | `feature/workflow-pipeline` | Application detail, stage history |
| [ ] Add stage movement actions and activity logging | Developer 1 | `feature/stage-transitions` | Stage history, pipeline |
| [ ] Add approved/refused decision branching | Developer 2 | `feature/decision-branching` | Stage transitions |

Merge order:

1. `feature/workflow-rules`
2. `feature/stage-history`
3. `feature/application-detail`
4. `feature/workflow-pipeline`
5. `feature/stage-transitions`
6. `feature/decision-branching`

## Phase 5: Task Assignment

| Task | Owner | Branch | Depends On |
| --- | --- | --- | --- |
| [ ] Create task database model and API/actions | Developer 1 | `feature/task-model` | Client/application models |
| [ ] Build admin task creation and assignment UI | Developer 1 | `feature/admin-task-assignment` | Task model, staff management |
| [ ] Build staff task dashboard | Developer 2 | `feature/staff-task-dashboard` | Task model |
| [ ] Add task status updates, comments, and completion flow | Developer 2 | `feature/task-status-updates` | Staff task dashboard |
| [ ] Add overdue task indicators and filters | Developer 1 | `feature/task-overdue-filters` | Task status updates |
| [ ] Link tasks to workflow stages and client profile | Developer 2 | `feature/task-client-linking` | Client profile, task model |

Merge order:

1. `feature/task-model`
2. `feature/admin-task-assignment`
3. `feature/staff-task-dashboard`
4. `feature/task-status-updates`
5. `feature/task-overdue-filters`
6. `feature/task-client-linking`

## Phase 6: Documents And Checklists

| Task | Owner | Branch | Depends On |
| --- | --- | --- | --- |
| [ ] Create document and checklist template database models | Developer 2 | `feature/document-models` | Application model |
| [ ] Build admin document checklist template management | Developer 1 | `feature/document-template-admin` | Document models |
| [ ] Build document upload UI on application/client profile | Developer 2 | `feature/document-upload` | Document models, client profile |
| [ ] Add document verification status and notes | Developer 2 | `feature/document-verification` | Document upload |
| [ ] Build document review queue for admin/senior staff | Developer 1 | `feature/document-review-queue` | Document verification |
| [ ] Add missing document indicators to workflow and dashboard | Developer 1 | `feature/document-metrics` | Document verification |

Merge order:

1. `feature/document-models`
2. `feature/document-template-admin`
3. `feature/document-upload`
4. `feature/document-verification`
5. `feature/document-review-queue`
6. `feature/document-metrics`

## Phase 7: Payments And Service Agreement

| Task | Owner | Branch | Depends On |
| --- | --- | --- | --- |
| [ ] Create payment/invoice database model | Developer 1 | `feature/payment-model` | Application model |
| [ ] Build payment entry form and payment status display | Developer 1 | `feature/payment-entry` | Payment model |
| [ ] Add invoice number and receipt upload support | Developer 1 | `feature/invoice-receipts` | Payment entry |
| [ ] Show payment summary on client/application profile | Developer 2 | `feature/payment-profile-summary` | Payment entry, client profile |
| [ ] Add outstanding balance metric to admin dashboard data | Developer 1 | `feature/payment-dashboard-metrics` | Payment entry |

Merge order:

1. `feature/payment-model`
2. `feature/payment-entry`
3. `feature/invoice-receipts`
4. `feature/payment-profile-summary`
5. `feature/payment-dashboard-metrics`

## Phase 8: Quality Review And Submission

| Task | Owner | Branch | Depends On |
| --- | --- | --- | --- |
| [ ] Create quality review model/checklist | Developer 1 | `feature/quality-review-model` | Workflow rules |
| [ ] Build quality review queue | Developer 1 | `feature/quality-review-queue` | Quality review model |
| [ ] Add review approval/correction flow | Developer 1 | `feature/review-approval-flow` | Quality review queue |
| [ ] Block application submission until review passes | Developer 1 | `feature/submission-blocking` | Review approval flow |
| [ ] Build submission details form: reference, date, biometrics, portal | Developer 2 | `feature/submission-details` | Submission blocking |
| [ ] Add application tracking updates and reminders | Developer 2 | `feature/application-tracking` | Submission details |

Merge order:

1. `feature/quality-review-model`
2. `feature/quality-review-queue`
3. `feature/review-approval-flow`
4. `feature/submission-blocking`
5. `feature/submission-details`
6. `feature/application-tracking`

## Phase 9: Dashboards And Metrics

| Task | Owner | Branch | Depends On |
| --- | --- | --- | --- |
| [ ] Build admin dashboard data queries | Developer 1 | `feature/admin-dashboard-data` | Tasks, workflow, payments |
| [ ] Build admin dashboard UI with charts and cards | Developer 1 | `feature/admin-dashboard-ui` | Admin dashboard data |
| [ ] Build staff dashboard data queries | Developer 2 | `feature/staff-dashboard-data` | Tasks, assigned clients |
| [ ] Build staff dashboard UI | Developer 2 | `feature/staff-dashboard-ui` | Staff dashboard data |
| [ ] Add reports page for approvals, refusals, revenue, staff workload, and stage duration | Developer 1 | `feature/reports-page` | Admin dashboard data |
| [ ] Add export filters for reports | Developer 2 | `feature/report-filters` | Reports page |

Merge order:

1. `feature/admin-dashboard-data`
2. `feature/admin-dashboard-ui`
3. `feature/staff-dashboard-data`
4. `feature/staff-dashboard-ui`
5. `feature/reports-page`
6. `feature/report-filters`

## Phase 10: Notifications, Audit Log, And Polish

| Task | Owner | Branch | Depends On |
| --- | --- | --- | --- |
| [ ] Create activity log model and helper | Developer 1 | `feature/activity-log` | Core models |
| [ ] Show activity timeline on client/application profile | Developer 2 | `feature/activity-timeline` | Activity log, client profile |
| [ ] Add in-app notification model | Developer 1 | `feature/notification-model` | Task model |
| [ ] Build notification dropdown/list | Developer 2 | `feature/notification-ui` | Notification model |
| [ ] Trigger notifications for task assignment, overdue tasks, and stage changes | Developer 1 | `feature/notification-triggers` | Notification UI |
| [ ] Improve validation, loading states, empty states, and error states | Developer 2 | `feature/ui-polish` | Most UI complete |

Merge order:

1. `feature/activity-log`
2. `feature/activity-timeline`
3. `feature/notification-model`
4. `feature/notification-ui`
5. `feature/notification-triggers`
6. `feature/ui-polish`

## Phase 11: Testing And Deployment

| Task | Owner | Branch | Depends On |
| --- | --- | --- | --- |
| [ ] Add unit tests for workflow rules and permissions | Developer 1 | `feature/workflow-permission-tests` | Workflow and auth |
| [ ] Add basic integration tests for client, task, and application flows | Developer 2 | `feature/core-flow-tests` | Main features complete |
| [ ] Add production environment configuration guide | Developer 1 | `feature/deployment-docs` | Project setup |
| [ ] Prepare database migration/deployment checklist | Developer 1 | `feature/db-deployment-checklist` | Database stable |
| [ ] Test full admin workflow from inquiry to decision | Developer 2 | `feature/manual-qa-admin-flow` | Main features complete |
| [ ] Fix final bugs from QA | Both | `fix/final-qa-issues` | QA complete |

Merge order:

1. `feature/workflow-permission-tests`
2. `feature/core-flow-tests`
3. `feature/deployment-docs`
4. `feature/db-deployment-checklist`
5. `feature/manual-qa-admin-flow`
6. `fix/final-qa-issues`

## Suggested First Sprint

The first sprint should produce a usable foundation that both developers can build on.

### Developer 1

- `feature/project-setup`
- `feature/database-setup`
- `feature/seed-data`
- `feature/auth-login`
- `feature/role-protection`

### Developer 2

- `feature/ui-shell`
- `feature/client-model`
- `feature/client-registration`
- `feature/client-list`
- `feature/client-profile`

## Suggested Second Sprint

The second sprint should make the system useful for real internal operations.

### Developer 1

- `feature/staff-management`
- `feature/client-permissions`
- `feature/workflow-rules`
- `feature/stage-history`
- `feature/task-model`
- `feature/admin-task-assignment`

### Developer 2

- `feature/application-model`
- `feature/application-create`
- `feature/application-detail`
- `feature/workflow-pipeline`
- `feature/staff-task-dashboard`
- `feature/task-status-updates`

## Definition Of Done

A task is done only when:

- The feature works from the UI.
- Server-side validation exists where needed.
- Permissions are respected.
- Database changes are migrated.
- Empty/loading/error states are handled.
- The code passes lint/build.
- The pull request has been reviewed.
- The branch has been merged into `main`.

## Daily Team Routine

1. Pull latest `main`.
2. Pick one assigned task.
3. Create or continue the task branch.
4. Work only inside the scope of that task.
5. Commit small meaningful changes.
6. Merge latest `main` into your branch before opening PR.
7. Open PR and ask the other developer to review.
8. Merge after approval and passing checks.
