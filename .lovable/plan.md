# Cadence — standalone cascade communications tool

A separate app, built from the CivicPlexus cascade feature and styled like Tandem: same deep teal and green colors, Montserrat headings, Inter body text, and the same clean, open-source feel.

## What it does

1. **Organizations** — anyone can sign up and create a private organization, then invite people. Roles: Owner/Admin (sends cascades), Manager (passes them on to their team and replies), Member (reads).
2. **Org chart import** — upload a spreadsheet (name, email, title, department, manager email). Shows a preview and lets you fix problems before importing, then sends invites. People can also be added or edited one at a time.
3. **Create a cascade** — title, the main message, talking points, attachments, deadline, and who gets it (all managers, or chosen departments). Save as draft or send.
4. **Manager inbox** — each manager sees new cascades, marks "Shared with my team" (with date and how it was shared: meeting, email, huddle), and sends team feedback and questions.
5. **Progress tracking** — for each cascade: % acknowledged, % shared, % replied, broken down by department, plus lists of overdue managers and a "Nudge" button.
6. **Email notices** — emails when a cascade goes out, a reminder before the deadline, an overdue notice, and an admin alert when the deadline passes.
7. **AI help** — summarize feedback into themes, concerns, and open questions; draft talking points from the main message; suggest plain-language rewrites.
8. **Dashboard and archive** — active cascades, completion rates over time, search past cascades.
9. **Public pages** — landing page, a no-sign-in demo with sample data, terms, and privacy, matching Tandem's.

## Pages

```text
/                     landing
/demo                 sample organization, read-only
/login, /signup, /onboarding (create or join organization)
/app                  dashboard
/app/cascades         list + new
/app/cascades/:id     detail: message, progress, feedback, AI summary
/app/inbox            manager inbox
/app/people           people, import, invites
/app/settings         organization, branding, reminder timing
```

## Technical details

- Lovable Cloud for sign-in, database, file storage, and email.
- Tables: organizations, org_members (role, manager_id, department), invites, cascades (adds status, audience, talking_points, reminder settings to the CivicPlexus version), cascade_recipients (one row per manager: delivered, acknowledged, shared_at, method), cascade_responses, cascade_attachments, email_log, audit_log.
- Every table limited to the user's organization; roles kept in a separate table and checked with a secure function (not on profiles).
- Server functions for sending (creates recipient rows and queues emails), the spreadsheet import, nudges, and AI calls; a scheduled job sends reminders and overdue notices.
- AI through Lovable AI with the default model, streamed, summaries saved on the cascade.
- Email needs a sending domain set up in a dialog during the build.
- Tandem's theme and fonts copied over; new Cadence logo generated.
- Tests for the rules: only admins can send, managers see only their own cascades, overdue = deadline passed and not shared, completion percentages.
