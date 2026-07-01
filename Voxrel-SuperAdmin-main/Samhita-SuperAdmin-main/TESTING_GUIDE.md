# Complete Testing Guide - KreativS AI Multi-Dashboard Flow

This guide walks you through testing the complete workflow across Super Admin, Admin, and Freelancer dashboards as per the PRD requirements.

## Prerequisites

1. **Backend is running** on the configured port (usually `http://localhost:3001` or similar)
2. **Frontend dashboards are running**:
   - Super Admin: `http://localhost:3000` (or configured port)
   - Admin: Same or different port
   - Freelancer: Same or different port
3. **Database is seeded** with test credentials (run `npm run seed:credentials` in backend)

## Test Credentials

### Super Admin (Platform Admin)
- **Email**: `superadmin@kreactive.com`
- **Password**: `SuperAdmin123!@#`
- **Access**: Full platform access

### Admin (Project Admin)
- **Email**: `admin@kreactive.com`
- **Password**: `Admin123!@#`
- **Access**: Project-specific management

### Freelancer
- **Email**: `freelancer@kreactive.com`
- **Password**: `Freelancer123!@#`
- **Access**: Task claiming and completion

---

## Phase 1: Super Admin Dashboard Testing

### Test 1.1: Super Admin Login & Dashboard Access

**Objective**: Verify Super Admin can access the platform dashboard

**Steps**:
1. Navigate to login page
2. Enter Super Admin credentials:
   - Email: `superadmin@kreactive.com`
   - Password: `SuperAdmin123!@#`
3. Click "Login"

**Expected Results**:
- ✅ Login successful
- ✅ Redirected to `/super-admin` (NOT `/projects` or `/task/manage`)
- ✅ See "Projects" heading with "Manage all projects in the system" subtitle
- ✅ See "Create Project" button
- ✅ Sidebar shows "Super Admin" section with:
  - Projects link
  - Create Project link

**PRD Reference**: Section 4.4 - Platform Admin workflow

---

### Test 1.2: View All Projects (Empty State)

**Objective**: Verify Super Admin can see projects table

**Steps**:
1. After login, you should be on `/super-admin`
2. Observe the projects table

**Expected Results**:
- ✅ Projects table is visible
- ✅ Table headers: Project Name, Project Type, Status, Created At, Assigned Admins, Actions
- ✅ If no projects: Shows "No projects found" with "Create Project" button
- ✅ Filter bar visible with:
  - Search input
  - Status filter (All, Active, Inactive, Archived)
  - Type filter (All, Audio Recording, Transcription, Review, Custom Workflow)

**PRD Reference**: Section 4.4 - Platform Admin dashboard displays all projects

---

### Test 1.3: Create Audio Recording Project

**Objective**: Verify Super Admin can create projects

**Steps**:
1. Click "Create Project" button
2. Fill in project details:
   - **Name**: "Audio Recording Project 1"
   - **Description**: "Test audio recording project for PRD validation"
   - **Type**: Select "Audio Recording"
3. Click "Create Project"

**Expected Results**:
- ✅ Project created successfully
- ✅ Redirected back to `/super-admin`
- ✅ New project appears in the projects table
- ✅ Project shows:
  - Name: "Audio Recording Project 1"
  - Type: "Audio Recording"
  - Status: "ACTIVE" (default)
  - Created At: Current date
  - Assigned Admins: "No admins" (empty)

**PRD Reference**: Section 3.1 - Super Admin creates projects at platform level

---

### Test 1.4: Create Transcription Project

**Objective**: Verify multiple project types can be created

**Steps**:
1. Click "Create Project"
2. Fill in:
   - **Name**: "Transcription Project 1"
   - **Type**: "Transcription"
3. Click "Create Project"

**Expected Results**:
- ✅ Transcription project created
- ✅ Appears in projects table with type "Transcription"

**PRD Reference**: Section 4.1 - Configurable Project Types

---

### Test 1.5: Create Review Project

**Steps**:
1. Create project:
   - **Name**: "Review Project 1"
   - **Type**: "Review"
