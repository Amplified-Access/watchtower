const BASE_STYLES = {
  primary: "#006fac",
  dark: "#113356",
  background: "#f4f4f4",
  white: "#ffffff",
  textBody: "#444444",
  textMuted: "#888888",
  textFaint: "#aaaaaa",
  border: "#eeeeee",
} as const;

function emailShell(headerTitle: string, body: string): string {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>${headerTitle}</title>
</head>
<body style="margin:0;padding:0;background-color:${BASE_STYLES.background};font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${BASE_STYLES.background};padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Header -->
          <tr>
            <td style="background-color:${BASE_STYLES.dark};border-radius:8px 8px 0 0;padding:28px 40px;">
              <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${BASE_STYLES.primary};">Amplified Access</p>
              <h1 style="margin:6px 0 0;font-size:22px;font-weight:700;color:${BASE_STYLES.white};letter-spacing:-0.3px;">The WatchTower</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:${BASE_STYLES.white};padding:40px;">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:${BASE_STYLES.background};border-top:1px solid ${BASE_STYLES.border};padding:20px 40px;border-radius:0 0 8px 8px;">
              <p style="margin:0;font-size:12px;color:${BASE_STYLES.textFaint};text-align:center;">
                &copy; ${year} Amplified Access &middot; The WatchTower
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(url: string, label: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
  <tr>
    <td style="background-color:${BASE_STYLES.primary};border-radius:6px;">
      <a href="${url}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:${BASE_STYLES.white};text-decoration:none;">${label}</a>
    </td>
  </tr>
</table>`;
}

function urlFallback(url: string): string {
  return `<p style="margin:0 0 8px;font-size:13px;color:${BASE_STYLES.textMuted};">Or copy this link into your browser:</p>
<p style="margin:0 0 28px;font-size:12px;color:${BASE_STYLES.primary};word-break:break-all;">${url}</p>`;
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid ${BASE_STYLES.border};margin:0 0 20px;" />`;
}

function footnote(text: string): string {
  return `<p style="margin:0;font-size:12px;line-height:1.6;color:${BASE_STYLES.textFaint};">${text}</p>`;
}

// ── Templates ───────────────────────────────────────────────────────────────

export function inviteEmail(url: string): { subject: string; text: string; html: string } {
  const subject = "You've been invited to The WatchTower";
  const text = `You've been invited to The WatchTower by Amplified Access.\n\nClick the link below to set your password and activate your account:\n\n${url}\n\nThis link expires in 1 hour. If you didn't expect this email, you can safely ignore it.`;
  const html = emailShell(
    "You've been invited",
    `<h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:${BASE_STYLES.dark};">You've been invited</h2>
<p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:${BASE_STYLES.textBody};">
  An administrator has added you to <strong>The WatchTower</strong> platform. Set a password to activate your account and get started.
</p>
${ctaButton(url, "Set your password")}
${urlFallback(url)}
${divider()}
${footnote("This link expires in <strong>1 hour</strong>. If you didn't expect this email, you can safely ignore it.")}`,
  );
  return { subject, text, html };
}

export function passwordResetEmail(url: string): { subject: string; text: string; html: string } {
  const subject = "Reset your WatchTower password";
  const text = `We received a request to reset your WatchTower password.\n\nClick the link below to choose a new password:\n\n${url}\n\nThis link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.`;
  const html = emailShell(
    "Reset your password",
    `<h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:${BASE_STYLES.dark};">Reset your password</h2>
<p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:${BASE_STYLES.textBody};">
  We received a request to reset the password for your <strong>WatchTower</strong> account. Click the button below to choose a new one.
</p>
${ctaButton(url, "Reset password")}
${urlFallback(url)}
${divider()}
${footnote("This link expires in <strong>1 hour</strong>. If you didn't request this, you can safely ignore this email — your account is secure.")}`,
  );
  return { subject, text, html };
}
