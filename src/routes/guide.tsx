import { createFileRoute } from "@tanstack/react-router";
import { DocPage, Step } from "@/components/doc-page";

export const Route = createFileRoute("/guide")({
  head: () => ({
    meta: [
      { title: "User guide — Cadence" },
      { name: "description", content: "Step-by-step guide to running cascade communications in Cadence, for admins and managers." },
      { property: "og:title", content: "Cadence user guide" },
      { property: "og:description", content: "Set up your organization, send cascades, share with teams and read the feedback." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Guide,
});

function Guide() {
  return (
    <DocPage title="User guide" intro="Everything you need to run a cascade, from first sign-in to reading your teams' feedback.">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-secondary">For admins</h2>
      <Step n={1} title="Create your account and organization">
        <p>Go to <strong>Sign in</strong> and create an account with your email or Google. The first time you sign in you'll be asked to name your organization. You become its <strong>Owner</strong>.</p>
      </Step>
      <Step n={2} title="Set up your settings">
        <p>Open <strong>Settings</strong> to rename the organization and choose how many days before a deadline managers get a reminder (2 by default).</p>
      </Step>
      <Step n={3} title="Add your people">
        <p>Open <strong>People</strong>. Either click <strong>Add person</strong>, or click <strong>Import</strong> and upload a CSV or Excel file with the columns <em>name, email, title, department, manager email</em>. Download the template if you need a starting point.</p>
        <p>You'll see a preview with any problems highlighted (missing email, duplicates, unknown manager). Fix them, then confirm. Anyone listed as another person's manager becomes a <strong>Manager</strong> automatically.</p>
        <p>Roles: <strong>Owner/Admin</strong> send cascades and see all progress. <strong>Manager</strong> receives cascades, shares them and sends feedback. <strong>Member</strong> can read.</p>
      </Step>
      <Step n={4} title="Write a cascade">
        <p>Go to <strong>Cascades → New cascade</strong>. Add a title, the main message, talking points, any attachments, and a <strong>share-by date</strong>.</p>
        <p>Use <strong>Plain-language rewrite</strong> to simplify the message, and <strong>Draft talking points</strong> to have AI suggest bullet points you can edit.</p>
        <p>Choose the audience: <strong>all managers</strong> or <strong>specific departments</strong>. Then <strong>Save draft</strong> or <strong>Send</strong>.</p>
      </Step>
      <Step n={5} title="Track progress">
        <p>Open the cascade to see how many managers have acknowledged it, shared it and replied, overall and by department. Late managers are flagged in red.</p>
        <p>Click <strong>Nudge</strong> next to one manager, or <strong>Nudge all pending</strong>, to send a reminder.</p>
      </Step>
      <Step n={6} title="Read the feedback">
        <p>The <strong>Feedback</strong> tab lists every team's reply. Click <strong>Summarize with AI</strong> to get the main themes, concerns and open questions in one place.</p>
      </Step>
      <Step n={7} title="Look back">
        <p>The <strong>Dashboard</strong> shows active cascades and completion over time. The <strong>Cascades</strong> list lets you search everything you've sent.</p>
      </Step>

      <h2 className="pt-4 text-sm font-semibold uppercase tracking-wide text-secondary">For managers</h2>
      <Step n={1} title="Join">
        <p>When you're invited, sign up with the <strong>same email address</strong> the invite went to. You'll join your organization automatically.</p>
      </Step>
      <Step n={2} title="Open your inbox">
        <p>Go to <strong>Inbox</strong>. New cascades appear under <strong>Open</strong> with their share-by date. Click <strong>Got it</strong> to let the sender know you've read it.</p>
      </Step>
      <Step n={3} title="Share it with your team">
        <p>After you've passed it on, click <strong>Shared with my team</strong> and pick how: meeting, email, huddle or other.</p>
      </Step>
      <Step n={4} title="Send back feedback">
        <p>Write your team's reactions and questions and click <strong>Send feedback</strong>. The cascade then moves to <strong>Done</strong>.</p>
      </Step>

      <h2 className="pt-4 text-sm font-semibold uppercase tracking-wide text-secondary">Install on your device</h2>
      <Step n="📱" title="Add Cadence to your home screen">
        <p><strong>iPhone/iPad (Safari):</strong> tap the Share button, then <strong>Add to Home Screen</strong>.</p>
        <p><strong>Android (Chrome):</strong> tap the ⋮ menu, then <strong>Install app</strong>.</p>
        <p><strong>Computer (Chrome or Edge):</strong> click the install icon at the right of the address bar.</p>
        <p>Cadence then opens in its own window like a regular app. You still need an internet connection to send or receive cascades.</p>
      </Step>
    </DocPage>
  );
}
