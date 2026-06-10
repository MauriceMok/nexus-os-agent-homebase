# NEXUS OS — AI Agent Homebase

> The operating system for AI agent fleets. Built for entrepreneurs who run multi-agent workflows.

![NEXUS OS](https://img.shields.io/badge/NEXUS_OS-v2.4.1-00F5FF?style=for-the-badge&labelColor=0D0F1A)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&labelColor=0D0F1A)
![Express](https://img.shields.io/badge/Express-4-000000?style=for-the-badge&logo=express&labelColor=0D0F1A)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=for-the-badge&logo=sqlite&labelColor=0D0F1A)

## Features

- **Agent Fleet Management** — Deploy, edit, decommission AI agents with full CRUD
- **Command Board (Kanban)** — Drag & drop task management across 5 stages with search & filter
- **Mission Control** — Analytics dashboard with donut charts, weekly performance, leaderboard
- **Comms Terminal** — Live scrolling agent feed + interactive CLI (`help`, `status`, `agents`, etc.)
- **Real Backend** — Express + SQLite API with live agent activity simulation
- **Export** — One-click JSON export of all tasks, agents, and missions

## Architecture

```
┌──────────────────────────────────────────────┐
│  Browser (React SPA)                         │
│  ┌────────────┐  ┌─────────────────────────┐ │
│  │  useStore  │──│  API Client (fetch)     │ │
│  └────────────┘  └───────────┬─────────────┘ │
└──────────────────────────────┼────────────────┘
                               │ HTTP /api/*
┌──────────────────────────────┼────────────────┐
│  Express Server (Node.js)    │                │
│  ┌──────────────┐  ┌─────────▼───────────┐   │
│  │  REST API    │  │  Static File Serve  │   │
│  └──────┬───────┘  └─────────────────────┘   │
│         │                                     │
│  ┌──────▼───────┐  ┌──────────────────────┐  │
│  │  SQLite DB   │  │  Agent Simulator     │  │
│  └──────────────┘  └──────────────────────┘  │
└──────────────────────────────────────────────┘
```

## Stack

- **Frontend**: React 19 + Vite 8
- **Backend**: Express 4 + better-sqlite3
- **Styling**: Pure CSS custom design system
- **Fonts**: Orbitron, Inter, JetBrains Mono (Google Fonts)

## Getting Started

### Development (frontend + backend together)

```bash
npm install
npm run dev:all
```

This starts:
- **Frontend** on http://localhost:5173 (Vite dev server, proxies /api to backend)
- **Backend** on http://localhost:3001 (Express API server)

### Production Build & Run

```bash
npm install
npm run build
npm start
```

Open http://localhost:3001 — the Express server serves both the API and the built frontend.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/state` | Full state snapshot (agents, tasks, missions, events, history) |
| GET/POST | `/api/tasks` | List / Create tasks |
| PATCH/DELETE | `/api/tasks/:id` | Update / Delete a task |
| GET/POST | `/api/agents` | List / Create agents |
| PATCH/DELETE | `/api/agents/:id` | Update / Delete an agent |
| GET/POST | `/api/missions` | List / Create missions |
| PATCH/DELETE | `/api/missions/:id` | Update / Delete a mission |
| GET/DELETE | `/api/events` | List / Clear events |
| POST | `/api/reset` | Reset all data to factory defaults |

## Deploying to Production

### Option 1: Single Server (Node.js)

The simplest approach — one process serves everything:

```bash
npm install
npm run build
npm start
# App running on http://localhost:3001
```

Set `PORT` env var to change the port (default 3001).

### Option 2: Deploy to Railway / Render / Fly.io

These platforms auto-detect Node.js. Just push the repo:

```bash
# On Railway/Render, set:
# Build Command: npm install && npm run build
# Start Command: npm start
```

### Option 3: VPS with PM2

```bash
npm install
npm run build
npm install -g pm2
pm2 start server/index.js --name nexus-os
pm2 save
pm2 startup
```

### Option 4: Vercel/Netlify (Frontend) + Separate Backend

- Deploy frontend (`dist/`) to Vercel/Netlify
- Deploy `server/` to Railway/Render as a separate API
- Set `VITE_API_URL` env var on frontend to point to the API URL

## Design System

| Token | Value | Usage |
|---|---|---|
| `--cyan` | `#00F5FF` | Active agents, primary accent |
| `--violet` | `#7B2FFF` | Intelligence layer, missions |
| `--coral` | `#FF3E6C` | Alerts, critical priority |
| `--gold` | `#FFB800` | High priority, idle agents |
| `--green` | `#00E676` | Success, deployed, active status |
| Font Brand | Orbitron | Headings, labels, agent names |
| Font Body | Inter | All readable text |
| Font Mono | JetBrains Mono | Terminal, data, timestamps |

## License

MIT
