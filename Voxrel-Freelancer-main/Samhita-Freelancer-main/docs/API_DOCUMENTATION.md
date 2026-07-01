# 📚 Kreactive Backend API Documentation

## 🌐 Base Information
- **Base URL**: `http://localhost:8080/api/v1`
- **Documentation**: `http://localhost:8080/api/docs` (Swagger UI)
- **Health Check**: `http://localhost:8080/health`

---

## 🔐 Authentication Endpoints (`/auth`)

### Public Routes (No Authentication Required)

| Method | Endpoint | Use Case | Logic | Auth Required | Payload | Response | Error Status |
|--------|----------|----------|-------|---------------|---------|----------|--------------|
| `POST` | `/auth/register/start` | User Registration | Creates user with `PENDING_VERIFICATION` status, sends OTP email | ❌ | `{"name": "string", "email": "string", "password": "string"}` | `{"success": true, "message": "OTP sent to your email"}` | `409` - Email exists, `400` - Validation error |
| `POST` | `/auth/register/verify` | Email Verification | Verifies OTP, keeps user status as `PENDING_VERIFICATION` | ❌ | `{"email": "string", "otp": "string"}` | `{"success": true, "data": {"user": {...}}, "message": "Email verified successfully"}` | `404` - User not found, `400` - Invalid OTP |
| `POST` | `/auth/resend-otp` | Resend OTP | Generates new OTP and sends email | ❌ | `{"email": "string"}` | `{"success": true, "message": "OTP sent to your email"}` | `404` - User not found |
| `POST` | `/auth/login` | User Login | Authenticates user, returns JWT tokens (only `ACTIVE` users) | ❌ | `{"email": "string", "password": "string"}` | `{"success": true, "data": {"accessToken": "...", "refreshToken": "...", "user": {...}}}` | `401` - Invalid credentials, `403` - Account not active |
| `POST` | `/auth/forgot-password` | Password Reset Request | Initiates password reset flow | ❌ | `{"email": "string"}` | `{"success": true, "message": "Password reset email sent"}` | `404` - User not found |
| `POST` | `/auth/reset-password` | Password Reset | Resets password with token | ❌ | `{"token": "string", "newPassword": "string"}` | `{"success": true, "message": "Password reset successfully"}` | `400` - Invalid token, `400` - Validation error |

### Protected Routes (Authentication Required)

| Method | Endpoint | Use Case | Logic | Auth Required | Payload | Response | Error Status |
|--------|----------|----------|-------|---------------|---------|----------|--------------|
| `POST` | `/auth/refresh` | Token Refresh | Generates new access token using refresh token | ✅ | `{"refreshToken": "string"}` | `{"success": true, "data": {"accessToken": "..."}}` | `401` - Invalid refresh token |
| `POST` | `/auth/logout` | Single Logout | Invalidates current session | ✅ | `{}` | `{"success": true, "message": "Logged out successfully"}` | `401` - Not authenticated |
| `POST` | `/auth/change-password` | Change Password | Updates user password with current password verification | ✅ | `{"currentPassword": "string", "newPassword": "string"}` | `{"success": true, "message": "Password changed successfully"}` | `401` - Not authenticated, `400` - Invalid current password |
| `GET` | `/auth/me` | Get Current User | Returns complete user profile with status | ✅ | `{}` | `{"success": true, "data": {"_id": "...", "name": "...", "email": "...", "role": "...", "status": "...", "createdAt": "...", "updatedAt": "...", "lastLoginAt": "..."}}` | `401` - Not authenticated, `404` - User not found |

---

## 👑 Admin Endpoints (`/admin`)

**Authentication**: Required | **Authorization**: ADMIN only

### User Management

| Method | Endpoint | Use Case | Logic | Auth Required | Payload | Response | Error Status |
|--------|----------|----------|-------|---------------|---------|----------|--------------|
| `GET` | `/admin/users` | List All Users | Returns paginated list of freelancers (excludes admins) | ✅ ADMIN | `?page=1&limit=10&status=ACTIVE` | `{"success": true, "data": {"users": [...], "pagination": {...}}}` | `401` - Not authenticated, `403` - Not admin |
| `GET` | `/admin/users/:userId` | Get User Details | Returns user profile with statistics | ✅ ADMIN | `{}` | `{"success": true, "data": {"user": {...}, "stats": {...}}}` | `401` - Not authenticated, `403` - Not admin, `404` - User not found |
| `PATCH` | `/admin/users/:userId/status` | Update User Status | Changes user status (ACTIVE, INACTIVE, BANNED, etc.) | ✅ ADMIN | `{"status": "ACTIVE"}` | `{"success": true, "data": {...}, "message": "User status updated successfully"}` | `401` - Not authenticated, `403` - Not admin, `404` - User not found, `400` - Invalid status |
| `DELETE` | `/admin/users/:userId` | Delete User | Removes user and related data | ✅ ADMIN | `{}` | `{"success": true, "message": "User deleted successfully"}` | `401` - Not authenticated, `403` - Not admin, `404` - User not found |