2. Create project

**Expected Results**:
- ✅ Review project created successfully

**PRD Reference**: Section 4.1 - Review Project type

---

### Test 1.6: Assign Admin to Project

**Objective**: Verify Super Admin can assign Project Admins to projects

**Prerequisites**: Admin user must exist (created via seed script)

**Steps**:
1. On `/super-admin` page, find "Audio Recording Project 1"
2. Click the three-dot menu (⋮) in the Actions column
3. Click "Assign Admin"
4. In the dialog:
   - Select "Admin User (admin@kreactive.com)" from dropdown
5. Click "Assign Admin"

**Expected Results**:
- ✅ Dialog opens showing project name
- ✅ Admin dropdown shows available admins
- ✅ Assignment successful
- ✅ "Assigned Admins" column shows badge with admin name
- ✅ Success notification appears

**PRD Reference**: Section 3.1 - Super Admin assigns projects to Project Admins

---

### Test 1.7: Filter and Search Projects

**Objective**: Verify filtering and search functionality

**Steps**:
1. Use search box: Type "Audio"
2. Use Type filter: Select "Audio Recording"
3. Use Status filter: Select "Active"
4. Click "Reset" button

**Expected Results**:
- ✅ Search filters projects by name/description
- ✅ Type filter shows only matching project types
- ✅ Status filter shows only matching statuses
- ✅ Reset clears all filters

**PRD Reference**: Section 4.4 - Platform Admin dashboard functionality

---

### Test 1.8: Select Project (Navigate to Admin Dashboard)

**Objective**: Verify Super Admin can access project-specific admin dashboard

**Steps**:
1. Click on "Audio Recording Project 1" row OR
2. Click three-dot menu → "Open Dashboard"

**Expected Results**:
- ✅ Redirected to `/projects/{projectId}/recording` (for Audio Recording type)
- ✅ Project-specific admin dashboard opens
- ✅ Super Admin has same capabilities as Project Admin for that project

**PRD Reference**: Section 4.4 - Platform Admin picks project → opens admin dashboard

---

## Phase 2: Admin Dashboard Testing

### Test 2.1: Admin Login & Project Selection

**Objective**: Verify Admin sees only assigned projects

**Steps**:
1. Logout from Super Admin
2. Login as Admin:
   - Email: `admin@kreactive.com`
   - Password: `Admin123!@#`
3. Observe landing page

**Expected Results**:
- ✅ Login successful
- ✅ Redirected to `/projects` (project selection page)
- ✅ See projects assigned to this admin
- ✅ Should see "Audio Recording Project 1" (assigned in Test 1.6)
- ✅ Can see project cards or list

**PRD Reference**: Section 4.3 - Project Admin workflow, Section 3.2 - Project Admin receives projects

---

### Test 2.2: Admin Selects Project

**Objective**: Verify Admin can access project dashboard

**Steps**:
1. Click on "Audio Recording Project 1" project card/row

**Expected Results**:
- ✅ Redirected to project-specific dashboard
- ✅ For Audio Recording: `/projects/{projectId}/recording`
- ✅ Dashboard shows project-specific tasks and management options

**PRD Reference**: Section 4.3 - Admin picks project → system opens admin dashboard

---

### Test 2.3: Admin Creates Task in Project

**Objective**: Verify Admin can create tasks within assigned project

**Steps**:
1. In project dashboard, navigate to "Create Task" or "Task Management"
2. Create a new task:
   - Title: "Test Audio Recording Task"
   - Description: "Test task for PRD validation"
   - Priority: Medium
   - Language: English
   - Price: 10.00
   - Upload audio file (if required)
3. Submit task

**Expected Results**:
- ✅ Task created successfully
- ✅ Task appears in project task list
- ✅ Task is linked to the selected project
- ✅ Task status: "OPEN" (available for claiming)

**PRD Reference**: Section 3.2 - Project Admin creates tasks, Section 5 - Task Lifecycle

---

### Test 2.4: Admin Assigns User to Project

**Objective**: Verify Admin can add users to project

