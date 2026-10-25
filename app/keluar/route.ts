import { NextResponse } from "next/server";
import { endSession } from "@/lib/auth.ts";

export async function POST(req: Request) {
  await endSession();
  return NextResponse.redirect(new URL("/", process.env.APP_URL ?? new URL(req.url).origin));
}