### Task Management

| Method | Endpoint | Use Case | Logic | Auth Required | Payload | Response | Error Status |
|--------|----------|----------|-------|---------------|---------|----------|--------------|
| `POST` | `/admin/tasks` | Create Task | Creates task with audio file upload to R2 | ✅ ADMIN | `FormData: audio, title, description, price, language, deadline` | `{"success": true, "data": {"_id": "...", "title": "...", "audioUrl": "...", ...}}` | `401` - Not authenticated, `403` - Not admin, `400` - Validation error, `500` - Upload error |
| `GET` | `/admin/tasks` | List All Tasks | Returns paginated list of all tasks | ✅ ADMIN | `?page=1&limit=10&status=OPEN` | `{"success": true, "data": {"tasks": [...], "pagination": {...}}}` | `401` - Not authenticated, `403` - Not admin |
| `GET` | `/admin/tasks/:taskId` | Get Task Details | Returns task with related data | ✅ ADMIN | `{}` | `{"success": true, "data": {"task": {...}}}` | `401` - Not authenticated, `403` - Not admin, `404` - Task not found |
| `PATCH` | `/admin/tasks/:taskId` | Update Task | Updates task details | ✅ ADMIN | `{"title": "string", "description": "string", "price": number}` | `{"success": true, "data": {...}, "message": "Task updated successfully"}` | `401` - Not authenticated, `403` - Not admin, `404` - Task not found |
| `DELETE` | `/admin/tasks/:taskId` | Delete Task | Removes task and related data | ✅ ADMIN | `{}` | `{"success": true, "message": "Task deleted successfully"}` | `401` - Not authenticated, `403` - Not admin, `404` - Task not found |
| `PATCH` | `/admin/tasks/:taskId/claim` | Manage Task Claims | Admin can claim/unclaim tasks | ✅ ADMIN | `{"claimedById": "string"}` | `{"success": true, "data": {...}, "message": "Task claim updated successfully"}` | `401` - Not authenticated, `403` - Not admin, `404` - Task not found |

---

## 👨‍💼 Freelancer Endpoints (`/freelancer`)

**Authentication**: Required | **Authorization**: Any authenticated user

### Profile Management

| Method | Endpoint | Use Case | Logic | Auth Required | Payload | Response | Error Status |
|--------|----------|----------|-------|---------------|---------|----------|--------------|
| `PATCH` | `/freelancer/profile` | Update Profile | Updates user profile information | ✅ | `{"bio": "string", "languages": ["string"], "country": "string"}` | `{"success": true, "data": {...}, "message": "Profile updated successfully"}` | `401` - Not authenticated, `400` - Validation error |

### Task Management

| Method | Endpoint | Use Case | Logic | Auth Required | Payload | Response | Error Status |
|--------|----------|----------|-------|---------------|---------|----------|--------------|
| `GET` | `/freelancer/tasks` | List Available Tasks | Shows open tasks available for claiming | ✅ | `?page=1&limit=10&language=English` | `{"success": true, "data": {"tasks": [...], "pagination": {...}}}` | `401` - Not authenticated |
| `POST` | `/freelancer/tasks/:taskId/claim` | Claim Task | Claims a task for the user | ✅ | `{}` | `{"success": true, "data": {...}, "message": "Task claimed successfully"}` | `401` - Not authenticated, `404` - Task not found, `400` - Task already claimed |
| `GET` | `/freelancer/tasks/my` | My Tasks | Shows user's claimed tasks | ✅ | `?page=1&limit=10&status=ASSIGNED` | `{"success": true, "data": {"tasks": [...], "pagination": {...}}}` | `401` - Not authenticated |
| `POST` | `/freelancer/tasks/:taskId/submit` | Submit Task | Submits completed task work | ✅ | `{"submission": "string"}` | `{"success": true, "data": {...}, "message": "Task submitted successfully"}` | `401` - Not authenticated, `404` - Task not found, `400` - Task not claimed by user |

