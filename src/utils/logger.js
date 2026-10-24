import fs from "fs";
import path from "path";

// Levels hierarchy
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const CURRENT_LEVEL = process.env.NODE_ENV === "production" ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG;

// Resolve log file directory on the server
function getLogPaths() {
  const logDir = path.join(process.cwd(), "logs");
  if (!fs.existsSync(logDir)) {
    try {
      fs.mkdirSync(logDir, { recursive: true });
    } catch {
      // Ignore directory creation errors if already exists
    }
  }
  return {
    appLog: path.join(logDir, "app.log"),
    errorLog: path.join(logDir, "error.log"),
  };
}

// Safely format metadata or error objects
function formatMeta(meta) {
  if (!meta) return "";
  if (meta instanceof Error) {
    return `\nStack: ${meta.stack || meta.message}`;
  }
  try {
    return " " + JSON.stringify(meta);
  } catch {
    return " [Circular / Unserializable Object]";
  }
}

// Write to server disk
function writeToServerLog(level, scope, message, meta) {
  try {
    const { appLog, errorLog } = getLogPaths();
    const timestamp = new Date().toISOString().replace("T", " ").replace("Z", "");
    const formatted = `[${timestamp}] [${level.padEnd(5)}] [${scope}] ${message}${formatMeta(meta)}\n`;

    fs.appendFileSync(appLog, formatted, "utf8");

    if (level === "ERROR") {
      fs.appendFileSync(errorLog, formatted, "utf8");
    }
  } catch (err) {
    console.error("Failed to write to log file:", err);
  }
}

// Client-side dispatcher to /api/log
function sendToApi(level, scope, message, meta) {
  if (typeof window === "undefined") return;
  try {
    const payload = {
      level,
      scope,
      message,
      meta: meta instanceof Error ? { message: meta.message, stack: meta.stack } : meta,
      url: window.location?.href,
      userAgent: window.navigator?.userAgent,
    };

    fetch("/api/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      // Avoid recursive logging or crashing on network drop
    });
  } catch {
    // Ignore client fetch errors
  }
}

class Logger {
  constructor(defaultScope = "App") {
    this.defaultScope = defaultScope;
  }

  createScope(scope) {
    return new Logger(scope);
  }

  log(level, message, meta = null, scope = null) {
    if (LOG_LEVELS[level] < CURRENT_LEVEL) return;
    const finalScope = scope || this.defaultScope;

    if (typeof window === "undefined") {
      // Server-side
      writeToServerLog(level, finalScope, message, meta);
      if (process.env.NODE_ENV !== "production") {
        const consoleMethod = level === "ERROR" ? console.error : level === "WARN" ? console.warn : console.log;
        consoleMethod(`[${level}] [${finalScope}] ${message}`, meta || "");
      }
    } else {
      // Client-side
      const consoleMethod = level === "ERROR" ? console.error : level === "WARN" ? console.warn : console.log;
      consoleMethod(`%c[${level}]%c [${finalScope}] ${message}`, level === "ERROR" ? "color: red; font-weight: bold" : level === "WARN" ? "color: orange; font-weight: bold" : "color: #3b82f6; font-weight: bold", "color: inherit", meta || "");

      // Send warnings and errors to server log
      if (level === "ERROR" || level === "WARN") {
        sendToApi(level, finalScope, message, meta);
      }
    }
  }

  debug(message, meta = null, scope = null) {
    this.log("DEBUG", message, meta, scope);
  }

  info(message, meta = null, scope = null) {
    this.log("INFO", message, meta, scope);
  }

  warn(message, meta = null, scope = null) {
    this.log("WARN", message, meta, scope);
  }

  error(message, meta = null, scope = null) {
    this.log("ERROR", message, meta, scope);
  }
}

export const logger = new Logger("SongHub");
export default logger;
