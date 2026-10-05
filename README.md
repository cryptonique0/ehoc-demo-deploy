# CAGL e-HOC — demo deploy

This folder contains exactly one file: `index.html` — a byte-for-byte copy
of the page published at the Claude artifact link. Nothing else is in
here on purpose, so deploying this gives you that same demo, unchanged.

## Deploy to Vercel

```bash
npm i -g vercel        # skip if already installed
cd ehoc-demo-deploy
vercel                 # first deploy, follow the prompts
vercel --prod           # promote to a permanent production URL
```

No build step, no framework, no config needed — Vercel will detect this
as a static site and serve `index.html` as-is.

You can also deploy without the CLI: go to vercel.com/new, drag this
folder in (or push it to a GitHub repo and import that), and deploy.

## Notes

- This is the **demo only** — cards submitted here stay in that visitor's
  own browser (IndexedDB), and Sync will correctly show "Pending" since
  there's no backend wired up. That's intentional, same as the artifact.
- If you want the full installable offline app (service worker,
  multi-page, `/api/sync` hook for Zoho) instead of this single demo
  page, that's the separate `cagl-ehoc-app.zip` project from earlier —
  this zip is deliberately just the demo, unchanged.
