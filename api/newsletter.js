/**
 * ==========================================================================
 * AWACH FOUNDATION - VERCEL SERVERLESS NEWSLETTER API
 * Handles POST /api/newsletter directly on Vercel
 * ==========================================================================
 */

const db = require("../server/db");
const emailService = require("../server/email");

module.exports = async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
    );

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "POST") {
        return res.status(405).json({ success: false, error: "Method not allowed. Use POST." });
    }

    const { email, source } = req.body || {};

    if (!email) {
        return res.status(400).json({ success: false, error: "Email address is required." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, error: "Please provide a valid email address." });
    }

    try {
        const result = db.saveSubscriber(email, source);
        try {
            await emailService.sendNewsletterWelcome({ to: email });
        } catch (mailErr) {
            console.warn("[api/newsletter] Welcome email notice:", mailErr.message);
        }

        return res.status(200).json({
            success: true,
            isNew: result.isNew,
            message: result.isNew
                ? "Thank you for subscribing! A welcome email has been sent."
                : "You are already subscribed to the Awach Foundation newsletter."
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};
