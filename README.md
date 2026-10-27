# FixMyCampus

**FixMyCampus** is a full-stack campus incident management and facilities maintenance software platform designed for universities and student hostels. Students report infrastructure faults (Wi-Fi outages, plumbing leaks, electrical hazards, broken classroom AV), campus maintenance technicians triage and repair them, and administrators oversee operations with real-time analytics.

---

## The Exactly Three Portals

The application is structured into **exactly three main user portals**:

1. **Student Portal** (`/student`, login at `/student/login`)
   - Public student registration (`/student/register`).
   - Report issues with title, description, category, building, room number, priority, and optional photo.
   - Intelligent duplicate detection alerts before submission.
   - Track live ticket statuses (`Open`, `In Progress`, `Resolved`, `Closed`).
   - View technician audit history and participate in issue discussion comments.
   - Confirm resolution to close tickets.

2. **Staff Portal** (`/staff`, login at `/staff/login`)
   - Accessible strictly through credentials established via **admin-issued invitations**. Public staff registration is strictly prohibited.
   - View assigned work orders.
   - Update issue status through valid state transitions (`Open` → `In Progress` → `Resolved`).
   - Record diagnosis notes, resolution notes, and post progress comments or internal staff notes.
   - Immediate session revocation if account is deactivated by an administrator.

3. **Admin Portal** (`/admin`, login at `/admin/login`)
   - Campus-wide facilities oversight and incident management.
   - Assign / reassign issues to registered active staff members.
   - Adjust issue priorities (Low, Medium, High).
   - Real-time MongoDB aggregated analytics (resolution times, category charts, location hotspots).
   - **Staff Management** (`/admin/staff`):
     - Onboard technicians with name, official email, department, and optional employee ID.
     - Automatically generates secure, single-use, 7-day cryptographically hashed invitation tokens.
     - View staff directory with assigned issue metrics and account status (`Active`, `Invitation Pending`, `Deactivated`).
     - Deactivate / reactivate accounts or resend / revoke invitations.

---

## Admin-Controlled Staff Invitation & Activation Workflow

Staff accounts can **never** be created through public registration. The secure onboarding process:

```
[ Admin Portal: Staff Management ]
       │
       ▼ Click "Add Staff Member"
[ Enters Name, Official Email, Department, Employee ID ]
       │
       ▼ Backend validates data & checks email uniqueness
[ Creates User with role: 'staff' and accountStatus: 'pending' ]
       │
       ▼ Generates 32-byte crypto random token (stores only SHA-256 hash in DB)
[ Single-Use Activation Link generated with 7-day expiration ]
       │
       ▼ Copy Link / Dispatch to Technician
[ Staff opens /activate-staff?token=... ]
       │
       ▼ Sets secure password (>= 6 chars)
[ Backend marks invitation as used, updates accountStatus: 'active' ]
       │
       ▼
[ Staff logs in at /staff/login ]
```

> **Security Note:** Unactivated staff members (`accountStatus: 'pending'`) and deactivated staff members (`accountStatus: 'deactivated'`) are blocked from logging in with HTTP 403. Deactivating an account immediately revokes access even for active JWT tokens.

---

## Default Credentials (Demo Accounts)

| Portal | Email | Password | Role / Department |
| :--- | :--- | :--- | :--- |
| **Admin Portal** | `admin@campus.edu` | `Password123!` | Admin (Facilities & Operations) |
| **Staff Portal** | `david.miller@campus.edu` | `Password123!` | Staff (Electrical Maintenance) |
| **Staff Portal** | `sarah.jenkins@campus.edu` | `Password123!` | Staff (IT & Network Infrastructure) |
| **Staff Portal** | `robert.chang@campus.edu` | `Password123!` | Staff (Plumbing & Sanitation) |
| **Student Portal** | `alex.rivera@student.edu` | `Password123!` | Student (Computer Science) |
| **Student Portal** | `emma.watson@student.edu` | `Password123!` | Student (Mechanical Engineering) |

---

## Local Setup & Execution Commands

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB Atlas connection string (or leave blank to use embedded zero-setup in-memory MongoDB)

### 1. Install Dependencies
```bash
# In server directory:
cd server
npm install

# In client directory:
cd ../client
npm install
cd ..
```

### 2. Configure Environment Variables

**Backend (`server/.env`):**
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=supersecret_fixmycampus_jwt_token_key_change_in_production
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173

# Optional: Cloudinary configuration for photo uploads
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

**Frontend (`client/.env`):**
```env
VITE_API_URL=/api
```

### 3. Run Automated Test Suites
```bash
# 1. Run 15 Security & Role scenarios (staff invitations, privilege isolation, deactivations):
npm run test:scenarios

# 2. Run 12-Step End-to-End integration audit:
npm run audit

# 3. Run 26 Backend Regression tests:
npm test
```

### 4. Start Development Servers
```bash
# Terminal 1: Backend API (http://localhost:5000)
npm run dev:server

# Terminal 2: Frontend SPA (http://localhost:5173)
npm run dev:client
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## API Reference

### Authentication
- `POST /api/auth/register` — Public student registration only.
- `POST /api/auth/login` — Authenticate user (blocks pending and deactivated accounts).
- `POST /api/auth/activate-staff` — Validates invitation token, sets password, activates staff account.
- `GET /api/auth/me` — Current authenticated user identity.
- `POST /api/auth/logout` — Invalidate user session.

### Admin Staff Management (Admin Only)
- `GET /api/admin/staff` — List staff members with assigned issue count and invitation status.
- `POST /api/admin/staff` — Create staff account and issue single-use invitation.
- `PATCH /api/admin/staff/:id/status` — Deactivate or reactivate a staff member.
- `POST /api/admin/staff/:id/resend-invitation` — Revoke previous invitation and issue new token safely.

### Issues & Workflows
- `GET /api/issues` — List issues (supports search, category, status, priority, building, pagination).
- `POST /api/issues` — Create issue with optional photo upload.
- `POST /api/issues/check-duplicates` — Check for potential duplicate tickets in same location.
- `GET /api/issues/:id` — View issue details, populated technician, and status history.
- `PATCH /api/issues/:id/status` — Update issue status (assigned staff / admin / student close).
- `PATCH /api/issues/:id/assign` — Assign issue to active staff member (Admin only).
- `PATCH /api/issues/:id/priority` — Adjust priority (Admin only).
- `GET /api/issues/:issueId/comments` — View issue discussion and technician notes.
- `POST /api/issues/:issueId/comments` — Add comment (supports internal staff notes).

### Analytics
- `GET /api/analytics` — Real-time live MongoDB aggregations for dashboard metrics (Admin only).
