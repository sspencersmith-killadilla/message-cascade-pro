import { createFileRoute } from "@tanstack/react-router";
import { DocPage, Step, Code } from "@/components/doc-page";

export const Route = createFileRoute("/self-host")({
  head: () => ({
    meta: [
      { title: "Self-hosting guide — Cadence" },
      { name: "description", content: "Download Cadence and run it on your own private network, without Lovable, as an installable app." },
      { property: "og:title", content: "Run Cadence on your own network" },
      { property: "og:description", content: "Step-by-step instructions to self-host the open-source Cadence cascade tool." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SelfHost,
});

function SelfHost() {
  return (
    <DocPage
      title="Self-hosting guide"
      intro="Run your own private copy of Cadence on a server inside your network. This is written for an IT person comfortable with a terminal and Docker."
    >
      <Step n={0} title="What you'll run">
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Supabase (self-hosted)</strong> — database, sign-in and file storage, run with Docker.</li>
          <li><strong>The Cadence web app</strong> — a Node.js server.</li>
          <li><strong>A reverse proxy</strong> (Caddy or Nginx) with HTTPS. HTTPS is required for sign-in cookies and for installing it as an app.</li>
          <li>Optional: an <strong>OpenAI-compatible AI service</strong> for summaries, and an <strong>SMTP server</strong> for email.</li>
        </ul>
        <p>Minimum server: 2 CPU, 4 GB RAM, 20 GB disk, Ubuntu 22.04+ or similar, with Docker, Docker Compose, Git and Node.js 20+ (or Bun).</p>
      </Step>

      <Step n={1} title="Download the code">
        <p>In Lovable, connect the project to GitHub (Project → GitHub → Connect), then clone it on your server. Or download a ZIP from GitHub.</p>
        <Code>{`git clone https://github.com/<your-org>/cadence.git
cd cadence
npm install`}</Code>
      </Step>

      <Step n={2} title="Start Supabase">
        <Code>{`git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker
cp .env.example .env
# Edit .env: set POSTGRES_PASSWORD, JWT_SECRET, ANON_KEY,
# SERVICE_ROLE_KEY, DASHBOARD_PASSWORD, SITE_URL=https://cadence.yourdomain.local
# and API_EXTERNAL_URL=https://supabase.yourdomain.local
docker compose up -d`}</Code>
        <p>Generate the JWT secret and keys with the tool in the Supabase self-hosting docs (supabase.com/docs/guides/self-hosting/docker). Keep the service role key secret.</p>
      </Step>

      <Step n={3} title="Create the database">
        <p>Run Cadence's schema files, in order, against the Supabase database. They create the tables, security rules, sign-up trigger and the private <em>attachments</em> storage bucket.</p>
        <Code>{`cd ~/cadence
export DB="postgres://postgres:<POSTGRES_PASSWORD>@localhost:5432/postgres"
psql "$DB" -f drizzle/migrations/0000_cadence_core_schema.sql
psql "$DB" -f drizzle/migrations/0001_enable_scheduling_extensions.sql`}</Code>
      </Step>

      <Step n={4} title="Remove the Lovable-only pieces">
        <p>Three small code changes make the app fully independent:</p>
        <p><strong>a. Google sign-in.</strong> In <code>src/routes/login.tsx</code>, replace the <code>lovable.auth.signInWithOAuth(...)</code> call with:</p>
        <Code>{`await supabase.auth.signInWithOAuth({
  provider: "google",
  options: { redirectTo: window.location.origin + "/login" },
});`}</Code>
        <p>Then add your Google client ID/secret to Supabase's <code>.env</code> (<code>GOTRUE_EXTERNAL_GOOGLE_*</code>). Or simply remove the Google button and use email sign-in only.</p>
        <p><strong>b. AI.</strong> In <code>src/lib/ai.server.ts</code>, change <code>baseURL</code> to your provider (e.g. <code>https://api.openai.com/v1</code>, or a local Ollama/vLLM server at <code>http://ollama:11434/v1</code>), read the key from <code>AI_API_KEY</code>, drop the Lovable headers, and set <code>MODEL</code> to a model you have. Without AI configured, everything else still works; only the AI buttons show an error.</p>
        <p><strong>c. Build target.</strong> In <code>vite.config.ts</code>, build for Node instead of Cloudflare by setting the Nitro preset to <code>node-server</code> (or set <code>NITRO_PRESET=node-server</code> when building). Also update <code>appUrl()</code> in <code>src/lib/email.server.ts</code> to your own address.</p>
      </Step>

      <Step n={5} title="Configure and build">
        <p>Create <code>.env</code> in the Cadence folder:</p>
        <Code>{`VITE_SUPABASE_URL=https://supabase.yourdomain.local
VITE_SUPABASE_PUBLISHABLE_KEY=<ANON_KEY>
SUPABASE_URL=http://localhost:8000
SUPABASE_PUBLISHABLE_KEY=<ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY>
LOVABLE_CRON_SECRET=<any long random string>
AI_API_KEY=<optional>`}</Code>
        <Code>{`NITRO_PRESET=node-server npm run build
node .output/server/index.mjs   # listens on port 3000`}</Code>
        <p>Run it permanently with systemd, pm2, or a Docker container.</p>
      </Step>

      <Step n={6} title="Add HTTPS with a reverse proxy">
        <p>Example <code>Caddyfile</code> (use <code>tls internal</code> or your company certificate on a private network; devices must trust that certificate):</p>
        <Code>{`cadence.yourdomain.local {
  tls internal
  reverse_proxy localhost:3000
}
supabase.yourdomain.local {
  tls internal
  reverse_proxy localhost:8000
}`}</Code>
        <p>Point both names at the server in your internal DNS.</p>
      </Step>

      <Step n={7} title="Daily reminders">
        <p>Schedule the reminder check once a day. Either with pg_cron inside the database, or a plain cron job on the server:</p>
        <Code>{`0 13 * * * curl -s -X POST https://cadence.yourdomain.local/api/public/hooks/cadence-reminders \\
  -H "Authorization: Bearer <LOVABLE_CRON_SECRET>"`}</Code>
      </Step>

      <Step n={8} title="Email">
        <p>Supabase sends sign-up and password emails through the SMTP settings in its <code>.env</code> (<code>SMTP_HOST</code>, <code>SMTP_USER</code>, ...). Cadence's own notices are recorded in the <em>email_log</em> table by <code>queueEmails</code> in <code>src/lib/email.server.ts</code>; add a call to your SMTP server or mail service there to deliver them.</p>
      </Step>

      <Step n={9} title="Install it as an app (PWA)">
        <p>Cadence already includes an app manifest, icons and an offline-friendly service worker. Once it's served over HTTPS, people can install it:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>iPhone/iPad:</strong> Safari → Share → Add to Home Screen.</li>
          <li><strong>Android:</strong> Chrome → ⋮ → Install app.</li>
          <li><strong>Windows/Mac:</strong> Chrome or Edge → install icon in the address bar. IT can also push it to managed devices with Edge/Chrome policy (<code>WebAppInstallForceList</code>).</li>
        </ul>
        <p>To change the app name or colors, edit <code>public/manifest.webmanifest</code>. After an update, bump the cache name in <code>public/sw.js</code> so devices pick up the new version.</p>
      </Step>

      <Step n={10} title="First sign-in and upkeep">
        <p>Open your address, create the first account and organization, then follow the <a className="text-primary underline" href="/guide">user guide</a>. Back up the database regularly (<code>pg_dump</code>), and update by pulling new code, rebuilding and restarting.</p>
      </Step>
    </DocPage>
  );
}
