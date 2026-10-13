import * as React from 'react'
import { EmailShell, P, Cta } from './layout'

interface InviteEmailProps { siteName: string; siteUrl: string; confirmationUrl: string }

export const InviteEmail = ({ confirmationUrl }: InviteEmailProps) => (
  <EmailShell preview="You've been invited to join your organization on Cadence" heading="You're invited to Cadence"
    footnote="If you weren't expecting this invitation, you can safely ignore this email.">
    <P>Your organization uses Cadence to share important updates with every team. Accept the invitation to create your account.</P>
    <Cta href={confirmationUrl} label="Accept invitation" />
  </EmailShell>
)
export default InviteEmail
