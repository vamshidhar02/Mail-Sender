# Mail Sender

Bulk mail dispatcher, set up as a pnpm monorepo.

**Current state:** backend (NestJS + Prisma + SQLite) and dashboard
(React + Ant Design + Tailwind + RTK Query) are both implemented. Every endpoint
is unauthenticated — see Next steps.

**No external services required.** The database is a SQLite file and outbound
mail is written to disk as `.eml` files, so `pnpm install` and a migration are
all it takes to run a real campaign locally.

## Layout

```
.
├── apps/
│   ├── api/                  NestJS backend (implemented)
│   │   ├── prisma/           schema, migrations, seed, dev.db
│   │   ├── src/
│   │   └── storage/mail/     .eml files written by the file transport
│   └── web/                  React dashboard (Vite + AntD + RTK Query)
├── packages/
│   └── shared/               Types + enums shared by API and web
├── docs/
└── tsconfig.base.json        Compiler options every package extends
```

## Requirements

- Node 20+
- pnpm 9+

That is the whole list. No Docker, no database server, no mail server.

## Getting started

```bash
pnpm install
cp .env.example .env

pnpm db:migrate     # creates apps/api/prisma/dev.db and runs the seed
pnpm dev            # API on :4000, dashboard on :5173
```

Open <http://localhost:5173> — the dashboard proxies `/api` to the Nest app, so
there is no CORS setup to do in development.

Then send the seeded campaign:

```bash
curl localhost:4000/api/campaigns                     # grab the id
curl -X POST localhost:4000/api/campaigns/<id>/send
```

Ten `.eml` files appear in `apps/api/storage/mail/`. Open one in any mail client,
or just `cat` it — each is a complete RFC-822 message.

- Swagger UI: <http://localhost:4000/api/docs>

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Build `@mailer/shared`, then run API and dashboard together |
| `pnpm dev:api` / `pnpm dev:web` | Run just one of them |
| `pnpm build` | Build shared package, then the API and the dashboard |
| `pnpm lint` | ESLint across the workspace |
| `pnpm typecheck` | `tsc --noEmit` across the workspace |
| `pnpm test` | Jest suites |
| `pnpm db:migrate` | Apply migrations (creates the DB on first run) |
| `pnpm db:seed` | Re-run the seed |
| `pnpm db:reset` | Drop the database, re-migrate, re-seed |
| `pnpm db:studio` | Prisma Studio, a GUI over the data |

Prisma's CLI does not read the repo-root `.env` on its own, so those scripts go
through `dotenv-cli`. That keeps a single `.env` at the root for both the CLI and
the app.

## Mail transports

Set by `MAIL_TRANSPORT`:

| Value | Behaviour |
| --- | --- |
| `file` (default) | Writes each message to `MAIL_OUTPUT_DIR` as a timestamped `.eml`. No server, nothing leaves the machine. |
| `smtp` | Sends for real through `SMTP_*`. Point it at a provider, or at Mailpit/MailHog if you want a local inbox UI. |

Nothing else changes between the two — the same code path renders and sends.

## What the backend does

- **Contact lists** — create lists, add contacts to them.
- **Contacts** — CRUD, filter by status or list, unsubscribe.
- **Templates** — CRUD with `{{mergeTag}}` bodies; merge tags are detected on
  save and a preview endpoint renders against sample data.
- **Campaigns** — CRUD; a campaign points at one template and one or more lists.
- **Sending** — `POST /campaigns/:id/send` walks every subscribed contact in the
  target lists, renders the template per recipient, and sends. One
  `CampaignMessage` row per recipient records success or failure.

## What the dashboard does

| Screen | What you can do |
| --- | --- |
| Dashboard | Contact/list/campaign totals and the five most recent campaigns |
| Campaigns | Search, paginate, create, open, delete drafts |
| Campaign detail | Live counters, send with confirmation, send a test to one address |
| Contacts | Search, filter by list, add, unsubscribe, delete |
| Lists | Create and delete lists, see contact counts |
| Templates | Create and edit, with a side-by-side rendered preview |

See [docs/api.md](docs/api.md) for endpoints and
[docs/architecture.md](docs/architecture.md) for how the send path works.

## Notes on the send path

The send runs **inline, in batches** (`SEND_BATCH_SIZE`, default 50) using keyset
pagination, so memory stays flat regardless of list size. Recipients already
marked `SENT` are skipped, which makes a re-run of a partially failed campaign
safe.

That is deliberate for a basic setup, and it has a ceiling: the HTTP request
stays open for the duration of the send, and a process restart mid-send leaves
the campaign in `SENDING`. The natural next step is moving the per-message send
onto a job queue so the request returns immediately and individual failures retry
on their own.

## Choosing a production database

SQLite is right for local development and small deployments, but it is a single
file with one writer. Moving to Postgres later is a small change:

1. `provider = "postgresql"` in `prisma/schema.prisma`, and a Postgres
   `DATABASE_URL`.
2. `Contact.attributes` and `Template.variables` can go back to native types
   (`Json` with a default, `String[]`).
3. Re-add `mode: 'insensitive'` to the `contains` filters in the services —
   Postgres needs it for case-insensitive search; SQLite does not support it and
   does not need it.
4. Delete `prisma/migrations/` and generate a fresh initial migration.

## Next steps

- Auth (JWT) — every endpoint is currently unauthenticated.
- Job queue for sending, with retries and rate limiting.
- CSV contact import.
- Open/click tracking and provider bounce webhooks.
- Bulk actions and CSV import in the contacts screen.
