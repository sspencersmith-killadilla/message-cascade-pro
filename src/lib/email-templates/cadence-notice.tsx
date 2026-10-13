import * as React from "react";
import { EmailShell, P, Cta } from "./layout";
import type { TemplateEntry } from "./registry";

interface Props { heading?: string; body?: string; ctaUrl?: string; ctaLabel?: string }

function CadenceNotice({ heading = "Update from Cadence", body = "", ctaUrl, ctaLabel = "Open Cadence" }: Props) {
  return (
    <EmailShell preview={heading} heading={heading}
      footnote="You're receiving this because your organization uses Cadence to share updates with teams.">
      {body.split(/\n+/).filter(Boolean).map((p, i) => <P key={i}>{p}</P>)}
      {ctaUrl && <Cta href={ctaUrl} label={ctaLabel} />}
    </EmailShell>
  );
}

export const template = {
  component: CadenceNotice,
  subject: (d: Record<string, any>) => d["subject"] ?? "Update from Cadence",
  displayName: "Cadence notice",
  previewData: {
    subject: "Please share: New hybrid work policy",
    heading: "Please share: New hybrid work policy",
    body: "Hi Maria, please share \"New hybrid work policy\" with your team by 2026-10-17.",
    ctaUrl: "https://cadence.civicplexus.org/app/inbox",
    ctaLabel: "Open my inbox",
  },
} satisfies TemplateEntry;
