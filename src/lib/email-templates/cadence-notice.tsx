import * as React from "react";
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface Props {
  heading?: string;
  body?: string;
  ctaUrl?: string;
  ctaLabel?: string;
}

const teal = "#0f4c5c";
const green = "#1f9d6b";

function CadenceNotice({ heading = "Update from Cadence", body = "", ctaUrl, ctaLabel = "Open Cadence" }: Props) {
  return (
    <Html>
      <Head />
      <Preview>{heading}</Preview>
      <Body style={{ backgroundColor: "#ffffff", fontFamily: "Inter, Arial, sans-serif", margin: 0 }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", padding: "32px 24px" }}>
          <Text style={{ color: green, fontWeight: 700, fontSize: 14, letterSpacing: 1, margin: 0 }}>CADENCE</Text>
          <Heading style={{ color: teal, fontFamily: "Montserrat, Arial, sans-serif", fontSize: 22, margin: "12px 0 16px" }}>{heading}</Heading>
          {body.split(/\n+/).filter(Boolean).map((p, i) => (
            <Text key={i} style={{ color: "#334155", fontSize: 15, lineHeight: "24px", margin: "0 0 12px" }}>{p}</Text>
          ))}
          {ctaUrl && (
            <Section style={{ margin: "24px 0" }}>
              <Button href={ctaUrl} style={{ backgroundColor: teal, color: "#ffffff", padding: "12px 20px", borderRadius: 8, fontWeight: 600, fontSize: 14 }}>{ctaLabel}</Button>
            </Section>
          )}
          <Text style={{ color: "#94a3b8", fontSize: 12, marginTop: 32 }}>Sent by Cadence, the cascade communications tool for your organization.</Text>
        </Container>
      </Body>
    </Html>
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
