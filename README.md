# HR Management System - Fixl Solutions Assignment

## Live Deployment
- Frontend URL: `https://fixl-solutions-assignment.vercel.app`
- Backend URL: `https://fixlsolutions-assignment.onrender.com`

## Project Overview
This project is an Employee Leave and Attendance Management System built for HR workflow automation. It helps organizations manage employee attendance, leave applications, approvals, and monthly reporting from a single platform.

The system supports multiple roles:
- Employees can sign up, log in, check in, check out, view their own attendance history, and apply for leave.
- Managers can review employee records, inspect leave requests, and monitor attendance data.
- Admins can manage users, adjust leave balances, review company-wide attendance, approve or reject leave requests, and generate reports.

Key features:
- Secure authentication and role-based authorization
- Attendance check-in and check-out tracking
- Leave application, editing, cancellation, approval, and rejection flows
- Monthly attendance summaries and admin reports
- User profile management
- Responsive frontend built for desktop and mobile screens

## Tech Stack & Justification
- Frontend: React + Vite
  React was chosen for component-based UI development and easy state-driven rendering. Vite was used for a faster local development experience and simple frontend deployment.
- Styling: Tailwind CSS + custom CSS
  Tailwind CSS helped build the UI quickly with reusable utility classes while still allowing custom visual styling where needed.
- Backend: Node.js + Express.js
  Express was chosen because it is lightweight, flexible, and well-suited for REST API development.
- Database: MongoDB + Mongoose
  MongoDB fits this project well because attendance and leave records are document-based and easy to model with Mongoose schemas.
- Authentication: JWT + HTTP-only cookies + bearer token fallback
  JWT provides stateless authentication, while cookies improve browser-based sessions. A bearer token fallback was also added for deployment reliability across domains.
- State Management: React Context API
  Context API is sufficient for managing authentication state without adding unnecessary complexity.

## Installation Steps
### 1. Clone the repository
```bash
git clone <repository_url>
cd FIxlSolutionsAssignment
```

### 2. Setup and run the backend
```bash
cd backend
npm install
```

Create a `.env` file inside `backend` and add the required backend environment variables.

Start the backend:
```bash
npm run dev
```

### 3. Setup and run the frontend
Open a new terminal:
```bash
cd frontend
npm install
```

Create a `.env` file inside `frontend` and add the required frontend environment variables.

Start the frontend:
```bash
npm run dev
```

### 4. Open the app
Frontend local URL:
```bash
http://localhost:5173
```

Backend local URL:
```bash
http://localhost:5000
```

## Environment Variables
### Backend `.env`
- `PORT`
  Port on which the backend server runs. Example: `5000`
- `MONGO_URI`
  MongoDB connection string for the application database.
- `JWT_SECRET`
  Secret key used to sign and verify JWT tokens.
- `JWT_EXPIRE`
  Token expiration duration. Example: `7d`
- `NODE_ENV`
  Application environment. Example: `development` or `production`
- `CORS_ORIGIN`
  Frontend URL allowed to access the backend. For multiple deployed origins, values can be comma-separated.

Example backend `.env`:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/hr-management
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### Frontend `.env`
- `VITE_API_BASE_URL`
  Base URL of the backend API. Example: `http://localhost:5000/api`

Example frontend `.env`:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## API Endpoints
### Auth Endpoints
| Method | Endpoint | Purpose | Access |
| :--- | :--- | :--- | :--- |
| POST | `/api/auth/register` | Register a new user | Public |
| POST | `/api/auth/login` | Log in user and return auth token/user info | Public |
| POST | `/api/auth/logout` | Log out current user | Authenticated |
| GET | `/api/auth/me` | Get current logged-in user profile | Authenticated |
| PUT | `/api/auth/me` | Update current user profile | Authenticated |
| PUT | `/api/auth/change-password` | Change current user password | Authenticated |

### User Endpoints
| Method | Endpoint | Purpose | Access |
| :--- | :--- | :--- | :--- |
| GET | `/api/users` | Get all users with admin/manager visibility | Admin, Manager |
| GET | `/api/users/:id` | Get one user by ID | Admin, Manager |
| PATCH | `/api/users/profile` | Update own profile fields | Authenticated |
| PUT | `/api/users/:id` | Update a user account, role, status, etc. | Admin |
| PATCH | `/api/users/:id/leave-balance` | Update leave balance of a user | Admin |

