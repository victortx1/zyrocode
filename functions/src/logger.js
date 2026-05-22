const REDACT_KEYS = new Set(["email", "nome", "nickname", "displayName", "photoURL", "foto"]);

function redactPayload(payload = {}) {
  if (!payload || typeof payload !== "object") return payload;
  const safe = {};
  for (const [key, value] of Object.entries(payload)) {
    if (REDACT_KEYS.has(key)) {
      safe[key] = "[redacted]";
    } else if (key === "uid" || key === "lessonId" || key === "missionId" || key === "itemId") {
      safe[key] = value;
    } else if (typeof value === "number" || typeof value === "boolean" || typeof value === "string") {
      safe[key] = value;
    }
  }
  return safe;
}

function logInfo(action, fields = {}) {
  console.log(JSON.stringify({
    severity: "INFO",
    action,
    at: new Date().toISOString(),
    ...redactPayload(fields)
  }));
}

function logWarn(action, fields = {}) {
  console.warn(JSON.stringify({
    severity: "WARN",
    action,
    at: new Date().toISOString(),
    ...redactPayload(fields)
  }));
}

function logError(action, error, fields = {}) {
  console.error(JSON.stringify({
    severity: "ERROR",
    action,
    at: new Date().toISOString(),
    code: error?.code || "unknown",
    message: error?.message || String(error),
    ...redactPayload(fields)
  }));
}

module.exports = { logInfo, logWarn, logError, redactPayload };