**Steps**:
1. In project dashboard, navigate to "User Management" or "Add Users"
2. Add freelancer user to project:
   - Select: `freelancer@kreactive.com`
   - Add to project

**Expected Results**:
- ✅ User added successfully
- ✅ User can now see and access this project

**PRD Reference**: Section 3.2 - Project Admin manages users within Project

---

## Phase 3: Freelancer Dashboard Testing

### Test 3.1: Freelancer Login & Project Selection

**Objective**: Verify Freelancer sees assigned projects

**Steps**:
1. Logout from Admin
2. Login as Freelancer:
   - Email: `freelancer@kreactive.com`
   - Password: `Freelancer123!@#`
3. Observe landing page

**Expected Results**:
- ✅ Login successful
- ✅ Redirected to project selection page
- ✅ See projects assigned to this freelancer
- ✅ Should see "Audio Recording Project 1" (if assigned in Test 2.4)

**PRD Reference**: Section 4.2 - User workflow, Section 3.3 - Users access only assigned Projects

---

### Test 3.2: Freelancer Selects Project

**Objective**: Verify Freelancer can access project workflow

**Steps**:
1. Click on "Audio Recording Project 1"

**Expected Results**:
- ✅ Redirected to project-specific workflow
- ✅ For Audio Recording: Opens recording interface
- ✅ Can see available tasks in that project

**PRD Reference**: Section 4.2 - User picks project → system opens workflow, Section 4.5.1 - Audio Recording Project

---

### Test 3.3: Freelancer Views Tasks

**Objective**: Verify Freelancer can see project-specific tasks

**Steps**:
1. In project dashboard, navigate to "Tasks" or "Available Tasks"

**Expected Results**:
- ✅ See tasks belonging to selected project only
- ✅ See "Test Audio Recording Task" (created in Test 2.3)
- ✅ Tasks show: Title, Description, Price, Status, Language
- ✅ Can claim tasks

**PRD Reference**: Section 4.2 - Users have visibility to see tasks available, Section 6 - Transcription Workflow

---

### Test 3.4: Freelancer Claims Task

**Objective**: Verify task claiming is project-specific

**Steps**:
1. Find "Test Audio Recording Task"
2. Click "Claim Task" or similar action

**Expected Results**:
- ✅ Task claimed successfully
- ✅ Task status changes to "PENDING_APPROVAL" or "ASSIGNED"
- ✅ Task appears in "My Tasks" or "Claimed Tasks"
- ✅ Admin can see claim request

**PRD Reference**: Section 4.2 - Claim tasks, Section 5.4 - Task Claim/Assignment

---

### Test 3.5: Freelancer Completes Task

**Objective**: Verify task submission workflow

**Steps**:
1. Open claimed task
2. Complete the work (record audio, transcribe, etc.)
3. Submit task for review

**Expected Results**:
- ✅ Task submitted successfully
- ✅ Task status: "SUBMITTED"
- ✅ Task appears in Admin's review queue
- ✅ Admin can review and approve/reject

**PRD Reference**: Section 5.4 - Task submission, Section 6.1 - Task submission for review

---

## Phase 4: Cross-Dashboard Workflow Testing

### Test 4.1: Task Lifecycle - Audio Recording Flow

**Objective**: Verify complete task lifecycle from creation to review

**Workflow**:
1. **Super Admin**: Creates "Audio Recording Project" and "Audio Review Project"
2. **Super Admin**: Assigns Admin to both projects
3. **Admin**: Logs in, selects "Audio Recording Project"
4. **Admin**: Creates task "Record Test Audio"
5. **Admin**: Assigns Freelancer to project
6. **Freelancer**: Logs in, selects "Audio Recording Project"
7. **Freelancer**: Claims "Record Test Audio" task
8. **Admin**: Approves claim (task status: ASSIGNED)
9. **Freelancer**: Records audio, submits task
10. **Admin**: Reviews submission, spawns to "Audio Review Project"
11. **Admin**: Logs in to "Audio Review Project", reviews and approves

