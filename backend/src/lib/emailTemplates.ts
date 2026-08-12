const BRAND = {
  primary: '#5B3FD6',
  primaryLight: '#8B5CF6',
  accent: '#F472B6',
  bg: '#F8F7FF',
  text: '#1D1B22',
  textLight: '#64607A',
  white: '#FFFFFF',
  border: '#E4E0F5',
} as const;

function wrapper(children: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:40px 20px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
${children}
</table>
</td></tr></table>
</body></html>`;
}

function header(): string {
  return `<tr><td style="height:4px;background:linear-gradient(90deg,${BRAND.primary},${BRAND.primaryLight},${BRAND.accent});border-radius:12px 12px 0 0;"></td></tr>`;
}

function footer(): string {
  return `
<tr><td style="padding:24px 40px 32px;text-align:center;">
<p style="margin:0 0 4px;font-size:13px;font-weight:600;color:${BRAND.primary};">Meetiva.ai</p>
<p style="margin:0;font-size:11px;color:${BRAND.textLight};">Smart meeting summaries &middot; Action tracking &middot; Team accountability</p>
</td></tr>
<tr><td style="height:4px;background:linear-gradient(90deg,${BRAND.accent},${BRAND.primaryLight},${BRAND.primary});border-radius:0 0 12px 12px;"></td></tr>`;
}

export function verificationOtp(otp: string): { subject: string; text: string; html: string } {
  return {
    subject: 'Verify your Meetiva.ai email',
    text: `Your verification code is: ${otp}\n\nThis code expires in 5 minutes.\nDidn't request this? You can safely ignore this email.`,
    html: wrapper(`
${header()}
<tr><td style="padding:48px 40px 0;text-align:center;">
<div style="width:56px;height:56px;margin:0 auto 24px;background:linear-gradient(135deg,${BRAND.primary},${BRAND.primaryLight});border-radius:16px;line-height:56px;font-size:24px;">&#128274;</div>
<h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:${BRAND.text};">Verify your email</h1>
<p style="margin:0 0 32px;font-size:15px;color:${BRAND.textLight};">Use the code below to confirm your email address.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
<tr>
${otp.split('').map((d, i) => `<td style="width:48px;height:56px;border:2px solid ${BRAND.border};${i === 0 ? 'border-radius:12px 0 0 12px;' : ''}${i === otp.length - 1 ? 'border-radius:0 12px 12px 0;' : ''}background:${BRAND.white};font-size:24px;font-weight:700;color:${BRAND.primary};text-align:center;letter-spacing:0;">${d}</td>${i < otp.length - 1 ? `<td style="width:8px;"></td>` : ''}`).join('\n')}
</tr>
</table>
<p style="margin:32px 0 0;font-size:13px;color:${BRAND.textLight};">This code expires in <strong>5 minutes</strong>.</p>
<p style="margin:8px 0 0;font-size:13px;color:${BRAND.textLight};">Didn't request this? You can safely ignore this email.</p>
</td></tr>
${footer()}
`),
  };
}

export function passwordReset(resetLink: string): { subject: string; text: string; html: string } {
  return {
    subject: 'Reset your Meetiva.ai password',
    text: `You requested a password reset.\n\nClick this link to reset your password: ${resetLink}\n\nThis link expires in 1 hour.\nDidn't request this? You can safely ignore this email.`,
    html: wrapper(`
${header()}
<tr><td style="padding:48px 40px 0;text-align:center;">
<div style="width:56px;height:56px;margin:0 auto 24px;background:linear-gradient(135deg,${BRAND.primary},${BRAND.primaryLight});border-radius:16px;line-height:56px;font-size:24px;">&#128273;</div>
<h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:${BRAND.text};">Reset your password</h1>
<p style="margin:0 0 32px;font-size:15px;color:${BRAND.textLight};">Click the button below to set a new password.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr><td>
<a href="${resetLink}" style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,${BRAND.primary},${BRAND.primaryLight});color:${BRAND.white};font-size:15px;font-weight:600;text-decoration:none;border-radius:12px;">Reset Password</a>
</td></tr></table>
<p style="margin:32px 0 0;font-size:13px;color:${BRAND.textLight};">This link expires in <strong>1 hour</strong>.</p>
<p style="margin:8px 0 0;font-size:13px;color:${BRAND.textLight};">Didn't request this? You can safely ignore this email.</p>
</td></tr>
${footer()}
`),
  };
}

export function passwordChanged(userName: string): { subject: string; text: string; html: string } {
  return {
    subject: 'Your Meetiva.ai password was changed',
    text: `Hi ${userName},\n\nYour password was just changed.\n\nIf you did not make this change, please contact support immediately.`,
    html: wrapper(`
${header()}
<tr><td style="padding:48px 40px 0;text-align:center;">
<div style="width:56px;height:56px;margin:0 auto 24px;background:linear-gradient(135deg,${BRAND.primary},${BRAND.primaryLight});border-radius:16px;line-height:56px;font-size:24px;">&#9989;</div>
<h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:${BRAND.text};">Password changed</h1>
<p style="margin:0 0 8px;font-size:15px;color:${BRAND.textLight};">Hi ${userName},</p>
<p style="margin:0 0 32px;font-size:15px;color:${BRAND.textLight};">Your password was just changed successfully.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;border:2px solid #FCA5A5;border-radius:12px;"><tr><td style="padding:12px 24px;">
<p style="margin:0;font-size:14px;color:#DC2626;font-weight:600;">Didn't make this change?</p>
<p style="margin:4px 0 0;font-size:13px;color:${BRAND.textLight};">Contact our support team immediately.</p>
</td></tr></table>
</td></tr>
${footer()}
`),
  };
}
