const ACUMBAMAIL_API_URL = "https://acumbamail.com/api/1/sendOne/";
const FROM_EMAIL = "hello@afrokaviar.com";

interface EmailParams {
  to: string;
  subject: string;
  body: string;
  category?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  const authToken = process.env.ACUMBAMAIL_AUTH_TOKEN;
  
  console.log("[Email] Attempting to send email to:", params.to);
  
  if (!authToken) {
    console.error("[Email] ACUMBAMAIL_AUTH_TOKEN not configured");
    return false;
  }

  try {
    const formData = new URLSearchParams();
    formData.append("auth_token", authToken);
    formData.append("response_type", "json");
    formData.append("from_email", FROM_EMAIL);
    formData.append("to_email", params.to);
    formData.append("subject", params.subject);
    formData.append("body", params.body);
    if (params.category) {
      formData.append("category", params.category);
    }

    console.log("[Email] Sending request to Acumbamail API...");
    const response = await fetch(ACUMBAMAIL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const responseText = await response.text();
    console.log("[Email] Acumbamail response status:", response.status);
    console.log("[Email] Acumbamail response body:", responseText);

    // Check for specific error messages
    if (responseText.includes("SMTP is not active")) {
      console.error("[Email] Transactional email is not enabled in your Acumbamail account.");
      console.error("[Email] Please go to your Acumbamail dashboard and enable transactional email sending.");
      return false;
    }

    if (!response.ok) {
      console.error("[Email] Acumbamail API error:", response.status, responseText);
      return false;
    }

    try {
      const result = JSON.parse(responseText);
      if (result.error) {
        console.error("[Email] Acumbamail returned error:", result.error);
        return false;
      }
      console.log("[Email] Email sent successfully:", result);
    } catch {
      // If response is not JSON but status is OK, consider it successful
      if (response.ok) {
        console.log("[Email] Email sent, response:", responseText);
      }
    }
    return response.ok;
  } catch (error) {
    console.error("[Email] Failed to send email:", error);
    return false;
  }
}

export function generateInviteEmailHtml(inviteCode: string, inviterName: string): string {
  const inviteUrl = `https://afrokaviar.com?invite=${inviteCode}`;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0A0D15; font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0A0D15; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 600px; background-color: #121214; border-radius: 16px; border: 1px solid #27272a;">
          <tr>
            <td style="padding: 40px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 10px 0; font-weight: 400; letter-spacing: 0.18em; font-family: Inter, sans-serif;">AFRO<span style="color: #22D3EE; margin: 0 7px;">•</span>KAVIAR</h1>
              <p style="color: #71717a; font-size: 14px; margin: 0;">The Culture Operating System</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <h2 style="color: #ffffff; font-size: 22px; margin: 0 0 20px 0; font-weight: 600;">You're Invited!</h2>
              <p style="color: #a1a1aa; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                <strong style="color: #F4BE44;">${inviterName}</strong> has invited you to join Afrokaviar — the premium Afro-futurist culture platform for the diaspora.
              </p>
              <p style="color: #a1a1aa; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Watch TV, listen to radio, discover music drops, and connect with the culture.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}" style="display: inline-block; background-color: #22D3EE; color: #000000; text-decoration: none; padding: 14px 32px; border-radius: 999px; font-weight: 700; font-size: 16px;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color: #52525b; font-size: 13px; margin: 30px 0 0 0; text-align: center;">
                Or copy this link: <span style="color: #71717a;">${inviteUrl}</span>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; border-top: 1px solid #27272a; text-align: center;">
              <p style="color: #52525b; font-size: 12px; margin: 0;">
                © 2025 Afrokaviar. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendInviteEmail(email: string, inviteCode: string, inviterName: string): Promise<boolean> {
  const html = generateInviteEmailHtml(inviteCode, inviterName);
  
  return sendEmail({
    to: email,
    subject: `${inviterName} invited you to join Afrokaviar`,
    body: html,
    category: "invitation",
  });
}
