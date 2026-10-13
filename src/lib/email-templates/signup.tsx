import * as React from 'react'
import { EmailShell, P, Cta } from './layout'

interface SignupEmailProps { siteName: string; siteUrl: string; recipient: string; confirmationUrl: string }

export const SignupEmail = ({ recipient, confirmationUrl }: SignupEmailProps) => (
  <EmailShell preview="Confirm your email to finish setting up Cadence" heading="Confirm your email"
    footnote="If you didn't create a Cadence account, you can safely ignore this email.">
    <P>Welcome to Cadence. Please confirm that <strong>{recipient}</strong> is your email address to finish setting up your account.</P>
    <Cta href={confirmationUrl} label="Verify my email" />
  </EmailShell>
)
export default SignupEmail