### Leave Endpoints
| Method | Endpoint | Purpose | Access |
| :--- | :--- | :--- | :--- |
| POST | `/api/leaves` | Apply for leave | Authenticated |
| GET | `/api/leaves/me` | Get logged-in user's leave history | Authenticated |
| PUT | `/api/leaves/:id` | Edit an existing leave request | Authenticated |
| PATCH | `/api/leaves/:id/cancel` | Cancel a leave request | Authenticated |
| GET | `/api/leaves` | Get all leave requests | Admin, Manager |
| PATCH | `/api/leaves/:id/action` | Approve or reject leave request | Admin, Manager |

### Attendance Endpoints
| Method | Endpoint | Purpose | Access |
| :--- | :--- | :--- | :--- |
| POST | `/api/attendance/check-in` | Mark daily check-in | Authenticated |
| PATCH | `/api/attendance/check-out` | Mark daily check-out | Authenticated |
| GET | `/api/attendance/me` | Get logged-in user's attendance history | Authenticated |
| GET | `/api/attendance/summary` | Get logged-in user's monthly summary | Authenticated |
| GET | `/api/attendance/report` | Get overall monthly attendance report | Admin |
| GET | `/api/attendance` | Get all attendance records | Admin, Manager |
| POST | `/api/attendance/admin-mark` | Admin manually marks attendance | Admin |

### Health Check
| Method | Endpoint | Purpose | Access |
| :--- | :--- | :--- | :--- |
| GET | `/api/health` | Backend health check endpoint | Public |

## Database Models
### 1. User
Purpose:
Stores employee, manager, and admin account details.

Important fields:
- `name`
- `email`
- `password`
- `role` with values `employee`, `manager`, `admin`
- `department`
- `phone`
- `avatar`
- `isActive`
- `manager` referencing `User`
- `leaveBalance.casual`
- `leaveBalance.sick`
- `leaveBalance.earned`
- `leaveBalance.unpaid`

Relationships:
- A user can be assigned another user as a manager.
- A user can have many leave records.
- A user can have many attendance records.

### 2. Leave
Purpose:
Stores leave requests submitted by employees.

Important fields:
- `employee` referencing `User`
- `leaveType`
- `startDate`
- `endDate`
- `totalDays`
- `isHalfDay`
- `halfDayPeriod`
- `reason`
- `status`
- `approvedBy` referencing `User`
- `approverRemarks`
- `appliedOn`
- `actionDate`

Relationships:
- Each leave belongs to one employee.
- A leave may be approved or rejected by an admin or manager user.

### 3. Attendance
Purpose:
Stores employee daily attendance data.

Important fields:
- `employee` referencing `User`
- `date`
- `checkIn.time`
- `checkIn.ip`
- `checkOut.time`
- `checkOut.ip`
- `status`
- `workHours`
- `overtime`
- `notes`
- `isLateArrival`
- `isEarlyDeparture`
- `markedBy`

Relationships:
- Each attendance record belongs to one employee.
- Each employee can have one attendance record per day.

## Admin Credentials
Seeded admin credentials:
- Email: `admin@gmail.com`
- Password: `Kunal@2006`

## AI Tools Declaration
AI tools used in this project:
- Google Gemini / Antigravity
  Used for assistance in UI ideas, boilerplate generation, and some backend structure suggestions.
- OpenAI Codex
  Used for debugging deployment issues, authentication fixes, and documentation improvements including README updates.

Human contribution:
- Project setup and implementation decisions
- Final integration of frontend and backend
- Manual testing and deployment
- Review and adjustment of generated code
- Business logic for leave management, including leave balance deduction only after approval
- Attendance constraints, including only one entry per day and no future marking
- Role-based access control for Admin and Employee permissions
- Database schema design and model relationships
- Error handling and validations

## Known Limitations
- Real-time updates are not implemented, so some data refreshes require revisiting pages or manual reload.
- Attendance auto-marking for absentees is not handled by a scheduled cron job.
- Cross-domain authentication during deployment can be sensitive to cookie and hosting configuration.
- No automated test suite has been added yet.
- Some manager/admin workflows depend on seeded or manually created data.

## Time Spent
Approximate time spent on the project: `14 to 16 hours`
