# 🚀 HR Management System (Fixl Solutions Assignment)

This is a production-grade **Employee Leave & Attendance Management System**, built to streamline HR workflows. It features a modern "Glassmorphism" UI, role-based access control, and advanced reporting capabilities.

---

## 📖 Project Overview
The system is designed for two primary user roles:
*   **Employees**: Can mark daily attendance (Check-in/Out), track their attendance history, and apply for leaves while monitoring their balance.
*   **Admins**: Can manage all employee data, approve/reject leave requests, monitor real-time company-wide attendance, and generate detailed monthly reports.

### Key Features:
*   **Mobile Responsive**: Fully optimized for smartphones, tablets, and desktops using a slide-over navigation system.
*   **Comprehensive Dashboard**: Visual indicators for leave balances (Casual, Sick, Earned) and attendance summaries.
*   **Monthly Reports**: Capability to generate and export monthly attendance reports as **CSV** files.
*   **Pagination & Filters**: Server-side pagination and advanced search/filtering across all large datasets.
*   **Secure Authentication**: JWT-based authentication with password visibility toggles and intelligent session persistence.

---

## 🛠️ Tech Stack & Justification

*   **Frontend**: React + Vite
    *   *Justification:* Vite provides a superior development experience with near-instant HMR, coupled with React's robust component-based architecture.
*   **Styling**: Vanilla CSS + Tailwind CSS
    *   *Justification:* Tailwind was chosen for its utility-first approach which allowed for the creation of a deeply custom "Glassmorphism" design system without writing massive CSS files.
*   **Backend**: Node.js + Express
    *   *Justification:* Scalable and efficient for handling RESTful API requests. Its non-blocking I/O is ideal for a multi-user HR tool.
*   **Database**: MongoDB (Mongoose)
    *   *Justification:* The document-based schema perfectly suits the flexible nature of "Leave Logs" and "Attendance Histories."
*   **State Management**: React Context API
    *   *Justification:* Used for global Authentication state (`AuthContext`) to ensure secure and consistent access control across the app.

---

## ⚙️ Installation Steps

1.  **Clone the Repository**:
    ```bash
    git clone <repository_url>
    cd FIxlSolutionsAssignment
    ```

2.  **Backend Setup**:
    ```bash
    cd backend
    npm install
    # Create .env file based on settings below
    npm run dev
    ```

3.  **Frontend Setup**:
    ```bash
    cd ../frontend
    npm install
    # Create .env file based on settings below
    npm run dev
    ```

---

## 🔑 Environment Variables

### Backend (.env)
*   `PORT`: The port your server runs on (e.g., `5000`).
*   `MONGO_URI`: Your MongoDB connection string.
*   `JWT_SECRET`: A secure string for encrypting user tokens.
*   `NODE_ENV`: Set to `development` or `production`.
*   `CORS_ORIGIN`: Set to the frontend URL (e.g., `http://localhost:5173`).

### Frontend (.env)
*   `VITE_API_BASE_URL`: The URL of your backend API (e.g., `http://localhost:5000/api`).

---

## 🔗 API Endpoints

| Category | Method | Endpoint | Purpose | Access |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | POST | `/api/auth/register` | Register new user | Public |
| **Auth** | POST | `/api/auth/login` | Authenticate & get token | Public |
| **User** | GET | `/api/users` | List all employees (Paginated) | Admin |
| **Attendance** | POST | `/api/attendance/check-in` | Mark daily check-in | Employee |
| **Attendance** | PATCH | `/api/attendance/check-out` | Mark daily check-out | Employee |
| **Reports** | GET | `/api/attendance/report` | Global Monthly Report (CSV) | Admin |
| **Leaves** | POST | `/api/leaves` | Apply for a leave request | Employee |
| **Leaves** | PATCH | `/api/leaves/:id/action`| Approve/Reject request | Admin |

---

## 🗄️ Database Models

1.  **User Model**: Stores identification, role, department, and crucial **Leave Balances** (initialized at 20 total days: 5 Casual, 7 Sick, 8 Earned).
2.  **Attendance Model**: Tracks daily sessions with `checkIn`, `checkOut`, and calculated `workHours`. Status is automatically set to `present` or `half_day`.
3.  **Leave Model**: Tracks requests from application to approval. Includes logic for auto-calculating `totalDays` requested.

---

## 🔐 Admin Credentials
Currently, the system is designed to allow new signups to choose their roles for testing purposes.
*   **To create an admin**: Simply go to `/signup` and ensure the `role: "admin"` flag is set (manually via DB or as specified in the testing instructions).
*   **Default Admin (if seeded)**: `admin@example.com` / `password123`

---

## 🤖 AI Tools Declaration
This project was developed with assistance from **Antigravity (Powered by Google Gemini)**.
*   **AI Contribution**: Implementation of the "Glassmorphism" UI tokens, boilerplate for REST controller logic, and complex aggregation queries for the Monthly Reporting system.
*   **Human Contribution**: System architecture design, specific business logic for leave deductions, security middleware configuration, and final manual verification of logic.

---

## ⏳ Known Limitations & Time Spent
*   **Limitations**: No real-time WebSockets; status updates require a page refresh or dashboard visit.
*   **Automated Marking**: The system does not currently run a nightly cron-job to mark users as "Absent" if they fail to check in.
*   **Time Spent**: Approximately **14-16 hours** (Scaffolding, Backend logic, Frontend UI overhaul, Reporting implementation, and Documentation).

---
