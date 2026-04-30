# 🚀 TeamFlow — Team Task Manager

A full-stack project & task management web app with role-based access control, built with **React + FastAPI + SQLite**.

## ✨ Features

| Feature | Details |
|---|---|
| 🔐 Authentication | JWT-based signup/login, secure bcrypt passwords |
| 📁 Projects | Create, edit, delete projects with color themes |
| 👥 Team Management | Add/remove members per project, admin role management |
| ✅ Task Tracking | Create tasks, assign to members, set priority & due dates |
| 📊 Kanban Board | Drag-status tasks across To Do → In Progress → In Review → Done |
| ⚡ Dashboard | Live stats: total tasks, overdue, completion rate per project |
| 🛡️ Role-Based Access | Admin (full control) vs Member (project-scoped access) |
| 📱 Responsive | Works on desktop and mobile |

---

## 🏗️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router v6, Axios, date-fns
- **Backend**: FastAPI (Python 3.11), SQLAlchemy ORM, SQLite, JWT (python-jose), bcrypt
- **Deployment**: Docker + Railway

---

## 📁 Project Structure

```
team-task-manager/
├── backend/
│   ├── main.py               # FastAPI app entry
│   ├── models.py             # SQLAlchemy models (User, Project, Task)
│   ├── schemas.py            # Pydantic request/response schemas
│   ├── database.py           # DB engine & session
│   ├── requirements.txt
│   ├── railway.toml
│   ├── core/
│   │   ├── auth.py           # JWT & password utilities
│   │   └── config.py        # Settings (env vars)
│   └── routers/
│       ├── auth.py           # POST /signup, /login, GET /me
│       ├── users.py          # User management
│       ├── projects.py       # Project CRUD + members
│       └── tasks.py          # Task CRUD + dashboard stats
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Routes
│   │   ├── main.jsx          # Entry point
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── services/
│   │   │   └── api.js        # Axios client + all API calls
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Projects.jsx
│   │   │   ├── ProjectDetail.jsx  # Kanban board
│   │   │   ├── Tasks.jsx
│   │   │   ├── Team.jsx
│   │   │   └── Profile.jsx
│   │   └── components/
│   │       ├── Layout.jsx    # Sidebar + nav
│   │       ├── TaskCard.jsx  # Kanban card
│   │       ├── TaskModal.jsx # Create/edit task
│   │       └── ProjectModal.jsx
│   └── package.json
├── Dockerfile                # Full-stack build
├── railway.toml              # Railway deployment
└── README.md
```

---

## ⚙️ Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy env file
cp .env.example .env

# Start the server
uvicorn main:app --reload --port 8000
```

API docs available at: http://localhost:8000/api/docs

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server (proxies /api to localhost:8000)
npm run dev
```

App available at: http://localhost:5173

---

## 🌐 Deployment on Railway

### Option A: Docker (Recommended — Full Stack in one service)

1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select your repo — Railway auto-detects the `Dockerfile`
4. Add environment variables:
   ```
   SECRET_KEY=your-very-long-random-secret-key-here
   DATABASE_URL=sqlite:///./taskmanager.db
   ```
5. Deploy → copy the generated URL

### Option B: Backend-only (frontend hosted separately)

```bash
cd backend
# Set env vars in Railway dashboard, then deploy
```

Set these Railway env vars:
| Variable | Value |
|---|---|
| `SECRET_KEY` | Random 32+ char string |
| `DATABASE_URL` | `sqlite:///./taskmanager.db` |
| `PORT` | Set automatically by Railway |

---

## 🔑 API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | — | Register new user |
| POST | `/api/auth/login` | — | Login, get JWT token |
| GET | `/api/auth/me` | ✅ | Get current user |
| GET | `/api/projects/` | ✅ | List accessible projects |
| POST | `/api/projects/` | ✅ | Create project |
| PATCH | `/api/projects/{id}` | Owner/Admin | Update project |
| DELETE | `/api/projects/{id}` | Owner/Admin | Delete project |
| POST | `/api/projects/{id}/members` | Owner/Admin | Add member |
| DELETE | `/api/projects/{id}/members/{uid}` | Owner/Admin | Remove member |
| GET | `/api/tasks/` | ✅ | List tasks (filterable) |
| GET | `/api/tasks/my-tasks` | ✅ | Current user's tasks |
| GET | `/api/tasks/dashboard` | ✅ | Dashboard statistics |
| POST | `/api/tasks/{project_id}` | Member | Create task |
| PATCH | `/api/tasks/{id}` | Member | Update task |
| DELETE | `/api/tasks/{id}` | Creator/Owner/Admin | Delete task |
| GET | `/api/users/` | ✅ | List all users |
| PATCH | `/api/users/me` | ✅ | Update own profile |
| PATCH | `/api/users/{id}/role` | Admin | Change user role |

---

## 🛡️ Role-Based Access Control

| Action | Member | Admin |
|---|---|---|
| View own projects & tasks | ✅ | ✅ |
| Create projects | ✅ | ✅ |
| Edit/delete own projects | ✅ | ✅ |
| Edit/delete any project | ❌ | ✅ |
| Add/remove project members | Owner only | ✅ |
| Create tasks in project | Member of project | ✅ |
| Change user roles | ❌ | ✅ |
| View all projects/tasks | ❌ | ✅ |

---

## 📦 Submission Checklist

- [x] Live URL (Railway deployment)
- [x] GitHub repo with full source
- [x] README with setup & deployment instructions
- [ ] 2–5 min demo video (record after deployment)

---

## 📝 Notes

- SQLite is used for simplicity and Railway compatibility. For production scale, replace with PostgreSQL by changing `DATABASE_URL` to a Postgres connection string — SQLAlchemy handles the rest automatically.
- JWT tokens expire after 24 hours by default (configurable via `ACCESS_TOKEN_EXPIRE_MINUTES`).
- The first admin must self-select "Admin" role at signup. Subsequent role changes are done by admins via the Team page.
