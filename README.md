# NEXUS OS — AI Agent Homebase

> The operating system for AI agent fleets. Built for entrepreneurs who run multi-agent workflows.

![NEXUS OS](https://img.shields.io/badge/NEXUS_OS-v2.4.1-00F5FF?style=for-the-badge&labelColor=0D0F1A)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&labelColor=0D0F1A)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&labelColor=0D0F1A)

## Features

- **Agent Fleet Management** — Deploy, edit, decommission AI agents with full CRUD
- **Command Board (Kanban)** — Drag & drop task management across 5 stages with search & filter
- **Mission Control** — Analytics dashboard with donut charts, weekly performance, leaderboard
- **Comms Terminal** — Live scrolling agent feed + interactive CLI (`help`, `status`, `agents`, etc.)
- **Full Persistence** — All data saved to `localStorage` — survives page refresh
- **Export** — One-click JSON export of all tasks, agents, and missions
- **Boot Animation** — Cinematic OS boot sequence on first load

## Stack

- React 18 + Vite 5
- Pure CSS (no UI library) — custom design system
- localStorage for persistence
- Google Fonts: Orbitron, Inter, JetBrains Mono

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

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
