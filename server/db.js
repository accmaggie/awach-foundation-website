/**
 * ==========================================================================
 * AWACH FOUNDATION - DATA PERSISTENCE LAYER
 * File-backed JSON database for contacts, subscribers & system stats
 * ==========================================================================
 */

const fs = require("fs");
const path = require("path");
const os = require("os");

// Safely determine writable storage directory (supports local dev & Vercel serverless)
function getStorageDir() {
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
        const tmpDir = path.join(os.tmpdir(), "awach-data");
        try {
            if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
            return tmpDir;
        } catch (e) {
            return os.tmpdir();
        }
    }

    const localDir = path.join(__dirname, "..", "data");
    try {
        if (!fs.existsSync(localDir)) {
            fs.mkdirSync(localDir, { recursive: true });
        }
        return localDir;
    } catch (err) {
        const tmpFallback = path.join(os.tmpdir(), "awach-data");
        try {
            if (!fs.existsSync(tmpFallback)) fs.mkdirSync(tmpFallback, { recursive: true });
            return tmpFallback;
        } catch (e) {
            return os.tmpdir();
        }
    }
}

function getContactsFile() {
    return path.join(getStorageDir(), "contacts.json");
}

function getSubscribersFile() {
    return path.join(getStorageDir(), "subscribers.json");
}

// Ensure data directory and files exist
function ensureDataFiles() {
    try {
        const contactsFile = getContactsFile();
        const subscribersFile = getSubscribersFile();

        if (!fs.existsSync(contactsFile)) {
            fs.writeFileSync(contactsFile, JSON.stringify([], null, 2), "utf8");
        }

        if (!fs.existsSync(subscribersFile)) {
            fs.writeFileSync(subscribersFile, JSON.stringify([], null, 2), "utf8");
        }
    } catch (err) {
        console.warn("[DB] ensureDataFiles notice:", err.message);
    }
}

// Read JSON helper
function readJSON(filePath) {
    try {
        ensureDataFiles();
        if (!fs.existsSync(filePath)) return [];
        const raw = fs.readFileSync(filePath, "utf8");
        return JSON.parse(raw);
    } catch (err) {
        console.error(`Error reading ${filePath}:`, err.message);
        return [];
    }
}

// Write JSON helper
function writeJSON(filePath, data) {
    try {
        ensureDataFiles();
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
        return true;
    } catch (err) {
        console.error(`Error writing ${filePath}:`, err.message);
        return false;
    }
}

// Generate unique ID
function generateId(prefix = "item") {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

// ==========================================
// CONTACT INQUIRIES
// ==========================================

function saveContact({ fullName, email, subject, message, ip = "" }) {
    const contacts = readJSON(getContactsFile());
    const newContact = {
        id: generateId("contact"),
        fullName: String(fullName || "").trim(),
        email: String(email || "").trim().toLowerCase(),
        subject: String(subject || "").trim(),
        message: String(message || "").trim(),
        status: "unread", // unread, replied, archived
        ip: ip || "",
        createdAt: new Date().toISOString()
    };

    contacts.unshift(newContact);
    writeJSON(getContactsFile(), contacts);
    return newContact;
}

function getContacts({ status, search } = {}) {
    let contacts = readJSON(getContactsFile());

    if (status && status !== "all") {
        contacts = contacts.filter(c => c.status === status);
    }

    if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        contacts = contacts.filter(c =>
            c.fullName.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q) ||
            c.subject.toLowerCase().includes(q) ||
            c.message.toLowerCase().includes(q)
        );
    }

    return contacts;
}

function getContactById(id) {
    const contacts = readJSON(getContactsFile());
    return contacts.find(c => c.id === id) || null;
}

function updateContactStatus(id, newStatus) {
    const allowed = ["unread", "read", "replied", "archived"];
    if (!allowed.includes(newStatus)) {
        throw new Error(`Invalid status. Must be one of: ${allowed.join(", ")}`);
    }

    const contacts = readJSON(getContactsFile());
    const index = contacts.findIndex(c => c.id === id);
    if (index === -1) return null;

    contacts[index].status = newStatus;
    contacts[index].updatedAt = new Date().toISOString();
    writeJSON(getContactsFile(), contacts);
    return contacts[index];
}

function deleteContact(id) {
    let contacts = readJSON(getContactsFile());
    const beforeCount = contacts.length;
    contacts = contacts.filter(c => c.id !== id);
    if (contacts.length !== beforeCount) {
        writeJSON(getContactsFile(), contacts);
        return true;
    }
    return false;
}

// ==========================================
// NEWSLETTER SUBSCRIBERS
// ==========================================

function saveSubscriber(email, source = "website_footer") {
    const subscribers = readJSON(getSubscribersFile());
    const cleanEmail = String(email || "").trim().toLowerCase();

    const existing = subscribers.find(s => s.email === cleanEmail);
    if (existing) {
        return { isNew: false, subscriber: existing };
    }

    const newSubscriber = {
        id: generateId("sub"),
        email: cleanEmail,
        source: source || "website_footer",
        status: "active",
        createdAt: new Date().toISOString()
    };

    subscribers.unshift(newSubscriber);
    writeJSON(getSubscribersFile(), subscribers);
    return { isNew: true, subscriber: newSubscriber };
}

function getSubscribers() {
    return readJSON(getSubscribersFile());
}

// ==========================================
// STATISTICS
// ==========================================

function getStats() {
    const contacts = readJSON(getContactsFile());
    const subscribers = readJSON(getSubscribersFile());

    return {
        totalContacts: contacts.length,
        unreadContacts: contacts.filter(c => c.status === "unread").length,
        repliedContacts: contacts.filter(c => c.status === "replied").length,
        totalSubscribers: subscribers.length,
        activeSubscribers: subscribers.filter(s => s.status === "active").length
    };
}

module.exports = {
    ensureDataFiles,
    saveContact,
    getContacts,
    getContactById,
    updateContactStatus,
    deleteContact,
    saveSubscriber,
    getSubscribers,
    getStats
};
