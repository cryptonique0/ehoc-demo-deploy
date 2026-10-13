# CAGL Global e-HOC

This is a static, installable Progressive Web App. It works over HTTPS, can
be installed on Android and iOS, and keeps cards in IndexedDB so a card can
be written while offline. The service worker caches the app shell for repeat
offline launches.

## Deploy to Vercel

```bash
npm i -g vercel
vercel
vercel --prod
```

You can also import this repository at [vercel.com/new](https://vercel.com/new).
No build step is required. Any static HTTPS server can host the same files;
make sure it serves `manifest.webmanifest` as `application/manifest+json`,
`sw.js` as JavaScript, and does not rewrite those files to an HTML 404 page.

## Install on phones

- **Android:** open the HTTPS URL in Chrome. The app displays an Install app
  action when Chrome makes the PWA install prompt available. Chrome may also
  show its install icon in the address bar.
- **iPhone/iPad:** open the URL in Safari, tap **Share**, then **Add to Home
  Screen**. Apple does not expose a web API that can open this prompt
  automatically, so the app displays these instructions instead.

## Sync endpoint

Cards are stored locally on each device as `Pending`. **Sync now** posts each
pending card to `/api/sync`; a card changes to `Synced` only after the server
returns success. Failed cards stay pending and can be retried.

The endpoint forwards validated cards to a server-side receiver. Configure
these Vercel environment variables before deploying:

```text
SYNC_FORWARD_URL=https://your-receiver.example/sync
SYNC_FORWARD_TOKEN=your-server-only-token
RECEIVER_EMAIL=samad@rexledge.site
```

The sync endpoint sends `receiverEmail: "abdulganiyu838@gmail.com"` with each
accepted card. The receiver service is responsible for sending the actual
email. It can later be replaced with Zoho Creator/Flow, a database API, or
another admin service without changing the phone app. Do not put receiver
URLs containing secrets or tokens in `index.html`.