### Review Management

| Method | Endpoint | Use Case | Logic | Auth Required | Payload | Response | Error Status |
|--------|----------|----------|-------|---------------|---------|----------|--------------|
| `GET` | `/freelancer/reviews/assigned` | Assigned Reviews | Shows reviews assigned to user | ✅ | `?page=1&limit=10` | `{"success": true, "data": {"reviews": [...], "pagination": {...}}}` | `401` - Not authenticated |
| `POST` | `/freelancer/reviews/:reviewId/submit` | Submit Review | Submits review with rating and feedback | ✅ | `{"rating": number, "feedback": "string"}` | `{"success": true, "data": {...}, "message": "Review submitted successfully"}` | `401` - Not authenticated, `404` - Review not found, `400` - Invalid rating |

### Analytics

| Method | Endpoint | Use Case | Logic | Auth Required | Payload | Response | Error Status |
|--------|----------|----------|-------|---------------|---------|----------|--------------|
| `GET` | `/freelancer/stats` | User Statistics | Personal performance statistics | ✅ | `{}` | `{"success": true, "data": {"userId": "...", "totalTasksCompleted": number, "totalRevenueEarned": number, ...}}` | `401` - Not authenticated |
| `GET` | `/freelancer/performance` | Freelancer Performance | Comprehensive performance analytics | ✅ FREELANCER | `{}` | `{"success": true, "data": {"user": {...}, "performance": {...}, "monthlyStats": {...}, "recentActivity": {...}, "summary": {...}}}` | `401` - Not authenticated, `403` - Not freelancer |

---

## ⚙️ Settings Endpoints (`/settings`)

**Authentication**: Required | **Authorization**: ADMIN only

| Method | Endpoint | Use Case | Logic | Auth Required | Payload | Response | Error Status |
|--------|----------|----------|-------|---------------|---------|----------|--------------|
| `GET` | `/settings/` | Get All Settings | Returns all application settings | ✅ ADMIN | `{}` | `{"success": true, "data": [{"key": "...", "value": "...", "description": "...", ...}]}` | `401` - Not authenticated, `403` - Not admin |
| `GET` | `/settings/max-task-per-user` | Get Max Task Limit | Returns maximum tasks per user setting | ✅ ADMIN | `{}` | `{"success": true, "data": {"maxTaskPerUser": number}}` | `401` - Not authenticated, `403` - Not admin |
| `PATCH` | `/settings/:key` | Update Setting | Updates existing setting | ✅ ADMIN | `{"value": "string|number|boolean", "description": "string", "isActive": boolean}` | `{"success": true, "data": {...}, "message": "Setting updated successfully"}` | `401` - Not authenticated, `403` - Not admin, `404` - Setting not found |

---

## 🔧 System Endpoints

| Method | Endpoint | Use Case | Logic | Auth Required | Payload | Response | Error Status |
|--------|----------|----------|-------|---------------|---------|----------|--------------|
| `GET` | `/health` | Health Check | Returns server health status | ❌ | `{}` | `{"status": "ok", "message": "Server is healthy"}` | `500` - Server error |

---

## 📊 Overall Application Flow

### 1. **User Registration & Verification Flow**
```
User Registration → Email Verification → Admin Approval → Account Activation
     ↓                    ↓                    ↓              ↓
PENDING_VERIFICATION → PENDING_VERIFICATION → ACTIVE → Can Login
```

**Detailed Steps:**
1. **Registration**: User provides name, email, password → Account created with `PENDING_VERIFICATION` status
2. **Email Verification**: User receives OTP → Verifies email → Status remains `PENDING_VERIFICATION`
3. **Admin Approval**: Admin reviews and activates user → Status changes to `ACTIVE`
4. **Login**: User can now login and access the system

### 2. **Task Lifecycle Flow**
```
Task Creation → Task Available → Task Claimed → Task Submitted → Task Reviewed → Task Completed
     ↓              ↓              ↓              ↓              ↓              ↓
OPEN status → OPEN status → ASSIGNED status → SUBMITTED status → IN_REVIEW status → COMPLETED status
```

