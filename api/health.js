/**
 * ==========================================================================
 * AWACH FOUNDATION - VERCEL SERVERLESS HEALTH API
 * Handles GET /api/health directly on Vercel
 * ==========================================================================
 */

module.exports = function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).json({
        status: "ok",
        platform: "Vercel Serverless / Node.js",
        service: "Awach Foundation Backend API",
        timestamp: new Date().toISOString()
    });
};
