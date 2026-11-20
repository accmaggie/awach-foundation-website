/**
 * ==========================================================================
 * AWACH FOUNDATION - DATA PERSISTENCE LAYER
 * File-backed JSON database for contacts, subscribers & system stats
 * ==========================================================================
 */

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const CONTACTS_FILE = path.join(DATA_DIR, "contacts.json");
const SUBSCRIBERS_FILE = path.join(DATA_DIR, "subscribers.json");

// Ensure data directory and files exist
function ensureDataFiles() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(CONTACTS_FILE)) {
        fs.writeFileSync(CONTACTS_FILE, JSON.stringify([], null, 2), "utf8");
    }

    if (!fs.existsSync(SUBSCRIBERS_FILE)) {
        fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify([], null, 2), "utf8");
    }
}

// Read JSON helper
function readJSON(filePath) {
    ensureDataFiles();
    try {
        const raw = fs.readFileSync(filePath, "utf8");
        return JSON.parse(raw);
    } catch (err) {
        console.error(`Error reading ${filePath}:`, err.message);
        return [];
    }
}

// Write JSON helper
function writeJSON(filePath, data) {
    ensureDataFiles();
    try {
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
    const contacts = readJSON(CONTACTS_FILE);
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
    writeJSON(CONTACTS_FILE, contacts);
    return newContact;
}

function getContacts({ status, search } = {}) {
    let contacts = readJSON(CONTACTS_FILE);

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
    const contacts = readJSON(CONTACTS_FILE);
    return contacts.find(c => c.id === id) || null;
}

function updateContactStatus(id, newStatus) {
    const allowed = ["unread", "read", "replied", "archived"];
    if (!allowed.includes(newStatus)) {
        throw new Error(`Invalid status. Must be one of: ${allowed.join(", ")}`);
    }

    const contacts = readJSON(CONTACTS_FILE);
    const index = contacts.findIndex(c => c.id === id);
    if (index === -1) return null;

    contacts[index].status = newStatus;
    contacts[index].updatedAt = new Date().toISOString();
    writeJSON(CONTACTS_FILE, contacts);
    return contacts[index];
}

function deleteContact(id) {
    let contacts = readJSON(CONTACTS_FILE);
    const beforeCount = contacts.length;
    contacts = contacts.filter(c => c.id !== id);
    if (contacts.length !== beforeCount) {
        writeJSON(CONTACTS_FILE, contacts);
        return true;
    }
    return false;
}

// ==========================================
// NEWSLETTER SUBSCRIBERS
// ==========================================

function saveSubscriber(email, source = "website_footer") {
    const subscribers = readJSON(SUBSCRIBERS_FILE);
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
    writeJSON(SUBSCRIBERS_FILE, subscribers);
    return { isNew: true, subscriber: newSubscriber };
}

function getSubscribers() {
    return readJSON(SUBSCRIBERS_FILE);
}

// ==========================================
// STATISTICS
// ==========================================

function getStats() {
    const contacts = readJSON(CONTACTS_FILE);
    const subscribers = readJSON(SUBSCRIBERS_FILE);

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
