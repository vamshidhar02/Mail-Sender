# Dashboard

React 18 + Vite, Ant Design 5 for components, Tailwind v4 for layout, RTK Query
for data.

## Structure

```
src/
├── main.tsx                 Provider + ConfigProvider + RouterProvider
├── app/
│   ├── store.ts             configureStore, RTK Query middleware
│   ├── hooks.ts             typed useAppDispatch / useAppSelector
│   ├── routes.ts            every path in one object
│   └── router.tsx           route table
├── services/api/
│   ├── baseApi.ts           createApi; no domain knowledge
│   ├── campaignsApi.ts      endpoints injected per feature
│   ├── contactsApi.ts
│   └── templatesApi.ts
├── components/
│   ├── layout/              AppLayout, AppSider, AppHeader
│   └── common/              PageHeader, QueryState, StatusTag, ErrorBoundary
├── features/
│   ├── dashboard/  campaigns/  contacts/  templates/
│   └── ui/uiSlice.ts        sidebar collapse
├── lib/apiError.ts          pulls a message out of an RTK Query error
└── theme/antdTheme.ts       AntD design tokens
```

## Decisions worth knowing

**Types come from `@mailer/shared`.** No response interfaces are declared in the
web app — `Paginated<Campaign>`, `CreateContactRequest` and friends are the same
declarations the API implements, so a contract change breaks the build instead
of surfacing as a runtime surprise.

**Vite resolves `@mailer/shared` to its TypeScript source**, not its CommonJS
build (see the alias in `vite.config.ts`). Rollup cannot trace enum runtime
exports through CJS, so a production build fails otherwise. `tsconfig.app.json`
includes the same source, so type-checking and bundling agree on one copy of the
code.

**Tailwind is loaded without preflight.** `styles/index.css` imports only
`tailwindcss/theme.css` and `tailwindcss/utilities.css`. Preflight's element
resets fight Ant Design's baseline — buttons in particular render unstyled.
Tailwind is used for layout, AntD for components.

**Endpoints are injected, not centralised.** `baseApi` declares only the tag
types; each feature file calls `injectEndpoints`. Adding a resource touches one
new file.

**Cache invalidation is tag-based.** Lists provide a `LIST` tag plus per-id tags;
mutations invalidate what they actually change. Sending a campaign invalidates
that campaign, the campaign list, and its stats, so the counters refresh without
a manual refetch.

**`QueryState` wraps loading and error handling** so pages do not each reinvent a
spinner and an alert.

## Verified

`typecheck`, `lint` and a production `build` all pass, and every module was
confirmed to transform and resolve through the dev server. The rendered UI has
not been checked in a browser — open <http://localhost:5173> after `pnpm dev`.
