import * as React from 'react'
import { EmailShell, P, Cta } from './layout'

interface MagicLinkEmailProps { siteName: string; confirmationUrl: string }

export const MagicLinkEmail = ({ confirmationUrl }: MagicLinkEmailProps) => (
  <EmailShell preview="Your Cadence sign-in link" heading="Sign in to Cadence"
    footnote="This link expires shortly and can only be used once. If you didn't request it, ignore this email.">
    <P>Use the button below to sign in securely — no password needed.</P>
    <Cta href={confirmationUrl} label="Sign in" />
  </EmailShell>
)
export default MagicLinkEmail
