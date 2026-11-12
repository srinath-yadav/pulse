# Pulse frontend

React dashboard for Pulse. It shows every client's Jira work in one place and requests AI status reports from the Pulse API.

## Run it

Start the backend on port 8000 first (see `../backend/README.md`), then:

```bash
npm install
npm run dev
```

Open http://localhost:5173. In development, Vite forwards `/api/*` to `http://localhost:8000`, so the browser only talks to one origin.

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Type-check and build for production into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Lint with oxlint |

## Screens

- **Overview:** a headline worked out from the data, the client pulse chart, issues that need attention, and team workload
- **Client page:** status breakdown, issues as a list or a board, the AI status report and the Ask Pulse panel
- **Issue drawer:** details, why Pulse flags the issue and the assignee's other open work. Each issue has its own URL, such as `#/clients/HLX/HLX-101`
- **Search:** ⌘K or Ctrl+K opens a command palette for clients, issues and people

## Code structure

```
src/
├── App.tsx            Layout, data loading, hash routing, keyboard shortcuts
├── api.ts             All calls to the Pulse API, with typed errors
├── types.ts           Types that mirror the backend's Pydantic models
├── styles.css         Design tokens (light and dark) and all styles
├── lib/
│   ├── health.ts      On track / at risk / blocked rules
│   ├── status.ts      Status order and labels
│   └── useTheme.ts    Theme hook, saved in localStorage
├── pages/
│   ├── Overview.tsx
│   └── ProjectPage.tsx
└── components/        PulseStrip, IssueTable, IssueBoard, IssueDrawer,
                       ReportPanel, CommandPalette, Workload, Sidebar, ...
```

## Design notes

- **No UI or chart library.** Charts are plain HTML and CSS, and icons are inline SVG, which keeps the bundle small.
- **Status is never colour alone.** Every status has a text label, health uses a shape (circle, triangle, square), and the status colours were checked for colour-blind separation.
- **Explicit UI states.** The report panel moves through idle, loading, ready and error, modelled as one TypeScript union, so the UI cannot show two states at once.
- **Accessible by default:** keyboard focus is visible, dialogs close with Escape, and animations respect reduced-motion settings.