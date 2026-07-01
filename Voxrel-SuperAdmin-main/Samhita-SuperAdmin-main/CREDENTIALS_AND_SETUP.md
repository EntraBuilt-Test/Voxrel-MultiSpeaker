# Super Admin Dashboard - Credentials and Setup Guide

## Overview
This document provides credentials and setup instructions for the KreativS AI Super Admin Dashboard implementation.

## Database Credentials

After running the seed script, you will have the following credentials:

### Super Admin (Platform Admin)
- **Email**: `superadmin@kreactive.com`
- **Password**: `SuperAdmin123!@#`
- **Role**: `SUPER_ADMIN`
- **Access**: Full platform access, can create projects, assign admins, manage all projects

### Admin (Project Admin)
- **Email**: `admin@kreactive.com`
- **Password**: `Admin123!@#`
- **Role**: `ADMIN`
- **Access**: Can manage assigned projects, create tasks, manage users within projects

### Freelancer
- **Email**: `freelancer@kreactive.com`
- **Password**: `Freelancer123!@#`
- **Role**: `FREELANCER`
- **Access**: Can view and claim tasks in assigned projects

## Setup Instructions

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd C:\Users\beula\Documents\Kreactive-backend-main
   ```

2. **Install dependencies** (if not already installed):
   ```bash
   npm install
   # or
   bun install
   ```

3. **Set up environment variables**:
   - Ensure your `.env` file has the MongoDB connection string and other required variables

4. **Run the seed script to create credentials**:
   ```bash
   npm run seed:credentials
   # or
   tsx scripts/seed-credentials.ts
   ```

5. **Start the backend server**:
   ```bash
   npm run dev
   # or
   bun run dev
   ```

### Frontend Setup (Super Admin Dashboard)

1. **Navigate to superadmin frontend directory**:
   ```bash
   cd C:\Users\beula\Documents\Kreative-superadmin-frontend
   ```

2. **Install dependencies** (if not already installed):
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Access the application**:
   - Open your browser and navigate to `http://localhost:3000` (or the port specified)
   - Login with Super Admin credentials

## Features Implemented

### Super Admin Dashboard Features

1. **Project Management**
   - View all projects in the system
   - Create new projects (Audio Recording, Transcription, Review, Custom Workflow)
   - Filter projects by status and type
   - Search projects by name or description
   - Sort projects by name, type, status, or creation date
   - View assigned admins for each project

2. **Admin Assignment**
   - Assign Project Admins to projects
   - View which admins are assigned to each project
   - Remove admins from projects (via API)

3. **Project Types Supported**
   - Audio Recording Projects
   - Transcription Projects
   - Review Projects
   - Custom Workflow Projects (Future)

4. **Navigation**
   - Super Admin sidebar with Projects and Create Project links
   - Access to project-specific admin dashboards
   - Role-based access control

### Backend Features

1. **Project Model & Routes**
   - Full CRUD operations for projects
   - Project assignment to admins
   - User assignment to projects
   - Project filtering and search

2. **Authorization**
   - SUPER_ADMIN can access all ADMIN routes
   - Role-based access control middleware
   - Proper permission checks

3. **Database Models**
   - Project model with relationships to User model
   - Support for admins and users arrays
   - Project metadata and settings

## Testing the Implementation

### Test Super Admin Login

1. Navigate to the login page
2. Enter Super Admin credentials:
   - Email: `superadmin@kreactive.com`
   - Password: `SuperAdmin123!@#`
3. You should be redirected to `/super-admin` dashboard
4. You should see:
   - Projects table with all projects
   - Create Project button
   - Sidebar with Super Admin navigation

### Test Project Creation

1. Click "Create Project" button
2. Fill in project details:
   - Name: "Test Audio Recording Project"
   - Type: "Audio Recording"
   - Description: (optional)
3. Click "Create Project"
4. Project should appear in the projects table

### Test Admin Assignment

1. Click the three-dot menu on any project
2. Select "Assign Admin"
3. Choose an admin from the dropdown
4. Click "Assign Admin"
5. The admin should appear in the "Assigned Admins" column

### Test Project Selection

1. Click on any project row or "Open Dashboard"
2. You should be redirected to the project-specific admin dashboard
3. The dashboard should show project-specific tasks and management options

## API Endpoints

### Project Endpoints (Require ADMIN or SUPER_ADMIN role)

- `GET /api/v1/admin/projects` - Get all projects
- `POST /api/v1/admin/projects` - Create a new project
- `GET /api/v1/admin/projects/:projectId` - Get project by ID
- `PATCH /api/v1/admin/projects/:projectId` - Update project
- `DELETE /api/v1/admin/projects/:projectId` - Delete project
- `POST /api/v1/admin/projects/:projectId/admins` - Assign admin to project
- `DELETE /api/v1/admin/projects/:projectId/admins` - Remove admin from project
- `POST /api/v1/admin/projects/:projectId/users` - Add user to project
- `DELETE /api/v1/admin/projects/:projectId/users` - Remove user from project

## File Structure

### Backend Files Created/Modified

- `src/types/project.interface.ts` - Project type definitions
- `src/models/project.model.ts` - Project Mongoose model
- `src/services/project.service.ts` - Project business logic
- `src/controllers/project.controller.ts` - Project route handlers
- `src/routes/admin.route.ts` - Added project routes
- `scripts/seed-credentials.ts` - Updated with SUPER_ADMIN credentials
- `src/middleware/authorize.middleware.ts` - Already supports SUPER_ADMIN

### Frontend Files Created/Modified

- `app/(app)/super-admin/page.tsx` - Enhanced with admin assignment UI
- `app/(app)/super-admin/projects/create/page.tsx` - Project creation page
- `services/project.service.ts` - Project API service
- `stores/useProjectStore.ts` - Project state management
- `components/shared/app-sidebar.component.tsx` - Super Admin navigation
- `components/blocks/login.block.tsx` - Super Admin redirect logic

## Troubleshooting

### Issue: Cannot login as Super Admin
- **Solution**: Ensure the seed script has been run and the user exists in the database
- Check that the role is set to `SUPER_ADMIN` in the database

### Issue: Projects not loading
- **Solution**: Check backend API is running and accessible
- Verify API base URL in frontend configuration
- Check browser console for API errors

### Issue: Cannot assign admins
- **Solution**: Ensure there are ADMIN users in the database
- Check that the admin assignment API endpoint is working
- Verify user permissions

### Issue: Redirect not working after login
- **Solution**: Check localStorage for user data
- Verify the role field in the user object
- Check browser console for errors

## Next Steps

1. **Test all features** with the provided credentials
2. **Create additional projects** to test filtering and sorting
3. **Assign multiple admins** to projects
4. **Test project-specific dashboards** by clicking on projects
5. **Verify connectivity** between superadmin, admin, and freelancer dashboards

## Security Notes

⚠️ **IMPORTANT**: 
- These are default credentials for development/testing
- Change passwords in production
- Implement additional security measures:
  - Two-factor authentication for Super Admin
  - Audit logging for Super Admin actions
  - IP whitelisting for Super Admin access
  - Rate limiting on authentication endpoints

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Check the backend server logs
3. Verify database connectivity
4. Ensure all environment variables are set correctly

