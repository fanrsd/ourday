import { cookies } from "next/headers";
import { SESSION_COOKIE, SESSION_TTL_DAYS, signSession, verifySession } from "./session.ts";

export { requestLogin, consumeLogin } from "./login.ts";

export async function startSession(uid: string) {
  (await cookies()).set(SESSION_COOKIE, signSession(uid), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_DAYS * 86400,
  });
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function currentUserId(): Promise<string | null> {
  return verifySession((await cookies()).get(SESSION_COOKIE)?.value);
}

export async function requireUserId(): Promise<string> {
  const uid = await currentUserId();
  if (!uid) throw new Error("UNAUTHENTICATED");
  return uid;
}
