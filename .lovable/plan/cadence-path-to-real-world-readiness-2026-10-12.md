# Cadence: path to real-world readiness

Cadence is functionally complete: auth (email + Google), orgs, people import, cascades, manager inbox, progress tracking, AI summaries, real email delivery, PWA, guides, demo. Security scans are clean. What remains before real organizations use it:

## 1. Finish email go-live (mostly waiting, some user action)
- Domain `notify.cadence.civicplexus.org` has passed DNS verification and is completing setup — confirm it shows "Active" under Cloud → Emails.
- Send a real test cascade to a real inbox and confirm delivery, links, and branding.
- Warm up the new sender: start with small sends for the first 2–4 weeks so email providers build trust.

## 2. Publish and verify the live app
- Publish the app (custom domain cadence.civicplexus.org is already connected).
- After publishing, confirm the first scheduled daily reminder run fires (it only runs on the published app).
- Verify PWA install works on the published URL (install prompts don't appear in the editor preview).

## 3. Real-data check of the admin dashboard
- The dashboard was built but never viewed with real signed-in data. Sign in, seed a realistic org (a few departments, managers, one or two sent cascades), and confirm the numbers, charts, and overdue flags read correctly.

## 4. Pilot with one real organization
- Run a small pilot: one real org, a handful of managers, one real cascade end-to-end (send → share → feedback → AI summary → reminders).
- Collect feedback on wording, email timing, and the manager inbox before wider rollout.

## 5. Operational housekeeping (recommended, not blocking)
- Decide who owns support/admin access to the backend.
- Review terms/privacy pages with your legal context before onboarding external orgs.
- Optional: set a reply-to address and sender name in email settings.

## Technical details
- Email: Lovable-managed domain, NS already delegated; no DNS action left for the user.
- Cron: `cadence-daily-reminders` scheduled at 13:00 UTC, guarded by a secret; first live run happens after publish.
- No code changes are required for items 1–4 except any fixes the real-data check surfaces.
