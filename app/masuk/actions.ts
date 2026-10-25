"use server";

import { requestLogin } from "@/lib/auth.ts";
import { toResult, type ActionResult } from "@/lib/actions.ts";

type State = ActionResult<{ devUrl?: string }> | null;

export async function requestLoginAction(_prev: State, form: FormData): Promise<State> {
  try {
    const url = await requestLogin(String(form.get("email") ?? ""));
    // Without an SMTP account the link would otherwise be unreachable in dev.
    return { ok: true, data: process.env.NODE_ENV === "production" ? {} : { devUrl: url } };
  } catch (err) {
    return toResult(err);
  }
}
