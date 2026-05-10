# Operza Landing

Marketing website for **Operza** — raw material and production tracking software for small manufacturers in India.

Built with **Next.js 14 (App Router)** + **TypeScript** + **Tailwind CSS**. Deploy-ready for Vercel.

## Sections

- Hero with `Try Demo` / `Book Demo` CTAs and a live-looking dashboard mock
- Problem — Excel/manual tracking pain points
- Features — raw material inventory, BOMs, production tracking, finished goods, low stock alerts, reports
- Product screenshots (placeholder cards, ready to swap for real PNGs)
- FAQ
- Contact / demo request form
- Mobile responsive, SEO-friendly (Open Graph, Twitter cards, JSON-LD, sitemap, robots)

## Local development

```bash
npm install
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
3. Framework preset will auto-detect **Next.js**. No env vars required.
4. Deploy.

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
  Contact.tsx
  Footer.tsx
public/
  favicon.svg
```

## Replacing screenshot placeholders

Drop real product screenshots into `public/screenshots/` and edit
`components/Screenshots.tsx` to render them via `next/image` in place of
the `ScreenshotPlaceholder` component.

## License

© Operza. All rights reserved.
