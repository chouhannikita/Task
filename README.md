# Taskly

A simple task manager with a React frontend and Node.js / Express backend managed together in one Git repository using npm workspaces. MongoDB persists tasks through Mongoose.

## Features

- Create, edit, complete, reopen, and delete tasks.
- Add descriptions, priorities, and optional due dates.
- Search tasks and filter by status or tasks due today.
- Sort by newest, due date, or priority.
- Responsive layout, progress summary, accessible dialogs, and clear loading/error states.

## Requirements

Node.js 20.19+ or 22.12+ and a running MongoDB instance (local MongoDB or MongoDB Atlas).

## Run locally

Start MongoDB locally, or provide an Atlas connection string in `backend/.env`.

From the repo root:

```bash
cp backend/.env.example backend/.env
npm install
npm run dev
```

This runs both the backend and frontend together in one terminal. Open the URL Vite prints (normally http://localhost:5173). The frontend proxies `/api` to http://localhost:5000. If you change the backend port, update `frontend/vite.config.js` or set `VITE_API_URL` in `frontend/.env`. Set `CLIENT_ORIGIN` in `backend/.env` to the frontend's origin if using a direct API connection.

If you want to run them separately:

```bash
npm run dev:backend
npm run dev:frontend
```

A local MongoDB can also be started with Docker:

```bash
docker run --name taskly-mongo -p 27017:27017 -v taskly-data:/data/db -d mongo:8
```

## Checks and production build

```bash
npm test
npm run build
npm run preview
```

The frontend build is written to `frontend/dist`. For a production deployment, serve that directory with an SPA-capable static host and configure `VITE_API_URL` at build time, or reverse-proxy `/api` to the backend. Run the backend with `npm start`, set `MONGODB_URI`, and set `CLIENT_ORIGIN` to your frontend URL. The Vite development proxy is not included in the production build.

## API

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/health` | Service health |
| GET | `/api/tasks` | List tasks, newest first |
| POST | `/api/tasks` | Create a task |
| PATCH | `/api/tasks/:id` | Update task fields |
| DELETE | `/api/tasks/:id` | Delete a task |

Task fields: `title` (required, 1–200 characters), `description` (up to 2,000 characters), `priority` (`low`, `medium`, `high`), `dueDate` (optional `YYYY-MM-DD`), and `completed` (boolean).

The API tests use an isolated model substitute to check routing, validation, and error handling without requiring MongoDB. This simple app uses one shared task list and does not include accounts or authentication.

To run the optional real MongoDB smoke test, set `MONGODB_URI` to a running database and run `npm run test:integration` in `backend`. Without that variable, it uses an isolated verification database on port 27028. The check creates a temporary task and cleans it up.
