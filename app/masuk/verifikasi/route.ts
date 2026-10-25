import { NextResponse } from "next/server";
import { consumeLogin, startSession } from "@/lib/auth.ts";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const userId = await consumeLogin(token);
  const base = process.env.APP_URL ?? new URL(req.url).origin;

  if (!userId) return NextResponse.redirect(new URL("/masuk?error=1", base));
  await startSession(userId);
  return NextResponse.redirect(new URL("/rencana", base));
}
