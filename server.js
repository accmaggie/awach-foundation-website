/**
 * ==========================================================================
 * AWACH FOUNDATION - BACKEND SERVER
 * Express API server for Contact Submissions, Email Dispatch & Admin Portal
 * ==========================================================================
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const db = require("./server/db");
const emailService = require("./server/email");

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize data directory and email system
db.ensureDataFiles();
emailService.initTransporter().catch(err => {
    console.warn("[Server] Initial email transporter warning:", err.message);
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
    if (req.path.startsWith("/api/")) {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    }
    next();
});

// ==========================================================================
// PUBLIC API ROUTES
// ==========================================================================

/**
 * Health check
 */
app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        service: "Awach Foundation Backend",
        timestamp: new Date().toISOString()
    });
});

/**
 * Contact Us Form Submission
 * 1. Validates inputs
 * 2. Saves to database (data/contacts.json)
 * 3. Sends confirmation email to visitor
 * 4. Sends alert email to foundation staff
 */
app.post("/api/contact", async (req, res) => {
    try {
        const { fullName, email, subject, message } = req.body;

        // Validation
        if (!fullName || !fullName.trim()) {
            return res.status(400).json({ success: false, error: "Full name is required." });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email.trim())) {
            return res.status(400).json({ success: false, error: "A valid email address is required." });
        }

        if (!subject || !subject.trim()) {
            return res.status(400).json({ success: false, error: "Please select or provide an inquiry subject." });
        }

        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, error: "Please enter your message." });
        }

        const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";

        // 1. Save to Database
        const contact = db.saveContact({
            fullName: fullName.trim(),
            email: email.trim().toLowerCase(),
            subject: subject.trim(),
            message: message.trim(),
            ip: clientIp
        });

        console.log(`[Contact] New inquiry saved: ID=${contact.id} from ${contact.fullName} <${contact.email}>`);

        // 2. Send Confirmation Email to Visitor (Non-blocking)
        emailService.sendContactConfirmation({
            to: contact.email,
            fullName: contact.fullName,
            subject: contact.subject,
            message: contact.message
        }).then(result => {
            console.log(`[Contact] Confirmation email sent to ${contact.email} (MsgID: ${result.messageId})`);
        }).catch(err => {
            console.error(`[Contact] Error sending confirmation to ${contact.email}:`, err.message);
        });

        // 3. Send Alert Email to Foundation Admin (Non-blocking)
        emailService.sendContactAdminAlert({
            fromEmail: contact.email,
            fullName: contact.fullName,
            subject: contact.subject,
            message: contact.message,
            contactId: contact.id
        }).then(result => {
            console.log(`[Contact] Admin alert email successfully sent to ${process.env.ADMIN_EMAIL} (MsgID: ${result.messageId})`);
        }).catch(err => {
            console.error("[Contact] Error sending admin alert:", err.message);
        });

        res.status(201).json({
            success: true,
            message: "Thank you for contacting Awach Foundation! Your message has been saved, and a confirmation email has been sent to your address.",
            id: contact.id
        });

    } catch (err) {
        console.error("[Contact] Submission error:", err);
        res.status(500).json({
            success: false,
            error: "An internal server error occurred while processing your message. Please try again."
        });
    }
});

/**
 * Newsletter Subscription
 * 1. Validates email
 * 2. Saves to database (data/subscribers.json)
 * 3. Sends welcome email
 */
app.post("/api/newsletter", async (req, res) => {
    try {
        const { email } = req.body;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(String(email).trim())) {
            return res.status(400).json({ success: false, error: "Please provide a valid email address." });
        }

        const result = db.saveSubscriber(email.trim());

        if (result.isNew) {
            console.log(`[Newsletter] New subscriber: ${result.subscriber.email}`);

            // Send Welcome Email
            emailService.sendNewsletterWelcome({ to: result.subscriber.email }).catch(err => {
                console.error("[Newsletter] Error sending welcome email:", err.message);
            });

            return res.status(201).json({
                success: true,
                message: "Thank you for subscribing! A welcome confirmation has been sent to your email.",
                subscriber: result.subscriber
            });
        } else {
            return res.status(200).json({
                success: true,
                alreadySubscribed: true,
                message: "You are already subscribed to the Awach Foundation newsletter."
            });
        }
    } catch (err) {
        console.error("[Newsletter] Subscription error:", err);
        res.status(500).json({ success: false, error: "Failed to process newsletter subscription." });
    }
});

// ==========================================================================
// ADMIN API ROUTES
// ==========================================================================

/**
 * Admin Stats
 */
app.get("/api/admin/stats", (req, res) => {
    const stats = db.getStats();
    res.json({ success: true, stats });
});

/**
 * List Contact Submissions (supports filter: status=all|unread|read|replied, search=...)
 */
app.get("/api/admin/contacts", (req, res) => {
    const { status, search } = req.query;
    const contacts = db.getContacts({ status, search });
    res.json({ success: true, count: contacts.length, contacts });
});

/**
 * Update Contact Status
 */
app.patch("/api/admin/contacts/:id", (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const updated = db.updateContactStatus(id, status);
        if (!updated) {
            return res.status(404).json({ success: false, error: "Contact submission not found." });
        }
        res.json({ success: true, contact: updated });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

/**
 * Delete Contact Submission
 */
app.delete("/api/admin/contacts/:id", (req, res) => {
    const { id } = req.params;
    const deleted = db.deleteContact(id);
    if (!deleted) {
        return res.status(404).json({ success: false, error: "Contact submission not found." });
    }
    res.json({ success: true, message: "Contact submission deleted successfully." });
});

/**
 * List Newsletter Subscribers
 */
app.get("/api/admin/subscribers", (req, res) => {
    const subscribers = db.getSubscribers();
    res.json({ success: true, count: subscribers.length, subscribers });
});

/**
 * Email Service Status & Health
 */
app.get("/api/admin/email-status", async (req, res) => {
    try {
        const status = await emailService.getEmailStatus();
        res.json({ success: true, emailStatus: status });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * Test Email Dispatch
 */
app.post("/api/admin/test-email", async (req, res) => {
    const { testEmail } = req.body;
    if (!testEmail) {
        return res.status(400).json({ success: false, error: "Target test email address is required." });
    }

    try {
        const result = await emailService.sendContactConfirmation({
            to: testEmail,
            fullName: "Test Recipient",
            subject: "Awach Foundation SMTP Test Email",
            message: "This is a test email sent from the Awach Foundation backend server to verify that email delivery is working smoothly."
        });

        res.json({
            success: true,
            message: `Test email dispatched to ${testEmail}`,
            previewUrl: result.previewUrl
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ==========================================================================
// STATIC FRONTEND ASSETS
// ==========================================================================

// Serve static frontend files from current directory
app.use(express.static(path.join(__dirname)));

// Fallback for root
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Start Server
if (require.main === module) {
    app.listen(PORT, () => {
        console.log("==================================================");
        console.log(`🚀 Awach Foundation Server running at: http://localhost:${PORT}`);
        console.log(`🌐 Website Home:    http://localhost:${PORT}/index.html`);
        console.log(`📬 Contact Page:    http://localhost:${PORT}/pages/contact.html`);
        console.log(`⚙️ Admin Dashboard: http://localhost:${PORT}/pages/admin.html`);
        console.log("==================================================");
    });
}

module.exports = app;
