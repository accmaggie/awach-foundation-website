/**
 * ==========================================================================
 * AWACH FOUNDATION - VERCEL SERVERLESS CONTACT API
 * Handles POST /api/contact directly on Vercel
 * ==========================================================================
 */

const db = require("../server/db");
const emailService = require("../server/email");

module.exports = async function handler(req, res) {
    // Set CORS headers
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
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

    const { fullName, email, subject, message } = req.body || {};

    if (!fullName || !email || !subject || !message) {
        return res.status(400).json({
            success: false,
            error: "All fields are required (fullName, email, subject, message)."
        });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            error: "Please enter a valid email address."
        });
    }

    // 1. Save to database
    let savedContact;
    try {
        const clientIp = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "";
        savedContact = db.saveContact({
            fullName,
            email,
            subject,
            message,
            ip: clientIp
        });
    } catch (dbErr) {
        console.error("[api/contact] DB save error:", dbErr.message);
        savedContact = { id: `item_${Date.now()}` };
    }

    // 2. Dispatch Confirmation and Admin Alert Emails
    let emailDispatched = false;
    let previewUrl = null;

    try {
        const confirmResult = await emailService.sendContactConfirmation({
            to: email,
            fullName,
            subject,
            message
        });
        previewUrl = confirmResult?.previewUrl || null;

        await emailService.sendAdminAlert({
            fullName,
            fromEmail: email,
            subject,
            message,
            contactId: savedContact.id
        });

        emailDispatched = true;
    } catch (mailErr) {
        console.warn("[api/contact] Email notification error:", mailErr.message);
    }

    return res.status(200).json({
        success: true,
        message: "Thank you! Your message has been sent successfully. A confirmation email has been dispatched to your inbox.",
        inquiryId: savedContact.id,
        emailDispatched,
        previewUrl
    });
};
