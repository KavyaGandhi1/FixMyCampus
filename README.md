# FixMyCampus 🏫
### Campus Issue Reporting and Management System

FixMyCampus is a web-based platform designed to streamline the reporting, assignment, tracking, and resolution of campus maintenance issues. It connects students, administrators, and staff through a centralized system that improves transparency, accountability, and communication.

**Live Application:** [Insert your Vercel frontend URL]

**Backend API:** [Insert your Render backend URL]

**GitHub Repository:** [Insert your GitHub repository URL]

**Demo Video:** [Google Drive demo video link — to be added]

---

## 1. Problem Statement

Colleges and hostels frequently face maintenance issues such as malfunctioning classroom equipment, electrical problems, water leakage, Wi-Fi connectivity issues, and cleanliness concerns.

Traditional complaint management methods can make it difficult for students to report problems, track their progress, and determine whether they have been resolved. Administrators may also struggle to assign responsibilities, monitor staff performance, and maintain an organized record of complaints.

FixMyCampus addresses these challenges by providing a centralized digital platform for reporting, assigning, tracking, and managing campus maintenance issues.

## 2. Target Users

FixMyCampus is designed for three categories of users:

### Students
Students can report campus problems, track their submitted complaints, and monitor resolution progress.

### Administrators
Administrators can manage reported issues, register staff members, assign tasks, prioritize complaints, and monitor campus maintenance activity.

### Staff Members
Staff members can view their assigned issues, update their status, and communicate progress through comments.

## 3. Solution

FixMyCampus provides three dedicated portals: Student, Admin, and Staff.

Students can submit maintenance requests through a structured reporting form. Administrators can review incoming requests, assign them to registered staff members, and monitor their progress. Staff members can access their assigned tasks and update their status as work progresses.

The platform maintains issue records in a database, allowing users to retrieve relevant information and follow the progress of reported problems.

Staff registration is controlled by administrators, helping prevent unauthorized public creation of staff accounts.

By centralizing these workflows, FixMyCampus aims to make campus maintenance management more organized, transparent, and efficient.

## 4. Key Features

### Student Portal
- Student registration and login.
- Submit campus maintenance complaints.
- Provide issue descriptions and location details.
- View previously submitted complaints.
- Track issue status and resolution progress.
- Access relevant issue information.

### Admin Portal
- View and manage reported campus issues.
- Register staff members through the administrative interface.
- Manage staff account information.
- Assign issues to appropriate staff members.
- Set or manage issue priorities.
- Monitor issue progress.
- View maintenance statistics and analytics, where implemented.

### Staff Portal
- Secure staff login.
- Access assigned maintenance issues.
- View issue details.
- Update issue status.
- Add comments or progress updates, where implemented.
- Track assigned work.

### Security and Access Control
- Role-based access for students, administrators, and staff.
- Protected routes and authenticated API endpoints.
- Password hashing and secure authentication, according to the implemented authentication system.
- Restricted staff registration.
- Backend authorization to prevent unauthorized operations.

### Issue Tracking
- Centralized issue records.
- Status tracking, including Open, In Progress, and Resolved, where supported.
- Issue assignment and progress monitoring.
- Persistent database storage.

## 5. Technology Stack

| Component | Technology | Purpose |
|---|---|---|
| Frontend | React.js | Building the user interface |
| Frontend tooling | Vite | Development server and production build |
| Backend | Node.js | Server-side JavaScript runtime |
| API framework | Express.js | Handling API requests and application logic |
| Database | MongoDB | Storing users, issues, and related records |
| Database integration | Mongoose | Data models, validation, and database operations |
| Authentication | JWT and bcrypt, if implemented | Authentication and password security |
| Version control | Git | Tracking source code changes |
| Source hosting | GitHub | Hosting the project repository |
| Frontend deployment | Vercel | Hosting the frontend application |
| Backend deployment | Render | Hosting the backend API |

*Note: The table should reflect the technologies actually present in the final implementation. Remove any technology that your project does not use.*

## 6. Application Architecture

FixMyCampus follows a client-server architecture.

### Frontend
The React frontend provides the user interface for all three portals. It handles user interactions, forms, navigation, and the display of issue information.

### Backend
The Node.js and Express.js backend processes API requests, validates input, applies application rules, authenticates users, and enforces authorization.

### Database
MongoDB stores persistent application data, including user accounts, reported issues, assignments, and other supported records.

### Authentication and Authorization
The authentication system verifies user identity. Role-based authorization determines which operations each user can perform.

### Deployment Architecture

**Student / Admin / Staff → React Frontend (Vercel) → Express Backend API (Render) → MongoDB Database**

The frontend communicates with the backend through HTTP API requests. The backend interacts with MongoDB to create, retrieve, and update application records.

### Architecture Diagram

```text
                 FIXMYCAMPUS
                      |
          +-----------+-----------+
          |           |           |
       Student      Admin       Staff
        Portal      Portal      Portal
          |           |           |
          +-----------+-----------+
                      |
                React Frontend
                    Vercel
                      |
                   HTTP API
                      |
              Node.js + Express
                    Render
                      |
                    Mongoose
                      |
                  MongoDB
```

## 7. Local Setup

Follow these instructions to run the application locally.

### Prerequisites

Install the following tools:

