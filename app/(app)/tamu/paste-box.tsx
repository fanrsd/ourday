"use client";

import { useActionState } from "react";
import { pasteGuestsAction } from "./actions.ts";

/**
 * The couple's list already exists in a notes app or a chat thread. Pasting it
 * is the whole import story — no file upload, no CSV, no encoding arguments.
 */
export function PasteBox() {
  const [state, action, pending] = useActionState(pasteGuestsAction, null);

  return (
    <form action={action}>
      <label className="label" htmlFor="pasted">
        Tempel daftar tamu — satu tamu per baris
      </label>
      <textarea
        id="pasted"
        name="pasted"
        rows={6}
        className="input font-mono text-xs"
        placeholder={"Budi Santoso\nSiti Aminah, 0812 3456 7890\nRina Wijaya, 0812 9876 5432, Kantor"}
      />
      <p className="mt-2 text-xs leading-relaxed text-ink-soft">
        Nama saja sudah cukup. Kalau ada, tambahkan nomor WhatsApp dan kelompok
        dipisah koma atau tab. Nama yang sudah ada di daftar akan dilewati, jadi
        kamu aman menempel ulang daftar yang sama.
      </p>

      <div className="mt-3 flex items-center gap-3">
        <button className="btn btn-primary" disabled={pending}>
          {pending ? "Menambahkan…" : "Tambahkan ke daftar"}
        </button>
        <span role="status" aria-live="polite" className="text-sm">
          {state?.ok && state.data ? (
            <span className="text-ink-soft">
              <strong className="tabular text-ink">{state.data.added}</strong> tamu
              ditambahkan
              {state.data.skipped > 0
                ? `, ${state.data.skipped} dilewati karena namanya sudah ada`
                : ""}
              .
            </span>
          ) : state && !state.ok ? (
            <span className="text-rose">{state.error}</span>
          ) : null}
        </span>
      </div>
    </form>
  );
}
