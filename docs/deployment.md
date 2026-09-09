# Deployment

The two apps deploy to two different platforms, because they have different shapes:

| App        | Platform | Why                                                                 |
| ---------- | -------- | ------------------------------------------------------------------- |
| `apps/web` | Vercel   | A static Vite SPA. Vercel is exactly the right tool.                  |
| `apps/api` | Render   | A long-lived Node process. Campaign sends run inline and can outlast a serverless function's timeout. |

Backing services: **Neon** (Postgres) and **Resend** (SMTP).

> **Ordering note.** The API needs the web's URL for CORS, and the web needs the
> API's URL to call it — and you cannot know either before deploying. So: step 3
> deploys the API with `CORS_ORIGINS` unset, step 4 deploys the web against the
> API's URL, and step 5 comes back to lock down CORS. Expect the round trip.

---

## 1. Neon (database)

1. Create a project at <https://neon.tech>. Pick the region closest to the one
   you will give Render (`render.yaml` defaults to `oregon` / US West).
2. From the dashboard, copy the **Pooled connection** string. It has `-pooler`
   in the host and ends in `?sslmode=require`:

   ```
   postgresql://USER:PASSWORD@ep-xxx-pooler.us-west-2.aws.neon.tech/neondb?sslmode=require
   ```

   Use the pooled one, not the direct one. Neon's free plan caps direct
   connections, and Prisma opens a pool per instance.

Nothing else to do here — the schema is created by `prisma migrate deploy`,
which runs on every API boot (see `startCommand` in `render.yaml`).

## 2. Resend (email)

1. Sign up at <https://resend.com> and add a domain you control under
   **Domains**. Add the DNS records it gives you and wait for verification.
2. Create an API key under **API Keys**. Copy it — it is shown once.

SMTP credentials are then:

| Setting         | Value                                              |
| --------------- | -------------------------------------------------- |
| `SMTP_HOST`     | `smtp.resend.com`                                   |
| `SMTP_PORT`     | `465`                                               |
| `SMTP_SECURE`   | `true`                                              |
| `SMTP_USER`     | `resend` (the literal string, not your email)        |
| `SMTP_PASSWORD` | your API key (`re_…`)                                |

`MAIL_FROM_ADDRESS` **must** be on the domain you verified. Resend rejects
anything else, and the app surfaces that as a failed send per recipient.

## 3. Render (API)

1. In Render, choose **New → Blueprint** and select this repository. Render
   reads `render.yaml` from the repo root and pre-fills the build, start, and
   health-check settings.
2. Fill in the variables the blueprint marks as `sync: false`:

   | Variable            | Value                                                   |
   | ------------------- | ------------------------------------------------------- |
   | `DATABASE_URL`      | the pooled Neon string from step 1                       |
   | `SMTP_PASSWORD`     | the Resend API key from step 2                           |
   | `MAIL_FROM_NAME`    | e.g. `Mail Sender`                                       |
   | `MAIL_FROM_ADDRESS` | e.g. `no-reply@your-verified-domain.com`                 |
   | `CORS_ORIGINS`      | **leave blank for now** — locked down at step 5          |

   Everything else (`MAIL_TRANSPORT=smtp`, `SMTP_HOST`, ports, `API_PREFIX`) is
   already set in `render.yaml`.
3. Deploy. The first build takes a few minutes; it installs the workspace,
   builds `@mailer/shared`, generates the Prisma client, and runs `nest build`.
4. Confirm it is up:

   ```bash
   curl https://mail-sender-api.onrender.com/api/health
   # {"status":"ok","checks":{"database":"up","smtp":"up"}}
   ```

   `database: down` means `DATABASE_URL` is wrong or the migration failed —
   check the deploy logs. `smtp: down` means Resend rejected the credentials.

Note your API's URL. Interactive docs are at `/api/docs`.

## 4. Vercel (web)

1. **Add New → Project**, import this repository.
2. Set **Root Directory** to `apps/web`. This is the important one — the repo
   root has no buildable app, and Vercel will fail to detect a framework if you
   leave it at the default.
3. Framework preset should auto-detect as **Vite**. Build command and output
   directory come from `apps/web/vercel.json`; leave the overrides off.
4. Add one environment variable, for all environments:

   ```
   VITE_API_URL = https://mail-sender-api.onrender.com/api
   ```

   Include the `/api` suffix — it matches `API_PREFIX` on the server, and the
   RTK Query client in `src/services/api/baseApi.ts` appends paths directly to it.
5. Deploy, and note the resulting `https://….vercel.app` URL.

Vite inlines `VITE_*` variables **at build time**. Changing this value later
requires a redeploy, not just a settings save.

## 5. Lock down CORS

While `CORS_ORIGINS` is blank the API reflects **any** origin — `main.ts` falls
back to `origin: true`. That is why step 4 works before this step, and it is
also why you should not leave it that way: any website can call your API from a
visitor's browser, and every endpoint is currently unauthenticated.

In Render → your service → **Environment**, set:

```
CORS_ORIGINS = https://your-app.vercel.app
```

No trailing slash, and comma-separate to add more (a custom domain, or a Vercel
preview URL you actively test against). Save; Render restarts automatically.

If the dashboard breaks right after this step — API calls failing in the browser
with a CORS error while the same URL works under `curl` — the value does not
match the origin exactly. A trailing slash or `http` vs `https` is enough.

## 6. Seed (optional)

To put demo lists, templates, and contacts in the production database, run the
seed from your machine against the Neon URL:

```bash
cd apps/api
DATABASE_URL="postgresql://…-pooler.…/neondb?sslmode=require" npx prisma db seed
```

---

## Things that will bite you

**Render's free plan sleeps.** After 15 minutes of no traffic the service spins
down, and the next request takes ~50 seconds while it cold-starts. The first
dashboard load after an idle period will look broken. It is not — it is waiting.
A paid instance ($7/mo) removes this.

**Long campaigns and a sleeping server.** `CampaignSenderService.send()` sends
every recipient inline, within the HTTP request. On Render this has no hard
timeout the way a serverless function does, so it works — but the browser is
holding an open request the whole time, and a free-plan spin-down mid-send
leaves the campaign stuck in `SENDING`. Re-running the send is safe: already-sent
recipients are skipped via the `campaignId_contactId` unique constraint on
`CampaignMessage`. Moving the send to a queue is the real fix when volume grows.

**Resend's free tier** is 3,000 emails/month and 100/day. A bulk send that
exceeds it fails per-recipient, and those rows land in `CampaignMessage` with
`status: FAILED` and the provider's error text.

**Migrations run on boot**, so a deploy that includes a migration Prisma
considers destructive will fail to start rather than silently drop data. Read
the deploy log if the service will not come up after a schema change.

## Local development after the Postgres switch

The project no longer uses SQLite. Start a local Postgres and point `.env` at it:

```bash
docker run --rm -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=mailer postgres:16
pnpm db:migrate
pnpm db:seed
pnpm dev
```

`MAIL_TRANSPORT=file` still works locally and writes `.eml` files to
`apps/api/storage/mail` — no mail server needed for development.