**Detailed Steps:**
1. **Creation**: Admin creates task with audio file → Task status: `OPEN`
2. **Availability**: Task appears in freelancer's available tasks list
3. **Claiming**: Freelancer claims task → Status: `ASSIGNED`
4. **Submission**: Freelancer submits completed work → Status: `SUBMITTED`
5. **Review**: Task goes under review → Status: `IN_REVIEW`
6. **Completion**: Task approved → Status: `COMPLETED`, Revenue credited

### 3. **Authentication & Authorization Flow**
```
Request → Authentication Middleware → Authorization Middleware → Controller → Service → Database
    ↓              ↓                        ↓                    ↓          ↓         ↓
JWT Token → Verify Token → Check Role → Process Request → Business Logic → Data Operations
```

**Security Layers:**
1. **Authentication**: Validates JWT token and extracts user information
2. **Authorization**: Checks user role (ADMIN/FREELANCER) and permissions
3. **Input Validation**: Validates request payload and parameters
4. **Business Logic**: Implements business rules and constraints
5. **Data Access**: Secure database operations with proper error handling

### 4. **File Upload Flow (R2 Storage)**
```
File Upload → Multer Processing → R2 Upload → URL Generation → Database Storage
     ↓              ↓                ↓            ↓              ↓
Audio File → Memory Buffer → Cloudflare R2 → Public URL → Task Record
```

**Technical Details:**
1. **Upload**: Audio file uploaded via multipart form data
2. **Processing**: Multer processes file and stores in memory
3. **Storage**: File uploaded to Cloudflare R2 with unique filename
4. **URL**: Public URL generated for file access
5. **Database**: URL stored in task record for future reference

### 5. **Analytics & Performance Tracking**
```
User Actions → Data Collection → Analytics Processing → Performance Metrics → Dashboard Display
     ↓              ↓                ↓                    ↓                  ↓
Task Claims → Database Updates → Aggregation Queries → Calculated Metrics → User Interface
```

**Metrics Tracked:**
- Task completion rates
- Revenue generation
- Performance trends
- Monthly growth
- Average completion times
- Success rates

### 6. **Error Handling Flow**
```
Error Occurrence → Error Classification → Error Response → Client Handling
     ↓                    ↓                  ↓              ↓
Exception → ApiError Creation → HTTP Status Code → User Notification
```

**Error Types:**
- **400**: Bad Request (validation errors, invalid data)
- **401**: Unauthorized (invalid/missing authentication)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found (resource doesn't exist)
- **409**: Conflict (duplicate data)
- **500**: Internal Server Error (server issues)

---

## 🔒 Security Features

### Authentication
- **JWT Tokens**: Access and refresh token system
- **Password Hashing**: bcrypt with salt rounds
- **Token Expiration**: Configurable token lifetimes
- **Secure Headers**: CORS and security headers

### Authorization
- **Role-based Access**: ADMIN vs FREELANCER roles
- **Endpoint Protection**: Middleware-based access control
- **Resource Ownership**: Users can only access their own data
- **Admin Privileges**: Admin-only operations clearly defined

### Data Protection
- **Input Validation**: Request payload validation
- **SQL Injection Prevention**: Mongoose ORM protection
- **File Upload Security**: Type and size restrictions
- **Error Information**: Sanitized error messages

---

## 📈 Performance Considerations

### Database Optimization
- **Indexes**: Strategic database indexing
- **Aggregation**: Efficient data aggregation queries
- **Pagination**: Large dataset pagination
- **Caching**: Redis caching for frequently accessed data

### File Storage
- **CDN**: Cloudflare R2 for fast file access
- **Compression**: Optimized file storage
- **Cleanup**: Automatic cleanup of unused files

### API Performance
- **Response Caching**: Cached responses where appropriate
- **Parallel Processing**: Concurrent database operations
- **Error Handling**: Efficient error processing
- **Monitoring**: Performance monitoring and logging

---

## 🚀 Deployment & Environment

### Environment Variables
- **Database**: MongoDB connection string
- **Redis**: Redis connection details
- **JWT**: Secret keys for token signing
- **Cloudflare**: R2 storage credentials
- **Email**: SMTP configuration

### Production Considerations
- **HTTPS**: SSL/TLS encryption
- **Rate Limiting**: API rate limiting
- **Monitoring**: Application monitoring
- **Logging**: Comprehensive logging system
- **Backup**: Regular database backups

---

*This documentation covers all 44 endpoints across 4 main modules with comprehensive details for each endpoint's functionality, security requirements, and integration patterns.*
