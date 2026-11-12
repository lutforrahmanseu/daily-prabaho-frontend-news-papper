# দৈনিক বার্তা প্রবাহ (Daily Prabaho) — Frontend SPA

Standalone **React 19 + Vite + Tailwind CSS v4 + Redux Toolkit / RTK Query + TipTap** frontend repository for the Daily Prabaho / NewsFlow digital journalism platform.

## Key Capabilities
- **Public Newspaper Experience**: Dynamic editorial homepage grid, bilingual Bengali-English interface, deep article reading view, digital e-paper, full-text search, hyperlocal Bangladesh network, reader community, events, and developer portal (`/developers`).
- **Editorial & Newsroom CMS**: TipTap rich-text editor, 8-stage editorial workflow, RBAC route guards, AI newsroom assistant UI, multimedia/longform studio, creator studio, analytics & A/B experiments, and syndication governance (`/admin/syndication`).
- **SEO & Accessibility**: Dynamic XML sitemaps (`/sitemap.xml`, `/sitemap-news.xml`), Schema.org JSON-LD (`NewsArticle`, `BreadcrumbList`), canonical URLs, and WCAG 2.2 AA accessibility controls.

## Prerequisites
- Node.js 20+ (tested on Node 22)
- Running instance of the standalone `backend` Laravel 11 REST API repository (`http://127.0.0.1:8000` by default)

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env

# 3. Start development server (proxies /api and /storage to VITE_BACKEND_URL)
npm run dev
```

On Windows, you can also run `start-frontend.bat` directly inside this folder.

## Scripts
- `npm run dev` — Start Vite dev server on `http://localhost:3000`
- `npm run build` — Generate XML sitemaps and build production bundle into `dist/`
- `npm test` — Run all frontend unit, security, accessibility, and QA suites
- `npm run lint` — Run TypeScript type check (`tsc --noEmit`)

## Connecting to Standalone Backend Repo
- During local development, `vite.config.ts` proxies `/api/*` and `/storage/*` to `VITE_BACKEND_URL` (default `http://127.0.0.1:8000`).
- If deploying frontend and backend on separate domains (e.g., `dailyprabaho.com` and `api.dailyprabaho.com`), set `VITE_API_URL="https://api.dailyprabaho.com/api/v1"` before running `npm run build`, and add the frontend origin to `CORS_ALLOWED_ORIGINS` in the backend repository.
