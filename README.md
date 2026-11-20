# Cadence

**Cascade communications for organizations that need to know their message landed.**

Cadence lets an admin write one message, send it to every department manager at
once, and then see exactly who shared it, when, how, and what their teams said
back. It is a standalone tool — one private organization per workspace, many
organizations per copy — and it is free and open source under the MIT license.

- **Live app**: https://cadence.civicplexus.org
- **Hosted preview**: https://message-cascade-pro.lovable.app
- **In-app guide**: https://cadence.civicplexus.org/guide
- **Self-hosting instructions**: https://cadence.civicplexus.org/self-host
- **Hands-on demo** (no account, nothing saved): https://cadence.civicplexus.org/demo

## What it does

| Area | What you get |
| --- | --- |
| Cascades | Compose once, send straight to all managers or chosen departments, with a share-by date, attachments, and AI-drafted talking points. |
| Manager inbox | Each manager marks "Got it", records how they shared it, and sends feedback up. Admins can also lead a team and appear in the inbox. |
| Tracking | Per-cascade progress, per-department completion, overdue flags, and a dashboard of what still needs attention. |
| Reminders | Daily reminder and overdue checks run from the database scheduler; nudges go out on demand. |
| People | Add people by hand or upload an org-chart spreadsheet; invites go out by email and are claimed on sign-up. |
| Feedback summaries | AI reads the submitted feedback and returns themes, concerns, and open questions without naming individuals. |
| Records | One-click export of every record to a spreadsheet; only admins and the owner can delete, and every deletion is kept permanently in an audit log for open-records requests. |
| Accounts | Email sign-up with confirmation, password reset, magic links, Google sign-in, and password change. |
| Install | Progressive web app — installable on desktop and mobile, works offline for the shell. |

## Tech stack

- [TanStack Start](https://tanstack.com/start) v1 (React 19, Vite 7, SSR/SSG, server functions)
- [TanStack Router](https://tanstack.com/router) for routing, [TanStack Query](https://tanstack.com/query) for data
- Postgres with row-level security (hosted through Lovable Cloud, or self-hosted Supabase)
- [Tailwind CSS](https://tailwindcss.com) v4, shadcn/ui components
- [React Email](https://react.email) templates for all outgoing notices
- Vitest for tests, ESLint + Prettier

## Getting started

You need Node.js 20+ (or Bun) and a Postgres database with row-level security.

```sh
git clone <this-repository-url>
cd cadence
npm install
npm run dev
```

Then:

1. Create a database and apply the migrations in `drizzle/migrations` **in
   order** — `0000_cadence_core_schema.sql`,
   `0001_enable_scheduling_extensions.sql`, `0002_admins_lead_teams.sql`,
   `0003_audit_deletions.sql`. They create the tables, the security rules, the
   sign-up trigger, and the private attachments bucket.
2. Copy the values from `.env` and point them at your database
   (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and the server-side
   `SUPABASE_*` keys).
3. `npm run dev` and open http://localhost:8080.

For a private network with no hosted services, follow
[/self-host](https://cadence.civicplexus.org/self-host): Docker Compose
Supabase, the two required code changes, HTTPS, the scheduler, email, and
backups.

## Project layout

```text
src/
  routes/            pages: app (dashboard, cascades, inbox, people, settings),
                     login, reset-password, demo, guide, self-host, terms, privacy
  routes/api/public/ public server routes, including the daily reminder hook
  lib/cadence.ts     pure business rules (overdue, reminders, completion, import checks)
  lib/cascades.functions.ts   privileged server functions (send, nudge, import, AI)
  lib/email.server.ts         single queue for every outgoing notice
  lib/email-templates/        branded HTML for each notice
  hooks/             auth, organization, and local-draft hooks
drizzle/migrations/  the schema, in order
public/              PWA manifest, service worker, icons
```

## Conventions worth knowing

- Every app table carries `org_id`; access is decided by the `is_org_member`
  and `is_org_admin` security-definer functions, so one copy serves many
  private organizations.
- Organization roles live in `org_members.role` (owner / admin / manager /
  member), never on profiles. Invites are `org_members` rows with a null
  `user_id`, claimed by email on sign-up.
- Business rules live in `src/lib/cadence.ts` with tests in
  `src/test/cadence-rules.test.ts`, shared by the UI, the server functions, and
  the reminder route.
- Anything privileged (sending, nudging, importing, AI) goes through
  `src/lib/cascades.functions.ts`, which authenticates the caller and checks
  for an admin role first.
- All email goes through `queueEmails` in `src/lib/email.server.ts`, which
  writes to `email_log` and then delivers.

## Scripts

```sh
npm run dev        # local dev server on :8080
npm run build      # production build
npm run preview    # serve the build locally
npm run test       # run the test suite
npm run lint       # ESLint
npm run format     # Prettier
```

## Contributing

Fork the repository, make your change on a branch, and open a pull request.
Keep `src/test/cadence-rules.test.ts` passing, and add a test for any business
rule you introduce. Run `npm run lint` and `npm run format` before pushing.

## License

MIT — see [LICENSE](LICENSE).
