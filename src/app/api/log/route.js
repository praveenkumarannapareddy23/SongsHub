import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req) {
  try {
    const body = await req.json();
    const { level = "INFO", scope = "Client", message = "", meta = null, url = "", userAgent = "" } = body;

    const logDir = path.join(process.cwd(), "logs");
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const appLog = path.join(logDir, "app.log");
    const errorLog = path.join(logDir, "error.log");

    const timestamp = new Date().toISOString().replace("T", " ").replace("Z", "");
    const clientDetails = url ? ` [URL: ${url}]` : "";
    const metaStr = meta ? ` ${typeof meta === "object" ? JSON.stringify(meta) : meta}` : "";
    const logLine = `[${timestamp}] [${level.padEnd(5)}] [Client::${scope}] ${message}${clientDetails}${metaStr}\n`;

    fs.appendFileSync(appLog, logLine, "utf8");

    if (level === "ERROR") {
      fs.appendFileSync(errorLog, logLine, "utf8");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