- Node.js and npm.
- Git.
- MongoDB or a MongoDB Atlas database.
- A code editor such as Visual Studio Code.

### Step 1: Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd FixMyCampus
```

Replace the placeholder with your actual GitHub repository URL.

### Step 2: Install Dependencies

If the frontend and backend have separate directories, install their dependencies separately.

For the frontend:

```bash
cd client
npm install
```

For the backend, open another terminal:

```bash
cd server
npm install
```

Replace `client` and `server` with your actual directory names if your project uses a different structure.

### Step 3: Configure Environment Variables

Create the appropriate `.env` files for the frontend and backend.

Refer to the Environment Variables section below.

### Step 4: Start the Backend

From the backend directory, run:

```bash
npm run dev
```

If the backend does not define a `dev` script, use the start command specified in its `package.json`.

### Step 5: Start the Frontend

From the frontend directory, run:

```bash
npm run dev
```

Vite will display the local development URL in the terminal, commonly:

```text
http://localhost:5173
```

Open the displayed URL in your browser.

*The exact commands depend on the scripts defined in the project's package.json files.*

## 8. Environment Variables

The application may require environment variables to configure the database, authentication, and communication between the frontend and backend.

Use the following examples as a template. Confirm the actual variable names against your implementation before configuring them.

### Backend Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_random_secret
FRONTEND_URL=http://localhost:5173
```

If your application uses email invitations, add the email provider's required configuration variables.

### Frontend Environment Variables

If your frontend uses a configurable API base URL, create a `.env` file in the frontend directory:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Use the actual API URL expected by your frontend code.

### Security Guidelines

- Never commit `.env` files containing real credentials.
- Never expose database connection strings or JWT secrets in frontend code.
- Variables prefixed with `VITE_` are exposed to client-side code and must not contain secrets.
- Configure production environment variables through the appropriate deployment platform's dashboard.
- Use strong, unique secrets in production.
- Keep `.env.example` files limited to variable names and placeholder values.

## 9. Deployment

FixMyCampus uses separate deployment platforms for its frontend and backend.

### Frontend Deployment — Vercel

The React frontend is deployed on Vercel.

Deployment process:

1. Push the frontend source code to GitHub.
2. Import the repository into Vercel.
3. Configure the correct frontend root directory and build settings.
4. Add the production API base URL as an environment variable if required.
5. Deploy the application.
6. Test the deployed frontend in a browser.

**Frontend URL:** [Insert your live Vercel URL]

### Backend Deployment — Render

The Node.js and Express.js backend is deployed on Render.

Deployment process:

1. Connect the GitHub repository to Render.
2. Configure the backend root directory and build/start commands.
3. Add the required environment variables.
4. Configure the production MongoDB connection.
5. Configure CORS to allow requests from the deployed frontend.
6. Deploy the backend and verify that its API endpoints work.

**Backend URL:** [Insert your live Render URL]

### Database Configuration

The backend must connect to the configured MongoDB database using a server-side connection string.

Ensure that:
- The database connection string is valid.
- Database access permissions are configured appropriately.
- The database is reachable from the deployed backend.
- Production data persists across application restarts.
- Credentials are stored securely.

### Production Verification

After deployment, verify that:

- The frontend loads successfully.
- The backend responds to API requests.
- User authentication works.
- Students can submit and retrieve issues.
- Administrators can manage issues and staff.
- Staff members can access assigned issues.
- Database operations persist correctly.
- Unauthorized requests are rejected.

## 10. Demo Video

**Demo Video Link:** [https://drive.google.com/file/d/1ScQoyGk1XxhHLV3QojSu9WHWkAlotaQS/view?usp=drive_link]

A short demonstration video will showcase the working application and its primary workflows.

The planned demonstration includes:

1. Introduction to the campus maintenance problem.
2. Overview of the Student, Admin, and Staff portals.
3. Student registration, login, and issue reporting.
4. Admin staff registration and issue assignment.
5. Staff access and issue status updates.
6. Tracking issue progress through the application.
7. Overview of the deployed application.

The demonstration will focus on actual application functionality rather than reading source code.

## 11. Future Improvements

Potential future enhancements include:

- Email notifications when issue statuses change.
- Image uploads for visual evidence of maintenance problems.
- Automatic issue categorization and duplicate detection.
- Advanced analytics and staff performance reports.
- Real-time notifications for issue assignments.
- Improved mobile accessibility.
- Integration with institutional systems.

These are potential future enhancements and are not necessarily part of the current implementation.

## 12. Conclusion

FixMyCampus provides a centralized approach to campus maintenance management by connecting students, administrators, and staff through a structured issue reporting and tracking system.

By digitizing complaint submission, staff assignment, and progress monitoring, the application aims to improve accountability and make maintenance workflows easier to manage.

The project demonstrates the application of full-stack web development, database integration, authentication, role-based access control, API development, and cloud deployment in solving a practical campus problem.

---

**Project Name:** FixMyCampus

**Frontend:** React.js and Vite

**Backend:** Node.js and Express.js

**Database:** MongoDB

**Frontend Hosting:** Vercel

**Backend Hosting:** Render

**Repository:** []

**Live Application:** [https://fix-my-campus-4f33.vercel.app/]

**Demo Video:** [https://drive.google.com/file/d/1ScQoyGk1XxhHLV3QojSu9WHWkAlotaQS/view?usp=drive_link]
