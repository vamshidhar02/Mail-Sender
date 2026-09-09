# Architecture

## Packages

| Package | Purpose |
| --- | --- |
| `@mailer/api` | NestJS HTTP API and the send path |
| `@mailer/shared` | Types, enums and constants used by the API and, later, the web app |
| `@mailer/web` | Placeholder for the React dashboard |

`@mailer/shared` compiles to CommonJS + `.d.ts` so a CommonJS Nest build can
require it directly. It must be built before the API typechecks — the root
`dev`, `build` and CI scripts do that first.

## API module map

```
src/
├── main.ts                  bootstrap: global prefix, validation, CORS, Swagger
├── app.module.ts            wires config + feature modules
├── config/
│   ├── configuration.ts     typed config namespaces (app, mail, send)
│   └── env.validation.ts    zod schema — boot fails on bad env
├── common/
│   ├── dto/                 PaginationDto + paginate() helper
│   ├── filters/             HttpExceptionFilter (uniform error body)
│   ├── interceptors/        TransformInterceptor (Dates → ISO strings)
│   └── pipes/               ParseCuidPipe
├── prisma/                  PrismaService (global module)
└── modules/
    ├── mail/                mail transport: file (.eml) or SMTP
    ├── contacts/            contacts + contact lists
    ├── templates/           CRUD + Handlebars renderer
    ├── campaigns/           CRUD + the send path
    └── health/              database and SMTP checks
```

## Data model

```
ContactList ──< ContactListMembership >── Contact
     │                                       │
     │                                       │
CampaignList                          CampaignMessage
     │                                       │
     └──────────── Campaign ────────────────-┘
                      │
                   Template
```

- `CampaignMessage` is the send log: one row per recipient per campaign, unique
  on `(campaignId, contactId)`. That uniqueness is what makes a re-send skip
  people who already received the mail.
- Campaign stats are **counted from message rows**, not stored on the campaign,
  so they cannot drift out of sync with reality.
- `Contact.attributes` is JSON, so adding a merge field needs no migration.

### Datasource

The datasource is Postgres, both locally and in production (Neon). The project
started on SQLite; the move left two things worth knowing:

- `Template.variables` is `Json` holding an array of strings rather than a
  native `String[]`. Postgres supports the scalar list, but the serializers and
  `TemplatesService` read the column as JSON, so it stays as-is. Switching is a
  contained change if a query ever needs to filter on it.
- Both JSON columns now carry DB-level defaults (`{}` and `[]`). The services
  still always write them explicitly, so the defaults only matter for rows
  inserted outside the application.

Search uses `mode: 'insensitive'` on every `contains` filter, which Postgres
needs in order to match case-insensitively.

## Send path

`POST /campaigns/:id/send` → `CampaignSenderService.send()`:

1. Validate the campaign is `DRAFT` and has at least one list. Mark it `SENDING`.
2. Page through subscribed contacts in the target lists using keyset pagination
   (`SEND_BATCH_SIZE`, default 50), so memory does not scale with list size.
3. Per contact: upsert the message row, skip if already `SENT`, render the
   template with that contact's data, send over SMTP, record `SENT` or `FAILED`
   with the error text.
4. Mark the campaign `SENT`. An infrastructure-level throw marks it `FAILED`;
   per-recipient errors do not.

Verified end to end with the file transport: a 10-recipient
seeded campaign produced 10 `.eml` files with per-recipient merge fields,
`stats` reported `sent: 10, failed: 0`, an unsubscribed contact was excluded
from a later send, and re-sending a `SENT` campaign was rejected.

### Known limits

- The send is inline, so the HTTP request stays open for its duration.
- A process restart mid-send leaves the campaign stuck in `SENDING`.
- No rate limiting beyond the SMTP connection pool.

All three are addressed by the same change: move step 3 onto a job queue. The
`CampaignMessage` table is already shaped for it — each row is a unit of work
with its own status and error.
