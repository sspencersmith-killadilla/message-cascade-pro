import * as React from 'react'
import { Text } from '@react-email/components'
import { EmailShell, P, BRAND } from './layout'

interface ReauthenticationEmailProps { token: string }

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <EmailShell preview="Your Cadence verification code" heading="Your verification code"
    footnote="This code expires shortly. If you didn't request it, you can ignore this email.">
    <P>Enter this code to confirm it's you:</P>
    <Text style={{ fontFamily: 'Courier, monospace', fontSize: 30, fontWeight: 700, letterSpacing: 6, color: BRAND.teal, backgroundColor: BRAND.soft, borderRadius: 8, padding: '14px 0', textAlign: 'center', margin: '0 0 16px' }}>{token}</Text>
  </EmailShell>
)
export default ReauthenticationEmail
