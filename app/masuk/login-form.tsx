"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/lib/actions.ts";

type State = ActionResult<{ devUrl?: string }> | null;

export function LoginForm({
  action,
}: {
  action: (prev: State, form: FormData) => Promise<State>;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  if (state?.ok) {
    return (
      <div className="mt-6 card p-4 text-sm">
        <p className="font-medium">Link masuk sudah dikirim.</p>
        <p className="mt-1 text-ink-soft">Cek email kamu, link berlaku 15 menit.</p>
        {state.data?.devUrl ? (
          <a className="mt-3 block break-all text-xs text-rose underline" href={state.data.devUrl}>
            {state.data.devUrl}
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-6 space-y-3">
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input
          id="email" name="email" type="email" required autoFocus
          autoComplete="email" placeholder="nama@email.com" className="input"
        />
      </div>
      {state && !state.ok ? <p className="text-sm text-rose">{state.error}</p> : null}
      <button className="btn btn-primary w-full" disabled={pending}>
        {pending ? "Mengirim…" : "Kirim link masuk"}
      </button>
    </form>
  );
}