**Expected Results**:
- ✅ Each step completes successfully
- ✅ Task moves through statuses: OPEN → PENDING_APPROVAL → ASSIGNED → SUBMITTED → IN_REVIEW → COMPLETED
- ✅ Task can be moved between projects (spawn functionality)

**PRD Reference**: Section 5.4 - Task Lifecycle, Section 3.2 - Spawns task from one project to another

---

### Test 4.2: Task Lifecycle - Transcription Flow

**Objective**: Verify transcription project workflow

**Workflow**:
1. **Super Admin**: Creates "Transcription Project" and "Transcription Review Project"
2. **Super Admin**: Assigns Admin to both
3. **Admin**: Creates transcription task with audio file
4. **Freelancer**: Claims and completes transcription
5. **Admin**: Reviews and moves to review project

**Expected Results**:
- ✅ Transcription workflow works end-to-end
- ✅ Tasks are project-specific
- ✅ Review process functions correctly

**PRD Reference**: Section 6 - Transcription Workflow, Section 6.1 - Task Lifecycle

---

### Test 4.3: Multi-Project Admin Access

**Objective**: Verify Admin can manage multiple projects

**Steps**:
1. **Super Admin**: Assign same Admin to multiple projects
2. **Admin**: Login and view project selection
3. **Admin**: Select different projects and verify access

**Expected Results**:
- ✅ Admin sees all assigned projects
- ✅ Can switch between projects
- ✅ Each project maintains separate task lists
- ✅ Project-specific settings are maintained

**PRD Reference**: Section 3.2 - Admins can own more than 1 project

---

### Test 4.4: Super Admin Cross-Project Task Movement

**Objective**: Verify Super Admin can move tasks across any projects

**Steps**:
1. **Super Admin**: Login to project dashboard
2. **Super Admin**: Find a completed/submitted task
3. **Super Admin**: Use "Spawn Task" or "Move Task" feature
4. **Super Admin**: Select target project (can be any project)

**Expected Results**:
- ✅ Super Admin can move tasks to any project
- ✅ Task appears in target project
- ✅ Task history/context preserved

**PRD Reference**: Section 3.1 - Super Admin spawns task from one project to another, Section 3.4 - Platform Admin can move Tasks/Files across any projects

---

### Test 4.5: Admin Limited Project Movement

**Objective**: Verify Admin can only move tasks between owned projects

**Steps**:
1. **Admin**: Login to project dashboard
2. **Admin**: Try to spawn task to a project not owned by this admin

**Expected Results**:
- ✅ Admin can only see/select projects they own
- ✅ Cannot move tasks to unassigned projects
- ✅ Can move between owned projects (e.g., Recording → Review)

**PRD Reference**: Section 3.4 - Project Admin can only Move tasks/files between projects they own

---

## Phase 5: Edge Cases & Validation

### Test 5.1: Role-Based Access Control

**Objective**: Verify proper access restrictions

**Tests**:
1. **Freelancer** tries to access `/super-admin` → Should redirect or show 403
2. **Admin** tries to access `/super-admin` → Should redirect or show 403
3. **Super Admin** can access all routes → ✅
4. **Freelancer** tries to create project → Should fail
5. **Admin** tries to assign admin to project → Should fail (only Super Admin)

**Expected Results**:
- ✅ Role guards work correctly
- ✅ Unauthorized access is blocked
- ✅ Proper error messages shown

**PRD Reference**: Section 3.4 - Role separation

---

### Test 5.2: Project-Specific Task Isolation

**Objective**: Verify tasks are isolated by project

**Steps**:
1. Create two projects: "Project A" and "Project B"
2. Create tasks in each project
3. Login as Freelancer assigned to "Project A" only
4. View available tasks

**Expected Results**:
- ✅ Freelancer only sees tasks from "Project A"
- ✅ Cannot see or claim tasks from "Project B"
- ✅ Task claiming is project-specific

**PRD Reference**: Section 4.2 - Users claim tasks only from the project they are working in

---

### Test 5.3: Empty States

**Objective**: Verify proper empty state handling

