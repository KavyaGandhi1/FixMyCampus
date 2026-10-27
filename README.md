# FixMyCampus

**FixMyCampus** is a full-stack campus incident management and facilities maintenance software platform designed for universities and student hostels. Students report infrastructure faults (Wi-Fi outages, plumbing leaks, electrical hazards, broken projectors), campus maintenance technicians triage and repair them, and administrators oversee operations with real-time analytics.

---

## Architecture Overview

The system is architected as a decoupled client-server web application:

```
FixMyCampus/
├── client/                     # Frontend SPA (React 19 + Vite + Tailwind CSS)
│   ├── src/
│   │   ├── api/                # Axios API services (auth, issues, comments, analytics, users)
│   │   ├── components/         # Reusable UI components
│   │   │   ├── common/         # Navbar, Sidebar, Badges, Modals, Spinners, Empty states
│   │   │   ├── dashboard/      # Stat cards & Recharts visualization components
│   │   │   └── issues/         # Cards, Filter bar, Duplicate modal, Timeline, Comments
│   │   ├── context/            # React AuthContext (JWT session state & role helpers)
│   │   ├── layouts/            # MainLayout (with responsive sidebar) & AuthLayout
│   │   ├── pages/              # Role dashboards, Ticket list, Details, Report issue, 404
│   │   ├── routes/             # AppRoutes & role-based ProtectedRoute
│   │   ├── App.jsx             # Root provider shell
│   │   └── main.jsx            # Entry point
│   ├── package.json
│   ├── vite.config.js          # Dev server with /api proxy to backend
│   └── tailwind.config.js
├── server/                     # Backend REST API (Node.js + Express + Mongoose)
│   ├── src/
│   │   ├── config/             # DB connection (Atlas + embedded in-memory fallback)
│   │   ├── controllers/        # Auth, Issue, Comment, Analytics, User logic
│   │   ├── middleware/         # JWT protect, Role authorize, ObjectId validator, Error handler, Multer
│   │   ├── models/             # Mongoose schemas: User, Issue, Comment
│   │   ├── routes/             # Express route routers
│   │   ├── seeds/              # Database seeder with realistic test data & role credentials
│   │   ├── tests/              # 26 automated integration tests for critical workflows
│   │   ├── utils/              # Ticket ID generator & Status transition state machine
│   │   └── server.js           # Server bootstrap and lifecycle
│   ├── package.json
│   └── .env.example
├── README.md
└── .gitignore
```

---

## User Roles & Capabilities

| Role | Permissions & Capabilities |
| :--- | :--- |
| **Student** | • Register student account (public registration strictly assigns student role).<br>• Report maintenance issues with category, building, room, priority, and optional photo.<br>• Real-time duplicate detection warning before ticket creation.<br>• Search and filter own reported issues.<br>• View status timeline and technician updates.<br>• Add discussion comments to own tickets.<br>• Confirm resolution and close resolved tickets. |
| **Staff** | • Log in with technician credentials.<br>• View assigned work orders on technician dashboard.<br>• Transition issue status (`open` → `in_progress` → `resolved`).<br>• Record resolution notes and technical steps taken.<br>• Post public progress updates or private internal staff notes.<br>• Browse all campus facilities tickets in read-only directory. |
| **Admin** | • Full campus-wide visibility across all buildings, hostels, and departments.<br>• Assign / reassign tickets to specific maintenance staff members.<br>• Override issue priority (Low, Medium, High) and status.<br>• Real-time aggregated campus analytics computed from live database records.<br>• Browse staff directory and contact technicians. |

---

## Key Features

1. **Role-Enforced Authentication & Security**
   - JWT authentication stored securely with bearer token header injection.
   - Passwords hashed using bcrypt (10 salt rounds) and omitted from all queries (`select: false`).
   - Public registration strictly enforces `student` role to prevent privilege escalation.
   - Comprehensive error handling masking database internals in production.

2. **Automated Ticket ID & Audit History**
   - Auto-generated human-readable ticket IDs (e.g. `FMC-2026-IT001`).
   - Full timeline audit trail capturing every status transition, timestamp, user, and progress note.

3. **Intelligent Duplicate Detection**
   - Before submission, checks for unresolved tickets in the same building, room, and category.
   - Prompts the user with a modal linking to existing tickets without blocking valid submissions.

4. **Status Transition State Machine**
   - Enforces valid lifecycle steps (`open` → `in_progress` → `resolved` → `closed`).
   - Prevents unauthorized role transitions (e.g. students cannot resolve, staff only update assigned tickets).

5. **Live Database Analytics (No Mock Data)**
   - MongoDB Aggregations calculate total issues, status counts, unassigned issues, and average resolution time in hours.
   - Visualized with Recharts donut charts (category distribution) and bar charts (location hotspots).

