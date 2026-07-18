# Real Estate CRM — Frontend

React + TypeScript + Vite frontend for the Real Estate CRM application.

## Tech Stack

- **React 18** with **TypeScript**
- **Vite** for dev server and bundling
- **Material UI (MUI)** for components
- **React Router** for routing
- **TanStack Query (React Query)** for data fetching/caching
- **React Hook Form** + **Zod** for forms and validation

## Prerequisites

- **Node.js** 18+ (recommended: 20+)
- **npm** 9+ (or pnpm / yarn)

## Install

```bash
# From this directory (FE)
npm install
```

## Environment Variables

Create a `.env` file in this folder with:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_NAME=Real Estate CRM
```

Adjust the API URL to match your backend (default Django dev server runs on `:8000`).

## Run (development)

```bash
npm run dev
```

App will be available at: **http://localhost:5173**

The Vite dev server proxies API calls to the backend — see `vite.config.ts`.

## Build (production)

```bash
npm run build
```

Outputs optimized static files to `dist/`.

## Preview production build

```bash
npm run preview
```

Runs the production build locally on http://localhost:4173 for verification before deploying.

## Lint

```bash
npm run lint
```

## Project Structure

```
src/
├── api/              # API client per domain (lead, sales, inventory, etc.)
├── components/       # Reusable UI components (layout, common, forms)
├── contexts/         # React contexts (auth, breadcrumb, toast, theme)
├── hooks/            # Custom hooks
├── pages/            # Page components grouped by module
│   ├── lead/
│   ├── sitevisit/
│   ├── inventory/
│   ├── sales/
│   └── settings/
├── routes/           # Route definitions per module
├── store/            # Redux store (auth, menu, permissions)
├── types/            # TypeScript types/interfaces
└── utils/            # Helpers, constants, spacing, permissions
```

## Available Modules

- **Lead Management** — leads, follow-ups, cross-lead check
- **Site Visit Management** — schedule and complete site visits
- **Inventory Management** — plots and flats inventory
- **Sales** — orders, schemes, dispatch
- **Masters** — products, customers, projects
- **Reports** — sales / receipt / dispatch reports
- **Settings** — users, groups, permissions

## Common Tasks

### Add a new page

1. Create the page in `src/pages/<module>/`
2. Register lazy import + route in `src/routes/<module>Routes.tsx`
3. Add the route in `src/routes/index.tsx`

### Add a new API endpoint

1. Add the method to the relevant API file in `src/api/`
2. Create types in `src/types/` if needed
3. Use via `useQuery` / `useMutation` from TanStack Query

## Troubleshooting

### Dropdowns are empty until page refresh

The dropdowns use React Query with `refetchOnMount: 'always'`. If you still see empty dropdowns:
- Check that the backend API is responding (open DevTools → Network tab)
- Verify `.env` `VITE_API_BASE_URL` matches the running backend

### 401 Unauthorized

- Ensure you're logged in and JWT token is valid
- Check that the backend URL in `.env` is correct

### Login page redirect loops

Clear browser cookies and local storage, then log in again.

## Need Help?

Refer to:
- `package.json` for all available scripts
- `vite.config.ts` for build/dev config
- `tsconfig.json` for TypeScript config