**Tests**:
1. Super Admin with no projects → Shows "No projects found"
2. Admin with no assigned projects → Shows appropriate message
3. Freelancer with no assigned projects → Shows appropriate message
4. Project with no tasks → Shows "No tasks available"

**Expected Results**:
- ✅ Clear empty state messages
- ✅ Action buttons to create/add content
- ✅ No errors or crashes

---

## Phase 6: UI/UX Validation

### Test 6.1: Navigation Consistency

**Objective**: Verify navigation works across dashboards

**Checks**:
- ✅ Sidebar navigation is role-appropriate
- ✅ Breadcrumbs show current location
- ✅ Back buttons work correctly
- ✅ Project selection persists across navigation

---

### Test 6.2: Responsive Design

**Objective**: Verify mobile/tablet compatibility

**Tests**:
- ✅ Dashboard works on mobile viewport
- ✅ Tables are scrollable/responsive
- ✅ Forms are usable on mobile
- ✅ Dialogs/modals work on small screens

---

### Test 6.3: Loading States

**Objective**: Verify proper loading indicators

**Checks**:
- ✅ Loading spinners during API calls
- ✅ Skeleton loaders for data fetching
- ✅ Disabled buttons during operations
- ✅ Success/error notifications appear

---

## Testing Checklist Summary

### Super Admin Features
- [ ] Login and redirect to `/super-admin`
- [ ] View all projects table
- [ ] Create projects (all types)
- [ ] Assign admins to projects
- [ ] Filter and search projects
- [ ] Navigate to project dashboards
- [ ] Move tasks across any projects

### Admin Features
- [ ] Login and see assigned projects
- [ ] Select and access project dashboards
- [ ] Create tasks in projects
- [ ] Assign users to projects
- [ ] Approve task claims
- [ ] Review and spawn tasks to review projects
- [ ] Move tasks between owned projects only

### Freelancer Features
- [ ] Login and see assigned projects
- [ ] Select project and access workflow
- [ ] View project-specific tasks
- [ ] Claim tasks
- [ ] Complete and submit tasks
- [ ] View completed tasks and earnings

### Cross-Dashboard
- [ ] Task lifecycle works end-to-end
- [ ] Project isolation maintained
- [ ] Role-based access enforced
- [ ] Data consistency across dashboards

---

## Troubleshooting

### Issue: Cannot see projects after creation
- **Check**: Backend API is running
- **Check**: API response structure matches frontend expectations
- **Check**: Browser console for errors

### Issue: Cannot assign admin
- **Check**: Admin user exists in database
- **Check**: Admin has role "ADMIN" or "SUPER_ADMIN"
- **Check**: API endpoint `/admin/projects/:id/admins` is working

### Issue: Tasks not appearing
- **Check**: Task is linked to correct project
- **Check**: User is assigned to project
- **Check**: Task status allows viewing

### Issue: Cannot spawn/move tasks
- **Check**: User has appropriate permissions
- **Check**: Target project exists
- **Check**: API endpoint is accessible

---

## Next Steps After Testing

1. **Document Issues**: Note any bugs or missing features
2. **Verify PRD Compliance**: Ensure all PRD requirements are met
3. **Performance Testing**: Test with large datasets
4. **Security Audit**: Verify role-based access is secure
5. **User Acceptance**: Get stakeholder approval

---

## PRD Compliance Checklist

### Section 3: User Roles ✅
- [x] Super Admin creates and assigns projects
- [x] Project Admin manages assigned projects
- [x] Users work in assigned projects only

### Section 4: Project Framework ✅
- [x] Configurable project types
- [x] User workflow (select project → workflow)
- [x] Project Admin workflow
- [x] Platform Admin workflow
- [x] System behavior after project selection

### Section 5-7: Workflows ✅
- [x] Audio Recording workflow
- [x] Transcription workflow
- [x] Review workflow
- [x] Task lifecycle management

### Section 8: Multi-Tenant ✅
- [x] Tenant separation (projects isolate data)
- [x] Role structure implemented
- [x] Controlled access per role

---

**Last Updated**: Based on PRD dated 01-01-2026
**Version**: 1.0

