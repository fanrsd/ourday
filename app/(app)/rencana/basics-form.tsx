"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { saveBasicsAction } from "./actions.ts";

function Save() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary text-sm">
      {pending ? "Menyimpan…" : "Simpan"}
    </button>
  );
}

export function BasicsForm({
  groom,
  bride,
  eventDate,
}: {
  groom: string;
  bride: string;
  eventDate: string;
}) {
  const [state, action] = useActionState(saveBasicsAction, null);

  return (
    <form action={action} className="card space-y-4 px-4 py-4">
      <div>
        <h2 className="text-sm font-medium">Nama dan tanggal</h2>
        <p className="mt-1 text-xs text-ink-soft">
          Semua tenggat di perencana dihitung mundur dari tanggal ini.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-[10rem] flex-1">
          <span className="label">Nama mempelai pria</span>
          <input
            name="groom"
            defaultValue={groom}
            placeholder="Rizky"
            autoComplete="off"
            className="input"
          />
        </label>
        <label className="min-w-[10rem] flex-1">
          <span className="label">Nama mempelai wanita</span>
          <input
            name="bride"
            defaultValue={bride}
            placeholder="Dinda"
            autoComplete="off"
            className="input"
          />
        </label>
        <label className="w-full sm:w-44">
          <span className="label">Tanggal pernikahan</span>
          <input name="eventDate" type="date" defaultValue={eventDate} className="input" />
        </label>
        <Save />
      </div>

      {state && !state.ok ? (
        <p role="alert" className="text-sm text-rose">
          {state.error}
        </p>
      ) : state?.ok ? (
        <p role="status" className="text-sm text-leaf">
          Tersimpan.
        </p>
      ) : null}
    </form>
  );
}
