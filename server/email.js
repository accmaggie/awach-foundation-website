/**
 * ==========================================================================
 * AWACH FOUNDATION - EMAIL DELIVERY SERVICE
 * Transactional email service using Nodemailer with dev fallback & HTML templates
 * ==========================================================================
 */

const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

const LOG_FILE = path.join(__dirname, "..", "data", "sent_emails.log");

let transporter = null;
let isDevMock = false;

// Initialize the mail transporter
async function initTransporter() {
    if (transporter) return transporter;

    const host = (process.env.SMTP_HOST || "").trim();
    const user = (process.env.SMTP_USER || "").trim();
    const pass = (process.env.SMTP_PASS || "").trim();

    if (host && user && pass) {
        // Production SMTP configuration (e.g. Gmail, SendGrid, Outlook, Custom SMTP)
        transporter = nodemailer.createTransport({
            host: host,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
            auth: {
                user: user,
                pass: pass
            }
        });
        isDevMock = false;
        console.log(`[EmailService] Configured with real SMTP server: ${host}`);
    } else {
        // Development / Test mode: Ethereal test account or simulated logger
        try {
            const testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: "smtp.ethereal.email",
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass
                }
            });
            isDevMock = true;
            console.log(`[EmailService] SMTP not configured. Using Ethereal test account: ${testAccount.user}`);
        } catch (err) {
            // Offline / local logger fallback
            transporter = {
                sendMail: async (options) => {
                    logEmailToFile(options);
                    return {
                        messageId: `mock_${Date.now()}`,
                        response: "Simulated offline mail sent successfully"
                    };
                }
            };
            isDevMock = true;
            console.log("[EmailService] Operating in local simulated mode (sent emails logged to data/sent_emails.log)");
        }
    }

    return transporter;
}

// Log email for development inspection
function logEmailToFile(mailOptions) {
    try {
        const dataDir = path.join(__dirname, "..", "data");
        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

        const logEntry = `
================================================================================
TIME:    ${new Date().toISOString()}
TO:      ${mailOptions.to}
FROM:    ${mailOptions.from}
SUBJECT: ${mailOptions.subject}
PREVIEW: ${mailOptions.previewUrl || "N/A"}
--------------------------------------------------------------------------------
TEXT CONTENT:
${mailOptions.text || "(HTML only)"}
================================================================================
`;
        fs.appendFileSync(LOG_FILE, logEntry, "utf8");
    } catch (err) {
        console.error("[EmailService] Failed to write to sent_emails.log:", err.message);
    }
}

// Get default sender address
function getSenderAddress() {
    return process.env.FROM_EMAIL || '"Awach Foundation" <info@awachfoundation.org>';
}

// Get admin notification address
function getAdminAddress() {
    return process.env.ADMIN_EMAIL || "info@awachfoundation.org";
}

// ==========================================================================
// 1. CONTACT CONFIRMATION EMAIL (Sent to the visitor)
// ==========================================================================

