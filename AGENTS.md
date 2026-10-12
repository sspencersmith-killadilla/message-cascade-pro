<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Cadence architecture
- Multi-tenant: every app table carries `org_id`; RLS uses `is_org_member` / `is_org_admin` security-definer functions. Why: one copy serves many private organizations.
- Org roles live in `org_members.role` (owner/admin/manager/member), never on profiles; invites are `org_members` rows with `user_id` null, claimed by email on signup or via `claim_my_invites()`. Why: avoids privilege escalation and a separate invite table.
- Pure business rules (overdue, reminders, completion %, import validation) live in `src/lib/cadence.ts` with tests in `src/test/cadence-rules.test.ts`. Why: shared by UI, server functions and the cron route.
- Privileged/multi-row work (send, nudge, import, AI) goes through `src/lib/cascades.functions.ts` with `requireSupabaseAuth` and an admin check first. Why: browser cannot be trusted to create recipients or queue emails.
- All outgoing email goes through `queueEmails` in `src/lib/email.server.ts` (logs to `email_log`). Why: single place to wire real delivery once a sending domain exists.
- Daily reminders run from pg_cron calling `/api/public/hooks/cadence-reminders`, guarded by `authenticateCronRequest`.
