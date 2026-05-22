const { db, FieldValue } = require("./admin");

async function writeAuditLog(uid, action, meta = {}) {
  try {
    await db.collection("auditLogs").add({
      uid,
      action,
      meta,
      createdAt: FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.warn(JSON.stringify({
      severity: "WARN",
      action: "audit_log_failed",
      uid,
      originalAction: action,
      message: error?.message
    }));
  }
}

module.exports = { writeAuditLog };
