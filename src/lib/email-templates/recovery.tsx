import * as React from 'react'
import { EmailShell, P, Cta } from './layout'

interface RecoveryEmailProps { siteName: string; confirmationUrl: string }

export const RecoveryEmail = ({ confirmationUrl }: RecoveryEmailProps) => (
  <EmailShell preview="Reset your Cadence password" heading="Reset your password"
    footnote="This link expires in one hour. If you didn't ask to reset your password, you can ignore this email — your password won't change.">
    <P>We received a request to reset the password for your Cadence account. Choose a new one using the button below.</P>
    <Cta href={confirmationUrl} label="Choose a new password" />
  </EmailShell>
)
export default RecoveryEmail
