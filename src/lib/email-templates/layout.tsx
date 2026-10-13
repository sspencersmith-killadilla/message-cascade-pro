import * as React from 'react'
import { Body, Button, Container, Head, Hr, Html, Img, Link, Preview, Section, Text } from '@react-email/components'

export const BRAND = {
  teal: '#0f4c5c',
  green: '#1f9d6b',
  ink: '#1e293b',
  muted: '#64748b',
  line: '#e2e8f0',
  soft: '#f1f5f4',
  url: 'https://cadence.civicplexus.org',
  logo: 'https://cadence.civicplexus.org/icon-192.png',
}

const font = "Inter, 'Segoe UI', Helvetica, Arial, sans-serif"
const headFont = "Montserrat, 'Segoe UI', Helvetica, Arial, sans-serif"

// Rendered as a text child: keep free of >, &, and quotes.
const darkCss = `
  @media (prefers-color-scheme: dark) {
    .dm-btn { background-color: #1f9d6b !important; color: #ffffff !important; }
  }
`

export function EmailShell({ preview, heading, children, footnote }: {
  preview: string
  heading: string
  children: React.ReactNode
  footnote?: React.ReactNode
}) {
  return (
    <Html lang="en" dir="ltr">
      <Head><style>{darkCss}</style></Head>
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: '#ffffff', fontFamily: font, margin: 0, padding: '24px 0' }}>
        <Container style={{ maxWidth: 560, margin: '0 auto', border: `1px solid ${BRAND.line}`, borderRadius: 12, overflow: 'hidden' }}>
          <Section style={{ backgroundColor: BRAND.teal, padding: '20px 32px' }}>
            <table role="presentation" cellPadding={0} cellSpacing={0}><tbody><tr>
              <td style={{ verticalAlign: 'middle' }}>
                <Img src={BRAND.logo} width="32" height="32" alt="Cadence" style={{ borderRadius: 8, display: 'block' }} />
              </td>
              <td style={{ verticalAlign: 'middle', paddingLeft: 12 }}>
                <Text style={{ margin: 0, color: '#ffffff', fontFamily: headFont, fontWeight: 700, fontSize: 18, letterSpacing: 0.5 }}>Cadence</Text>
              </td>
            </tr></tbody></table>
          </Section>
          <Section style={{ height: 4, backgroundColor: BRAND.green, lineHeight: '4px', fontSize: 1 }}>&nbsp;</Section>
          <Section style={{ padding: '32px 32px 8px' }}>
            <Text style={{ margin: '0 0 20px', color: BRAND.teal, fontFamily: headFont, fontWeight: 700, fontSize: 24, lineHeight: '32px' }}>{heading}</Text>
            {children}
          </Section>
          <Section style={{ padding: '0 32px 28px' }}>
            <Hr style={{ borderColor: BRAND.line, margin: '24px 0 16px' }} />
            {footnote && <Text style={{ color: BRAND.muted, fontSize: 13, lineHeight: '20px', margin: '0 0 12px' }}>{footnote}</Text>}
            <Text style={{ color: '#94a3b8', fontSize: 12, lineHeight: '18px', margin: 0 }}>
              Cadence — cascade communications for your organization.{' '}
              <Link href={BRAND.url} style={{ color: BRAND.green, textDecoration: 'none' }}>cadence.civicplexus.org</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const P = ({ children }: { children: React.ReactNode }) => (
  <Text style={{ color: BRAND.ink, fontSize: 15, lineHeight: '24px', margin: '0 0 16px' }}>{children}</Text>
)

export function Cta({ href, label }: { href: string; label: string }) {
  return (
    <>
      <Section style={{ margin: '8px 0 20px' }}>
        <Button className="dm-btn" href={href} style={{ backgroundColor: BRAND.teal, color: '#ffffff', padding: '14px 26px', borderRadius: 8, fontWeight: 600, fontSize: 15, textDecoration: 'none' }}>{label}</Button>
      </Section>
      <Text style={{ color: BRAND.muted, fontSize: 12, lineHeight: '18px', margin: '0 0 8px', wordBreak: 'break-all' }}>
        Button not working? Paste this link into your browser:<br />
        <Link href={href} style={{ color: BRAND.green }}>{href}</Link>
      </Text>
    </>
  )
}

export const strong = { color: BRAND.teal }