async function sendContactConfirmation({ to, fullName, subject, message }) {
    const mailer = await initTransporter();
    const from = getSenderAddress();

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank you for contacting Awach Foundation</title>
</head>
<body style="margin: 0; padding: 25px 15px; background-color: #f4f8f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #34464c; line-height: 1.6;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e1ecee;">
    
    <!-- HEADER -->
    <div style="background: #3b7985; background: linear-gradient(135deg, #438c98, #327985); color: #ffffff; padding: 32px 20px; text-align: center;">
      <div style="display: inline-block; background-color: #9bcb4b; color: #1c2b30; font-weight: 900; font-size: 22px; width: 46px; height: 46px; line-height: 46px; border-radius: 10px; margin-bottom: 8px; text-align: center;">AF</div>
      <h1 style="margin: 4px 0 0 0; font-size: 24px; font-weight: 800; letter-spacing: 1.5px; color: #ffffff; text-transform: uppercase;">AWACH FOUNDATION</h1>
      <p style="margin: 6px 0 0 0; font-size: 11px; font-weight: 700; color: #dff2f3; letter-spacing: 2.5px; text-transform: uppercase;">EMPOWERING PEOPLE • TRANSFORMING COMMUNITIES</p>
    </div>

    <!-- BODY -->
    <div style="padding: 35px 30px; background-color: #ffffff;">
      <div style="font-size: 18px; font-weight: 700; color: #438c98; margin-bottom: 16px;">Dear ${escapeHtml(fullName)},</div>
      <p style="margin: 0 0 16px 0; font-size: 14.5px; color: #34464c;">
        Thank you for reaching out to <strong>Awach Foundation</strong>. We have successfully received your inquiry, and our team is reviewing your message.
      </p>

      <!-- DETAILS BOX -->
      <div style="background-color: #f7fafa; border-left: 4px solid #438c98; padding: 18px 20px; border-radius: 6px; margin: 22px 0;">
        <div style="font-weight: 700; color: #1c2b30; font-size: 14px; margin-bottom: 6px;">Inquiry Details:</div>
        <div style="font-size: 13.5px; color: #34464c; margin-bottom: 8px;"><strong>Subject:</strong> ${escapeHtml(subject)}</div>
        <div style="font-weight: 700; color: #1c2b30; font-size: 13.5px; margin-bottom: 4px;">Your Message:</div>
        <div style="background-color: #ffffff; border: 1px solid #e1ecee; border-radius: 6px; padding: 12px 16px; margin-top: 6px; font-style: italic; color: #53656b; font-size: 13.5px; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(message)}</div>
      </div>

      <p style="margin: 0 0 20px 0; font-size: 14px; color: #53656b;">
        A member of our team will get back to you shortly (typically within 1 to 2 business days). If your request is urgent, please feel free to contact our office directly via phone.
      </p>

      <p style="margin: 25px 0 0 0; font-size: 14px; color: #34464c; line-height: 1.5;">
        Warm regards,<br>
        <strong>Awach Foundation Team</strong><br>
        <span style="color: #68777c; font-size: 13px;">Addis Ababa, Ethiopia</span>
      </p>
    </div>

    <!-- FOOTER -->
    <div style="background-color: #1c2b30; color: #b5c7cb; padding: 22px 25px; font-size: 12px; text-align: center; line-height: 1.6;">
      <p style="margin: 0 0 6px 0; color: #b5c7cb;">
        📍 Addis Ababa, Ethiopia &nbsp;|&nbsp; 📞 +251 11 869 9000 &nbsp;|&nbsp; ✉️ <a href="mailto:info@awachfoundation.org" style="color: #9bcb4b; text-decoration: none;">info@awachfoundation.org</a>
      </p>
      <p style="margin: 0; color: #738a90;">&copy; ${new Date().getFullYear()} Awach Foundation. All rights reserved.</p>
    </div>

  </div>
</body>
</html>
`;

    const mailOptions = {
        from: from,
        to: to,
        subject: `Thank you for contacting Awach Foundation: "${subject}"`,
        text: `Dear ${fullName},\n\nThank you for reaching out to Awach Foundation. We have received your message regarding "${subject}" and our team will get back to you shortly.\n\nYour message:\n${message}\n\nWarm regards,\nAwach Foundation Team\nAddis Ababa, Ethiopia\n+251 11 869 9000 | info@awachfoundation.org`,
        html: htmlContent
    };

    const info = await mailer.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(info) : null;
    if (previewUrl) {
        mailOptions.previewUrl = previewUrl;
    }
    logEmailToFile(mailOptions);

    return { success: true, messageId: info.messageId, previewUrl };
}

// ==========================================================================
// 2. ADMIN NOTIFICATION EMAIL (Sent to the foundation staff / admin)
// ==========================================================================

async function sendContactAdminAlert({ fromEmail, fullName, subject, message, contactId }) {
    const mailer = await initTransporter();
    const from = getSenderAddress();
    const adminTo = getAdminAddress();

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Website Inquiry</title>
</head>
<body style="margin: 0; padding: 25px 15px; background-color: #f4f8f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #34464c; line-height: 1.6;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e1ecee;">
    
    <!-- HEADER -->
    <div style="background: #3b7985; background: linear-gradient(135deg, #438c98, #327985); color: #ffffff; padding: 32px 20px; text-align: center;">
      <div style="display: inline-block; background-color: #9bcb4b; color: #1c2b30; font-weight: 900; font-size: 22px; width: 46px; height: 46px; line-height: 46px; border-radius: 10px; margin-bottom: 8px; text-align: center;">AF</div>
      <h1 style="margin: 4px 0 0 0; font-size: 24px; font-weight: 800; letter-spacing: 1.5px; color: #ffffff; text-transform: uppercase;">AWACH FOUNDATION</h1>
      <p style="margin: 6px 0 0 0; font-size: 11px; font-weight: 700; color: #dff2f3; letter-spacing: 2.5px; text-transform: uppercase;">EMPOWERING PEOPLE • TRANSFORMING COMMUNITIES</p>
    </div>

    <!-- BODY -->
    <div style="padding: 35px 30px; background-color: #ffffff;">
      <div style="font-size: 18px; font-weight: 700; color: #438c98; margin-bottom: 8px;">Dear Awach Admin,</div>
      <p style="margin: 0 0 16px 0; font-size: 14.5px; color: #34464c;">
        You have received a new contact inquiry submitted through the <strong>Awach Foundation website</strong>. Details are provided below:
      </p>

      <!-- DETAILS BOX -->
      <div style="background-color: #f7fafa; border-left: 4px solid #438c98; padding: 18px 20px; border-radius: 6px; margin: 22px 0;">
        <div style="font-weight: 700; color: #1c2b30; font-size: 14px; margin-bottom: 8px;">Inquiry Details:</div>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 13.5px; margin-bottom: 12px;">
          <tr>
            <td style="padding: 4px 0; font-weight: 700; color: #1c2b30; width: 110px;">Sender:</td>
            <td style="padding: 4px 0; color: #34464c;"><strong>${escapeHtml(fullName)}</strong></td>
          </tr>
          <tr>
            <td style="padding: 4px 0; font-weight: 700; color: #1c2b30;">Email:</td>
            <td style="padding: 4px 0;"><a href="mailto:${escapeHtml(fromEmail)}" style="color: #438c98; text-decoration: none; font-weight: 600;">${escapeHtml(fromEmail)}</a></td>
          </tr>
          <tr>
            <td style="padding: 4px 0; font-weight: 700; color: #1c2b30;">Subject:</td>
            <td style="padding: 4px 0; color: #1c2b30; font-weight: 600;">${escapeHtml(subject)}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; font-weight: 700; color: #1c2b30;">Inquiry ID:</td>
            <td style="padding: 4px 0; color: #68777c; font-family: monospace;">${escapeHtml(contactId)}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; font-weight: 700; color: #1c2b30;">Received:</td>
            <td style="padding: 4px 0; color: #68777c;">${new Date().toLocaleString()}</td>
          </tr>
        </table>

        <div style="font-weight: 700; color: #1c2b30; font-size: 13.5px; margin-bottom: 4px;">Message from Visitor:</div>
        <div style="background-color: #ffffff; border: 1px solid #e1ecee; border-radius: 6px; padding: 14px 16px; margin-top: 6px; color: #34464c; font-size: 13.5px; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(message)}</div>
      </div>

      <!-- ACTION BUTTON -->
      <div style="text-align: center; margin: 26px 0 15px;">
        <a href="mailto:${escapeHtml(fromEmail)}?subject=Re: [Awach Foundation] ${encodeURIComponent(subject)}" style="display: inline-block; background-color: #438c98; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 25px; box-shadow: 0 4px 14px rgba(67, 140, 152, 0.35);">
          ✉️ Reply to ${escapeHtml(fullName)}
        </a>
      </div>

      <p style="margin: 20px 0 0 0; font-size: 13px; color: #68777c; border-top: 1px solid #edf3f4; padding-top: 14px; line-height: 1.5;">
        💡 <em>You can also simply hit "Reply" in your email app to respond directly to <strong>${escapeHtml(fromEmail)}</strong>.</em>
      </p>

      <p style="margin: 20px 0 0 0; font-size: 14px; color: #34464c; line-height: 1.5;">
        Warm regards,<br>
        <strong>Awach Foundation Portal</strong><br>
        <span style="color: #68777c; font-size: 13px;">Addis Ababa, Ethiopia</span>
      </p>
    </div>

    <!-- FOOTER -->
    <div style="background-color: #1c2b30; color: #b5c7cb; padding: 22px 25px; font-size: 12px; text-align: center; line-height: 1.6;">
      <p style="margin: 0 0 6px 0; color: #b5c7cb;">
        📍 Addis Ababa, Ethiopia &nbsp;|&nbsp; 📞 +251 11 869 9000 &nbsp;|&nbsp; ✉️ <a href="mailto:info@awachfoundation.org" style="color: #9bcb4b; text-decoration: none;">info@awachfoundation.org</a>
      </p>
      <p style="margin: 0; color: #738a90;">&copy; ${new Date().getFullYear()} Awach Foundation. All rights reserved.</p>
    </div>

  </div>
</body>
</html>
`;

    const mailOptions = {
        from: from,
        to: adminTo,
        replyTo: `"${fullName}" <${fromEmail}>`,
        subject: `[New Inquiry] ${subject} - from ${fullName}`,
        text: `New contact submission received:\n\nName: ${fullName}\nEmail: ${fromEmail}\nSubject: ${subject}\n\nMessage:\n${message}\n\nSubmission ID: ${contactId}`,
        html: htmlContent
    };

    const info = await mailer.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(info) : null;
    if (previewUrl) {
        mailOptions.previewUrl = previewUrl;
    }
    logEmailToFile(mailOptions);

    return { success: true, messageId: info.messageId, previewUrl };
}

