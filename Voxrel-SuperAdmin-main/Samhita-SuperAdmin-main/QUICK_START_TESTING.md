# Quick Start Testing Guide - Dashboard Flow Verification

## 🚀 Quick Setup

1. **Start Backend**:
   ```bash
   cd C:\Users\beula\Documents\Kreactive-backend-main
   npm run seed:credentials  # Create test users
   npm run dev
   ```

2. **Start Frontend**:
   ```bash
   cd C:\Users\beula\Documents\Kreative-superadmin-frontend
   npm run dev
   ```

---

## 📋 Testing Flow (Follow in Order)

### Step 1: Super Admin Setup (5 minutes)

**Login**: `superadmin@kreactive.com` / `SuperAdmin123!@#`

1. ✅ Verify redirect to `/super-admin`
2. ✅ Create 3 projects:
   - "Audio Recording Project 1" (Type: Audio Recording)
   - "Transcription Project 1" (Type: Transcription)
   - "Review Project 1" (Type: Review)
3. ✅ Assign Admin to "Audio Recording Project 1":
   - Click ⋮ menu → "Assign Admin"
   - Select "Admin User"
   - Verify admin appears in "Assigned Admins" column

**Expected**: Projects table shows 3 projects, one with assigned admin

---

### Step 2: Admin Workflow (5 minutes)

**Logout** → **Login**: `admin@kreactive.com` / `Admin123!@#`

1. ✅ Verify redirect to `/projects` (project selection)
2. ✅ See "Audio Recording Project 1" (assigned project)
3. ✅ Click on "Audio Recording Project 1"
4. ✅ Verify redirect to project dashboard
5. ✅ Create a task:
   - Navigate to "Create Task" or "Task Management"
   - Fill task details
   - Submit
6. ✅ Add Freelancer to project:
   - Navigate to "User Management" or "Add Users"
   - Add `freelancer@kreactive.com`

**Expected**: Admin can manage assigned project, create tasks, add users

---

### Step 3: Freelancer Workflow (5 minutes)

**Logout** → **Login**: `freelancer@kreactive.com` / `Freelancer123!@#`

1. ✅ Verify redirect to project selection page
2. ✅ See "Audio Recording Project 1" (assigned project)
3. ✅ Click on "Audio Recording Project 1"
4. ✅ Verify project-specific workflow opens
5. ✅ View available tasks (should see task created by Admin)
6. ✅ Claim a task
7. ✅ Complete and submit task

**Expected**: Freelancer can see assigned projects, claim tasks, submit work

---

### Step 4: Cross-Dashboard Verification (5 minutes)

**Switch back to Admin** (`admin@kreactive.com`)

1. ✅ View submitted task from Freelancer
2. ✅ Review task submission
3. ✅ Approve or spawn to review project
4. ✅ Verify task status changes

**Switch to Super Admin** (`superadmin@kreactive.com`)

1. ✅ Verify can see all projects
2. ✅ Click on any project → Access project dashboard
3. ✅ Verify can move tasks across any projects

**Expected**: All dashboards connected, data flows correctly

---

## ✅ PRD Compliance Checklist

### Section 3: User Roles
- [x] Super Admin creates projects
- [x] Super Admin assigns projects to Admins
- [x] Admin manages assigned projects
- [x] Users work in assigned projects only

### Section 4: Project Framework
- [x] Project selection page for all users
- [x] Project-specific workflows
- [x] Super Admin sees all projects
- [x] Admin sees assigned projects only
- [x] Freelancer sees assigned projects only

### Section 5-7: Workflows
- [x] Audio Recording project workflow
- [x] Transcription project workflow
- [x] Review project workflow
- [x] Task lifecycle (Create → Claim → Submit → Review)

### Section 8: Multi-Tenant
- [x] Project-based data isolation
- [x] Role-based access control
- [x] Proper permission enforcement

---

## 🔍 Key Things to Verify

### Navigation Flow
```
Super Admin Login
  → /super-admin (Projects table)
    → Create Project
    → Assign Admin
    → Click Project → /projects/{id}/recording

Admin Login
  → /projects (Project selection)
    → Click Project → /projects/{id}/recording
      → Create Task
      → Add Users

Freelancer Login
  → /projects (Project selection)
    → Click Project → Project Workflow
      → View Tasks
      → Claim Task
      → Submit Task
```

### Data Flow
```
Super Admin creates Project
  → Assigns Admin to Project
    → Admin creates Task in Project
      → Admin adds Freelancer to Project
        → Freelancer claims Task
          → Freelancer submits Task
            → Admin reviews Task
              → Admin spawns to Review Project
```

### Role Permissions
- **Super Admin**: All projects, all actions
- **Admin**: Assigned projects only, project management
- **Freelancer**: Assigned projects only, task claiming

---

## 🐛 Common Issues & Quick Fixes

| Issue | Quick Fix |
|-------|-----------|
| Cannot login | Check backend is running, verify credentials in DB |
| Projects not showing | Check API endpoint, verify project assignment |
| Cannot assign admin | Verify admin user exists, check API response |
| Tasks not visible | Verify user assigned to project, check task project link |
| Wrong redirect | Check user role in localStorage, verify login logic |

---

## 📊 Testing Results Template

```
Date: ___________
Tester: ___________

Super Admin Tests:
[ ] Login & redirect
[ ] Create projects
[ ] Assign admins
[ ] Filter/search projects
[ ] Navigate to project dashboards

Admin Tests:
[ ] Login & see assigned projects
[ ] Access project dashboard
[ ] Create tasks
[ ] Add users
[ ] Review tasks

Freelancer Tests:
[ ] Login & see assigned projects
[ ] Access project workflow
[ ] View tasks
[ ] Claim tasks
[ ] Submit tasks

Cross-Dashboard:
[ ] Task lifecycle works
[ ] Data isolation maintained
[ ] Role permissions enforced

Issues Found:
1. _______________________
2. _______________________
3. _______________________

Overall Status: [ ] Pass [ ] Fail [ ] Needs Work
```

---

## 🎯 Success Criteria

✅ **All dashboards accessible with correct credentials**
✅ **Projects created and visible to appropriate users**
✅ **Task lifecycle works end-to-end**
✅ **Role-based access properly enforced**
✅ **Data flows correctly between dashboards**
✅ **No console errors or crashes**

---

**For detailed testing steps, see `TESTING_GUIDE.md`**

