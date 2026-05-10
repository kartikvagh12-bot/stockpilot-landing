# Operza Landing

Marketing website for **Operza** — inventory and production tracking for small manufacturers.

Built with **Next.js 14 (App Router)** + **TypeScript** + **Tailwind CSS**. Deploy-ready for Vercel.

## Sections

- Hero with `Try Demo` / `Book Demo` CTAs and a live-looking dashboard mock
- Problem — Excel/manual tracking pain points
- Features — raw material inventory, BOMs, production tracking, finished goods, low stock alerts, reports
- Product screenshots (placeholder cards, ready to swap for real PNGs)
- FAQ
- Contact / demo request form
- Mobile responsive, SEO-friendly (Open Graph, Twitter cards, JSON-LD, sitemap, robots)

## Environment variables

The Book Demo form on the contact section writes leads directly into the
Supabase `demo_requests` table (the same Supabase project the Operza app
uses). You need:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon publishable key>
```

For local dev, copy `.env.local.example` to `.env.local` and fill in the
values. For Vercel, add the same two keys under
**Project → Settings → Environment Variables** for Production, Preview
and Development.

The `demo_requests` table is created by migration
`supabase/migrations/003_demo_requests.sql` in the
[`Inventory_tracker`](https://github.com/kartikvagh12-bot/Inventory_tracker)
repo. Run it once in the Supabase SQL editor before going live.

## Where leads show up

1. Open Supabase Dashboard → **Table Editor** → `demo_requests`.
2. Newest leads appear at the top (the table is indexed on `created_at desc`).
3. Columns: `name`, `email`, `phone`, `company`, `message`, `created_at`.

### Optional: email me when a new lead comes in

Supabase has built-in **Database Webhooks** for this. In the dashboard:

1. **Database → Webhooks → Create webhook**
2. Source: `demo_requests`, event: `INSERT`
3. Type: `HTTP Request` (POST) to a service that emails you, e.g.:
   - [Resend](https://resend.com) (`https://api.resend.com/emails` with your API key in the headers)
   - A Zapier / Make / n8n webhook that forwards to Gmail
   - A simple Cloudflare Worker / Vercel function that calls Resend

The form persists every submission whether or not the webhook is wired —
it's purely a notification add-on.

## Local development

```bash
npm install
cp .env.local.example .env.local   # fill in the two Supabase values
npm run dev
```

Open <http://localhost:3000>.

## Production build

```bash
npm run build
npm start
```

## Deploy to Vercel

1. Push this repo to GitHub.
2. On <https://vercel.com/new>, import the repo.
3. Framework preset will auto-detect **Next.js**.
4. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` under
   **Environment Variables** before the first deploy.
5. Deploy.

## Project structure

```
app/
  layout.tsx        global metadata, fonts, viewport
  page.tsx          composes all sections
  globals.css       Tailwind + base styles
  sitemap.ts        /sitemap.xml
  robots.ts         /robots.txt
components/
  Navbar.tsx
  Hero.tsx
  Problem.tsx
  Features.tsx
  Screenshots.tsx
  FAQ.tsx
  Contact.tsx      writes leads to Supabase demo_requests
  Footer.tsx
lib/
  supabase.ts      browser Supabase client (lazy)
public/
  favicon.svg
```

## Replacing screenshot placeholders

Drop real product screenshots into `public/screenshots/` and edit
`components/Screenshots.tsx` to render them via `next/image` in place of
the `ScreenshotPlaceholder` component.

## License

© Operza. All rights reserved.
