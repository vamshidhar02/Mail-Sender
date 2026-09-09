# API reference

Base URL: `http://localhost:4000/api` — interactive docs at `/api/docs`.

All list endpoints accept `?page`, `?limit` (max 200), `?search`, `?sortOrder=asc|desc`
and return `{ items, total, page, limit, pageCount }`.

## Health

| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | Database + SMTP reachability |
| GET | `/health/live` | Liveness only |

## Contact lists

| Method | Path | Description |
| --- | --- | --- |
| GET | `/lists` | Paginated lists, each with a member count |
| GET | `/lists/:id` | One list |
| POST | `/lists` | `{ name, description? }` |
| PATCH | `/lists/:id` | Partial update |
| DELETE | `/lists/:id` | Delete (memberships cascade) |

## Contacts

| Method | Path | Description |
| --- | --- | --- |
| GET | `/contacts` | Paginated; filter with `?status=` and `?listId=` |
| GET | `/contacts/:id` | One contact |
| POST | `/contacts` | `{ email, firstName?, lastName?, attributes?, listIds? }` |
| PATCH | `/contacts/:id` | Partial update; passing `listIds` replaces membership |
| POST | `/contacts/:id/unsubscribe` | Sets status to `UNSUBSCRIBED` |
| DELETE | `/contacts/:id` | Delete |

`attributes` is free-form JSON, reachable from templates as `{{attributes.key}}`.

## Templates

| Method | Path | Description |
| --- | --- | --- |
| GET | `/templates` | Paginated |
| GET | `/templates/:id` | One template |
| POST | `/templates` | `{ name, subject, html, text? }` |
| PATCH | `/templates/:id` | Partial update |
| POST | `/templates/:id/preview` | `{ sample? }` → rendered subject/html/text |
| DELETE | `/templates/:id` | Delete |

Merge tags use `{{ }}` (Handlebars). Available per recipient: `email`,
`firstName`, `lastName`, and anything under `attributes.*`. Tags are detected on
save and stored on `variables`; the preview response also reports
`missingVariables` so unresolved tags are visible before a send.

## Campaigns

| Method | Path | Description |
| --- | --- | --- |
| GET | `/campaigns` | Paginated; filter with `?status=` |
| GET | `/campaigns/:id` | One campaign, with template and list ids |
| GET | `/campaigns/:id/stats` | `{ recipients, sent, failed, pending }` |
| POST | `/campaigns` | `{ name, templateId, listIds, fromName, fromEmail, replyTo? }` |
| PATCH | `/campaigns/:id` | Partial update — only while `DRAFT` |
| POST | `/campaigns/:id/send` | Send to every subscribed contact in the lists |
| POST | `/campaigns/:id/test` | `{ emails: string[] }` — up to 10, no message rows written |
| DELETE | `/campaigns/:id` | Delete — only while `DRAFT` |

Campaign status: `DRAFT → SENDING → SENT`, or `FAILED` if the run itself breaks.
Per-recipient failures do not fail the campaign; they land on the message row and
are visible through `/campaigns/:id/stats`.

## Errors

Failures return the Nest shape plus request context:

```json
{
  "statusCode": 400,
  "message": ["email must be an email"],
  "error": "Bad Request",
  "path": "/api/contacts",
  "timestamp": "2026-09-08T12:00:00.000Z"
}
```
