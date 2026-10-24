import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const info = {
      projectId: process.env.FIREBASE_PROJECT_ID || "not set",
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "not set",
      hasPrivateKey: Boolean(process.env.FIREBASE_PRIVATE_KEY),
      privateKeyLength: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.length : 0,
      nodeVersion: process.version,
    };

    return NextResponse.json(info);
  } catch (error) {
    return NextResponse.json({ error: error.stack || error.message }, { status: 500 });
  }
}
