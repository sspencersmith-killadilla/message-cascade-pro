import * as React from 'react'
import { EmailShell, P, Cta } from './layout'

interface EmailChangeEmailProps { siteName: string; oldEmail: string; email: string; newEmail: string; confirmationUrl: string }

export const EmailChangeEmail = ({ oldEmail, newEmail, confirmationUrl }: EmailChangeEmailProps) => (
  <EmailShell preview="Confirm your new Cadence email address" heading="Confirm your email change"
    footnote="If you didn't request this change, please reset your password right away.">
    <P>You asked to change your Cadence sign-in email from <strong>{oldEmail}</strong> to <strong>{newEmail}</strong>.</P>
    <Cta href={confirmationUrl} label="Confirm change" />
  </EmailShell>
)
export default EmailChangeEmail