// ==========================================================================
// 3. NEWSLETTER WELCOME EMAIL
// ==========================================================================

async function sendNewsletterWelcome({ to }) {
    const mailer = await initTransporter();
    const from = getSenderAddress();

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Awach Foundation Newsletter</title>
</head>
<body style="margin: 0; padding: 25px 15px; background-color: #f4f8f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #34464c; line-height: 1.6;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e1ecee;">
    
    <!-- HEADER -->
    <div style="background: #3b7985; background: linear-gradient(135deg, #438c98, #327985); color: #ffffff; padding: 32px 20px; text-align: center;">
      <div style="display: inline-block; background-color: #9bcb4b; color: #1c2b30; font-weight: 900; font-size: 22px; width: 46px; height: 46px; line-height: 46px; border-radius: 10px; margin-bottom: 8px; text-align: center;">AF</div>
      <h1 style="margin: 4px 0 0 0; font-size: 24px; font-weight: 800; letter-spacing: 1.5px; color: #ffffff; text-transform: uppercase;">AWACH FOUNDATION</h1>
      <p style="margin: 6px 0 0 0; font-size: 11px; font-weight: 700; color: #dff2f3; letter-spacing: 2.5px; text-transform: uppercase;">EMPOWERING PEOPLE • TRANSFORMING COMMUNITIES</p>
    </div>

    <!-- BODY -->
    <div style="padding: 35px 30px; background-color: #ffffff;">
      <div style="font-size: 18px; font-weight: 700; color: #438c98; margin-bottom: 16px;">Welcome to Our Community!</div>
      <p style="margin: 0 0 16px 0; font-size: 14.5px; color: #34464c;">
        Thank you for subscribing to the official <strong>Awach Foundation newsletter</strong>. We are thrilled to welcome you to our community.
      </p>

      <!-- HIGHLIGHT BOX -->
      <div style="background-color: #f7fafa; border-left: 4px solid #9bcb4b; padding: 18px 20px; border-radius: 6px; margin: 22px 0;">
        <div style="font-weight: 700; color: #1c2b30; font-size: 14px; margin-bottom: 6px;">What to Expect:</div>
        <p style="margin: 0; font-size: 13.5px; color: #53656b;">
          You will receive regular updates on our youth development initiatives, community empowerment projects, educational workshops, and inspiring impact stories from across Ethiopia.
        </p>
      </div>

      <p style="margin: 0 0 20px 0; font-size: 14px; color: #53656b;">
        Together, we are creating opportunities for individuals and strengthening communities for a brighter future.
      </p>

      <p style="margin: 25px 0 0 0; font-size: 14px; color: #34464c; line-height: 1.5;">
        Warm regards,<br>
        <strong>Awach Foundation Team</strong><br>
        <span style="color: #68777c; font-size: 13px;">Addis Ababa, Ethiopia</span>
      </p>
    </div>

    <!-- FOOTER -->
    <div style="background-color: #1c2b30; color: #b5c7cb; padding: 22px 25px; font-size: 12px; text-align: center; line-height: 1.6;">
      <p style="margin: 0 0 6px 0; color: #b5c7cb;">
        📍 Addis Ababa, Ethiopia &nbsp;|&nbsp; 📞 +251 11 869 9000 &nbsp;|&nbsp; ✉️ <a href="mailto:info@awachfoundation.org" style="color: #9bcb4b; text-decoration: none;">info@awachfoundation.org</a>
      </p>
      <p style="margin: 0; color: #738a90;">&copy; ${new Date().getFullYear()} Awach Foundation. All rights reserved.</p>
    </div>

  </div>
</body>
</html>
`;

    const mailOptions = {
        from: from,
        to: to,
        subject: "Welcome to Awach Foundation Newsletter!",
        text: "Thank you for subscribing to the Awach Foundation newsletter! We look forward to keeping you updated on our community programs and youth initiatives.\n\nWarm regards,\nAwach Foundation Team",
        html: htmlContent
    };

    const info = await mailer.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(info) : null;
    if (previewUrl) {
        mailOptions.previewUrl = previewUrl;
    }
    logEmailToFile(mailOptions);

    return { success: true, messageId: info.messageId, previewUrl };
}

// Test connection and status
async function getEmailStatus() {
    await initTransporter();
    return {
        configured: !isDevMock,
        mode: isDevMock ? "development_preview" : "smtp_production",
        host: process.env.SMTP_HOST || "Ethereal / Simulated",
        from: getSenderAddress(),
        adminTo: getAdminAddress()
    };
}

function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

module.exports = {
    initTransporter,
    sendContactConfirmation,
    sendContactAdminAlert,
    sendNewsletterWelcome,
    getEmailStatus
};
