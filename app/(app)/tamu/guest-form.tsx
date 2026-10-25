"use client";

import { useActionState, useId } from "react";
import { saveGuestAction } from "./actions.ts";
import type { GuestRow } from "@/lib/guests.ts";

/** Add and edit are the same six fields, so they are the same form. */
export function GuestForm({ guest }: { guest?: GuestRow }) {
  const [state, action, pending] = useActionState(saveGuestAction, null);
  const editing = Boolean(guest);
  // The add form and an open edit row are on the page at the same time, so
  // fixed ids would collide and every label would point at the add form.
  const uid = useId();
  const at = (field: string) => `${uid}-${field}`;

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-6">
      {editing ? <input type="hidden" name="id" value={guest!.id} /> : null}

      <div className="sm:col-span-2">
        <label className="label" htmlFor={at("name")}>Nama</label>
        <input id={at("name")} name="name" className="input" required
               defaultValue={guest?.name ?? ""} placeholder="Budi Santoso" />
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor={at("phone")}>Nomor WhatsApp</label>
        <input id={at("phone")} name="phone" className="input" inputMode="tel"
               defaultValue={guest?.phone ?? ""} placeholder="0812 3456 7890" />
      </div>
      <div>
        <label className="label" htmlFor={at("group")}>Kelompok</label>
        <input id={at("group")} name="guest_group" className="input"
               defaultValue={guest?.guest_group ?? ""} placeholder="Keluarga" />
      </div>
      <div>
        <label className="label" htmlFor={at("session")}>Sesi</label>
        <input id={at("session")} name="session_label" className="input"
               defaultValue={guest?.session_label ?? ""} placeholder="Resepsi" />
      </div>
      <div>
        <label className="label" htmlFor={at("pax")}>Jatah pax</label>
        <input id={at("pax")} name="pax_allowed" type="number" min={1} max={20}
               className="input tabular" defaultValue={guest?.pax_allowed ?? 2} />
      </div>

      <div className="flex items-end gap-2 sm:col-span-2">
        <button className="btn btn-primary" disabled={pending}>
          {pending ? "Menyimpan…" : editing ? "Simpan" : "Tambah tamu"}
        </button>
        {editing ? <a href="/tamu" className="btn btn-ghost">Batal</a> : null}
      </div>

      <p role="status" aria-live="polite" className="text-sm sm:col-span-6">
        {state && !state.ok ? <span className="text-rose">{state.error}</span> : null}
      </p>
    </form>
  );
}