---

## Default Credentials (Demo Accounts)

The database seed automatically configures realistic accounts. On the Login page (`/login`), click any demo button to log in with one click:

| Role | Email | Password | Department / Notes |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@campus.edu` | `Password123!` | Facilities & Operations |
| **Staff (IT)** | `sarah.jenkins@campus.edu` | `Password123!` | IT & Network Infrastructure |
| **Staff (Electrical)** | `david.miller@campus.edu` | `Password123!` | Electrical Maintenance |
| **Staff (Plumbing)** | `robert.chang@campus.edu` | `Password123!` | Plumbing & Sanitation |
| **Student** | `alex.rivera@student.edu` | `Password123!` | Computer Science |
| **Student** | `emma.watson@student.edu` | `Password123!` | Mechanical Engineering |

---

## Local Setup Instructions

### Prerequisites
- **Node.js**: v18.0.0 or higher (v24.x tested)
- **npm**: v9.0.0 or higher
- Optional: MongoDB Atlas connection string (if omitted, an embedded in-memory MongoDB starts automatically for seamless zero-setup local execution)

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd FixMyCampus

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
cd ..
```

### 2. Configure Environment Variables

**Backend (`server/.env`):**
```env
PORT=5000
NODE_ENV=development
# Paste your MongoDB Atlas URI, or leave blank to use embedded MongoDB
MONGODB_URI=
JWT_SECRET=supersecret_fixmycampus_jwt_token_key_change_in_production
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173

# Optional: Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

**Frontend (`client/.env`):**
```env
VITE_API_URL=/api
```

### 3. Seed Database & Run Integration Tests

```bash
# Run the 26 backend integration tests (tests auth, status transitions, duplicate checks, analytics)
cd server
npm test
```

### 4. Start Development Servers

Run both servers concurrently or in separate terminals:

```bash
# Terminal 1: Backend API (runs on http://localhost:5000)
cd server
npm run dev

# Terminal 2: Frontend SPA (runs on http://localhost:5173)
cd client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## API Reference

### Health Check
- `GET /api/health` — System status, uptime, and database connection state.

### Authentication
- `POST /api/auth/register` — Register student account (`name`, `email`, `password`, `department`, `phone`).
- `POST /api/auth/login` — Authenticate user and receive JWT (`email`, `password`).
- `GET /api/auth/me` — Get current logged-in user identity (Bearer Token required).
- `POST /api/auth/logout` — Invalidate user session.

### Issues
- `GET /api/issues` — List issues (supports `search`, `status`, `category`, `priority`, `building`, `page`, `limit`). Role-filtered.
- `POST /api/issues` — Create issue with multipart photo upload (`title`, `description`, `category`, `building`, `room`, `priority`, `image`).
- `POST /api/issues/check-duplicates` — Check for potential duplicate tickets in same building/category.
- `GET /api/issues/:id` — Get single issue with full status history and assigned staff.
- `PATCH /api/issues/:id/status` — Transition status (`status`, `note`).
- `PATCH /api/issues/:id/assign` — Assign issue to staff member (`staffId`, `note`) [Admin only].
- `PATCH /api/issues/:id/priority` — Adjust priority (`priority`) [Admin only].

### Comments
- `GET /api/issues/:issueId/comments` — Get discussions on authorized issue.
- `POST /api/issues/:issueId/comments` — Add comment (`content`, `isInternal`).

### Analytics & Users
- `GET /api/analytics` — Real-time MongoDB metrics and aggregations [Admin only].
- `GET /api/users/staff` — List active campus technicians for assignment [Admin & Staff].
- `GET /api/users` — List campus users [Admin only].

---

## Deployment Guide

### Database: MongoDB Atlas
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a database user and whitelist `0.0.0.0/0` in Network Access.
3. Copy the connection string: `mongodb+srv://<username>:<password>@cluster0.mongodb.net/fixmycampus?retryWrites=true&w=majority`.

### Backend: Render
1. Create a new **Web Service** on [Render](https://render.com) connected to your repository.
2. Root Directory: `server`
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `MONGODB_URI`: `<Your MongoDB Atlas Connection String>`
   - `JWT_SECRET`: `<Secure Random String>`
   - `CLIENT_URL`: `<Your Vercel Frontend URL>`

### Frontend: Vercel
1. Create a new project on [Vercel](https://vercel.com) connected to your repository.
2. Root Directory: `client`
3. Framework Preset: `Vite`
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Add Environment Variable:
   - `VITE_API_URL`: `<Your Render Backend URL, e.g. https://fixmycampus-api.onrender.com/api>`
