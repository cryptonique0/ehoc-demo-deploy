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
RECEIVER_EMAIL=abdulganiyu838@gmail.com
```

The sync endpoint sends the configured `RECEIVER_EMAIL` with each accepted
card. The receiver service is responsible for sending the actual email. It
can be replaced with Zoho Creator/Flow, a database API, or another admin
service without changing the phone app. Do not put receiver URLs containing
secrets or tokens in `index.html`.

## Admin dashboard

Open `/admin.html` for the central administrator dashboard. It provides:

- Supabase Auth administrator sign-in
- Date, location, and status filtering
- Submission totals, pending totals, priority items, and good-practice totals
- Full details for every submitted card
- PDF and PowerPoint export for the filtered report or selected card

Create a Supabase project, then run this SQL in the Supabase SQL editor:

```sql
create table public.cards (
  id text primary key,
  name text not null,
  function text,
  project text,
  customer text,
  location text not null,
  "eventTime" text,
  description text not null,
  immediate text,
  further text,
  nature jsonb not null default '[]'::jsonb,
  category jsonb not null default '[]'::jsonb,
  type jsonb not null default '[]'::jsonb,
  "reportDate" date not null,
  status text not null default 'pending',
  "deviceTime" timestamptz,
  "serverTime" timestamptz,
  "zohoRecordId" text,
  history jsonb not null default '[]'::jsonb,
  synced_at timestamptz not null default now()
);

alter table public.cards enable row level security;
```

Create an administrator user in Supabase Authentication, then set its
`app_metadata` role to `admin` using the Supabase server-side admin tooling.
Never expose the service-role key in browser code.

Configure these Vercel environment variables:

```text
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-public-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
SYNC_FORWARD_URL=https://your-receiver.example/sync
SYNC_FORWARD_TOKEN=your-server-only-token
RECEIVER_EMAIL=admin@example.com
```

The dashboard uses the public anon key only for login. The protected
`/api/admin/cards` endpoint verifies the Supabase access token and the
administrator role before reading data with the server-only service key.
