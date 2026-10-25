"use client";

import { useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import type { ActionResult } from "@/lib/actions.ts";
import type {
  Kind,
  PlannerItem,
  PlannerNode,
  SavingsTarget,
  Totals,
} from "@/lib/planner.ts";
import { inputDate, inputDateTime, isOverdue, rupiah, selisih } from "../format.ts";
import { fieldsFor, type Field, type View } from "./view.ts";
import {
  chooseVendorAction,
  deleteItemAction,
  moveItemAction,
  revokeShareAction,
  saveItemAction,
  seedTodosAction,
  shareRundownAction,
  toggleDoneAction,
} from "./actions.ts";

// One width table shared by the header strip and every row: that is what makes
// plain flex rows line up as a table on a wide screen and stack on a phone.
const WIDTH: Record<Field["type"], string> = {
  title: "min-w-[11rem] flex-1",
  note: "min-w-[11rem] flex-1",
  planned: "w-full sm:w-32 sm:shrink-0",
  actual: "w-full sm:w-32 sm:shrink-0",
  date: "w-full sm:w-36 sm:shrink-0",
  datetime: "w-full sm:w-44 sm:shrink-0",
  text: "w-full sm:w-36 sm:shrink-0",
  url: "w-full sm:w-36 sm:shrink-0",
  flag: "w-full sm:w-16 sm:shrink-0",
};

const ACTIONS_WIDTH = "w-full sm:w-[12rem] sm:shrink-0";
const isMoney = (t: Field["type"]) => t === "planned" || t === "actual";

function fieldName(f: Field): string {
  switch (f.type) {
    case "title":
      return "title";
    case "note":
      return "note";
    case "planned":
      return "planned";
    case "actual":
      return "actual";
    case "date":
    case "datetime":
      return "due";
    default:
      return `meta.${f.key}`;
  }
}

const fieldKey = (f: Field) => `${f.type}:${fieldName(f)}`;

// Money shows grouped digits — 40.000.000 rather than 40000000, which nobody can
// read at a glance. It costs nothing: the action strips every non-digit before
// parsing, so a grouped value round-trips through the form unchanged.
const grouped = (n: number | null) => (n == null ? "" : n.toLocaleString("id-ID"));

function fieldValue(f: Field, item: PlannerItem | null): string {
  if (!item) return "";
  switch (f.type) {
    case "title":
      return item.title;
    case "note":
      return item.note;
    case "planned":
      return grouped(item.amount_planned);
    case "actual":
      return grouped(item.amount_actual);
    case "date":
      return inputDate(item.due_at);
    case "datetime":
      return inputDateTime(item.due_at);
    default:
      return String(item.meta[f.key] ?? "");
  }
}

/**
 * One labelled cell. The label shows on the add form and is read by screen
 * readers on every row, where printing it again would only add noise.
 */
function Cell({
  f,
  item,
  showLabel,
}: {
  f: Field;
  item: PlannerItem | null;
  showLabel: boolean;
}) {
  if (f.type === "flag") {
    return (
      <label
        className={`${WIDTH.flag} flex items-center gap-2 py-2 text-xs text-ink-soft sm:justify-center`}
      >
        <input
          type="checkbox"
          name={`meta.${f.key}`}
          defaultChecked={Boolean(item?.meta[f.key])}
          className="size-4 accent-leaf"
        />
        <span className={showLabel ? "" : "sm:hidden"}>{f.label}</span>
      </label>
    );
  }

  const overdue = f.type === "date" && item && isOverdue(item.due_at, item.done_at);
  const type =
    f.type === "date"
      ? "date"
      : f.type === "datetime"
        ? "datetime-local"
        : f.type === "url"
          ? "url"
          : "text";

  return (
    <label className={WIDTH[f.type]}>
      {showLabel ? <span className="label">{f.label}</span> : null}
      <input
        type={type}
        name={fieldName(f)}
        aria-label={f.label}
        title={f.label}
        defaultValue={fieldValue(f, item)}
        placeholder={"placeholder" in f ? f.placeholder : undefined}
        required={f.type === "title"}
        inputMode={isMoney(f.type) ? "numeric" : undefined}
        autoComplete="off"
        className={`input ${isMoney(f.type) ? "text-right tabular" : ""} ${
          overdue ? "border-rose text-rose" : ""
        }`}
      />
    </label>
  );
}

/** Blocks the second click that would otherwise add the same row twice. */
function Submit({ children, primary }: { children: string; primary?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`btn ${primary ? "btn-primary" : "btn-ghost px-2"} text-xs`}
    >
      {pending ? "Menyimpan…" : children}
    </button>
  );
}

// Remounting a row when its server data changes is what lets uncontrolled inputs
// pick up a saved value: React keeps DOM state across a re-render, but not
// across a new key.
const rowKey = (i: PlannerItem) =>
  [
    i.id,
    i.title,
    i.note,
    i.amount_planned,
    i.amount_actual,
    i.due_at,
    i.done_at,
    JSON.stringify(i.meta),
  ].join("|");

/** What a row needs from the page it lives on. */
type Ctl = {
  kind: Kind;
  view: View;
  pending: boolean;
  run: (fn: () => Promise<ActionResult>) => void;
  submit: (fn: () => Promise<ActionResult>) => Promise<void>;
};

function Row({
  ctl: { kind, view, pending, run, submit },
  item,
  isChild,
}: {
  ctl: Ctl;
  item: PlannerItem;
  isChild: boolean;
}) {
  const done = Boolean(item.done_at);
  const late = view.overdue && isOverdue(item.due_at, item.done_at);
  const chosen = view.chooseVendor && item.meta.chosen === true;

  return (
    <form
      action={(form) => submit(() => saveItemAction(kind, item.id, item.parent_id, form))}
      className={`flex flex-wrap items-end gap-2 border-t border-line px-3 py-2 ${
        isChild ? "bg-paper pl-6 sm:pl-10" : ""
      } ${done ? "opacity-60" : ""}`}
    >
      {view.doneLabel ? (
        <input
          type="checkbox"
          checked={done}
          disabled={pending}
          aria-label={`${view.doneLabel}: ${item.title}`}
          title={view.doneLabel}
          onChange={() => run(() => toggleDoneAction(kind, item.id))}
          className="mb-2 size-5 shrink-0 accent-leaf sm:mb-1.5 sm:size-4"
        />
      ) : null}

      {fieldsFor(view, isChild).map((f) => (
        <Cell key={fieldKey(f)} f={f} item={item} showLabel={false} />
      ))}

      <div className={`${ACTIONS_WIDTH} flex items-center gap-1 sm:justify-end`}>
        {late ? (
          <span className="mr-auto rounded bg-rose-soft px-1.5 py-0.5 text-[11px] text-rose">
            lewat tenggat
          </span>
        ) : null}
        <Submit>Simpan</Submit>
        {view.reorder ? (
          <>
            <button
              type="button"
              disabled={pending}
              aria-label={`Naikkan ${item.title}`}
              title="Naikkan"
              onClick={() => run(() => moveItemAction(kind, item.id, -1))}
              className="btn btn-ghost px-2 text-xs"
            >
              ↑
            </button>
            <button
              type="button"
              disabled={pending}
              aria-label={`Turunkan ${item.title}`}
              title="Turunkan"
              onClick={() => run(() => moveItemAction(kind, item.id, 1))}
              className="btn btn-ghost px-2 text-xs"
            >
              ↓
            </button>
          </>
        ) : null}
        <button
          type="button"
          disabled={pending}
          aria-label={`Hapus ${item.title}`}
          onClick={() => {
            if (confirm(`Hapus "${item.title}"?`)) {
              run(() => deleteItemAction(kind, item.id));
            }
          }}
          className="btn btn-danger px-2 text-xs"
        >
          Hapus
        </button>
      </div>

      {chosen ? (
        <p className="w-full text-xs text-leaf">
          Dipilih. Penawarannya sudah disalin ke anggaran.
        </p>
      ) : view.chooseVendor ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => chooseVendorAction(item.id))}
          className="btn btn-ghost w-full text-xs sm:w-auto"
        >
          Pilih vendor ini, salin ke anggaran
        </button>
      ) : null}
    </form>
  );
}

function AddForm({
  ctl: { kind, view, submit },
  parentId,
}: {
  ctl: Ctl;
  parentId: string | null;
}) {
  const nested = parentId ? view.nested! : null;
  return (
    <form
      action={(form) => submit(() => saveItemAction(kind, null, parentId, form))}
      className="flex flex-wrap items-end gap-2"
    >
      {fieldsFor(view, Boolean(parentId)).map((f) => (
        <Cell key={fieldKey(f)} f={f} item={null} showLabel />
      ))}
      <Submit primary>{nested ? nested.addLabel : view.addLabel}</Submit>
    </form>
  );
}

export function PlannerList({
  kind,
  view,
  nodes,
  totals,
  savings,
  shareUrl,
}: {
  kind: Kind;
  view: View;
  nodes: PlannerNode[];
  totals: Totals;
  savings: SavingsTarget[];
  shareUrl: string | null;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [weekOnly, setWeekOnly] = useState(false);

  /** Buttons: a transition, so each one can disable itself while it runs. */
  const run = (fn: () => Promise<ActionResult>) => {
    setError(null);
    start(async () => {
      const result = await fn();
      if (!result.ok) setError(result.error);
    });
  };

  /** Forms: React owns pending and the post-submit reset, so it must await. */
  const submit = async (fn: () => Promise<ActionResult>) => {
    setError(null);
    const result = await fn();
    if (!result.ok) setError(result.error);
  };

  const week = Date.now() + 7 * 86_400_000;
  const shown =
    view.weekFilter && weekOnly
      ? nodes.filter(
          (n) => !n.done_at && n.due_at && new Date(n.due_at).getTime() <= week,
        )
      : nodes;

  // Row and AddForm are module-level components, not closures defined here: a
  // component redeclared on every render is a new type to React, so every
  // keystroke elsewhere on the page would remount all rows and throw away edits
  // the couple had typed but not saved.
  const ctl: Ctl = { kind, view, pending, run, submit };

  return (
    <div className="space-y-4">
      {error ? (
        <p role="alert" className="rounded-lg bg-rose-soft px-3 py-2 text-sm text-rose">
          {error}
        </p>
      ) : null}

      {view.share ? <ShareBlock url={shareUrl} pending={pending} run={run} /> : null}

      {view.weekFilter && nodes.length > 0 ? (
        <label className="flex w-fit items-center gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={weekOnly}
            onChange={(e) => setWeekOnly(e.target.checked)}
            className="size-4 accent-leaf"
          />
          Jatuh tempo minggu ini
        </label>
      ) : null}

      {shown.length === 0 ? (
        <div className="card px-5 py-10 text-center">
          <p className="text-sm text-ink-soft">
            {weekOnly ? "Tidak ada tugas yang jatuh tempo minggu ini." : view.empty}
          </p>
          {view.seed && nodes.length === 0 ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => run(seedTodosAction)}
              className="btn btn-primary mt-4 text-xs"
            >
              Pakai daftar bawaan
            </button>
          ) : null}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="hidden items-end gap-2 px-3 pb-1 pt-2 text-xs text-ink-soft sm:flex">
            {view.doneLabel ? <span className="w-4 shrink-0" /> : null}
            {view.fields.map((f) => (
              <span
                key={fieldKey(f)}
                className={`${WIDTH[f.type]} ${isMoney(f.type) ? "text-right" : ""} ${
                  f.type === "flag" ? "text-center" : ""
                }`}
              >
                {f.label}
              </span>
            ))}
            <span className={ACTIONS_WIDTH} />
          </div>

          {shown.map((node) => {
            const progress = savings.find((s) => s.id === node.id);
            return (
              <div key={node.id}>
                <Row key={rowKey(node)} ctl={ctl} item={node} isChild={false} />
                {progress ? <Progress target={progress} /> : null}
                {node.children.map((child) => (
                  <Row key={rowKey(child)} ctl={ctl} item={child} isChild />
                ))}
                {view.nested ? (
                  <details className="border-t border-line bg-paper px-3 py-2 sm:pl-10">
                    <summary className="cursor-pointer text-xs text-ink-soft">
                      {view.nested.addLabel}
                    </summary>
                    <div className="pt-2">
                      <AddForm ctl={ctl} parentId={node.id} />
                    </div>
                  </details>
                ) : null}
              </div>
            );
          })}

          {view.footer === "budget" ? <BudgetFooter totals={totals} /> : null}
          {view.footer === "planned" ? (
            <div className="flex justify-between border-t border-line bg-paper-deep px-3 py-3 text-sm">
              <span className="text-ink-soft">Total perkiraan</span>
              <span className="tabular font-medium">
                {rupiah(nodes.reduce((t, n) => t + (n.amount_planned ?? 0), 0))}
              </span>
            </div>
          ) : null}
        </div>
      )}

      <div className="card px-3 py-4">
        <AddForm ctl={ctl} parentId={null} />
      </div>
    </div>
  );
}

function BudgetFooter({ totals }: { totals: Totals }) {
  const gap = totals.actual - totals.planned;
  const anything = totals.planned > 0 || totals.actual > 0;
  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-2 border-t border-line bg-paper-deep px-3 py-3 text-sm">
      <span>
        <span className="text-ink-soft">Total estimasi </span>
        <span className="tabular font-medium">{rupiah(totals.planned)}</span>
      </span>
      <span>
        <span className="text-ink-soft">Total realisasi </span>
        <span className="tabular font-medium">{rupiah(totals.actual)}</span>
      </span>
      {anything ? (
        <span className={gap > 0 ? "text-rose" : "text-leaf"}>
          <span className="text-ink-soft">Selisih </span>
          <span className="tabular font-medium">{selisih(gap)}</span>
        </span>
      ) : null}
    </div>
  );
}

function Progress({ target }: { target: SavingsTarget }) {
  const percent =
    target.target > 0
      ? Math.min(100, Math.round((target.saved / target.target) * 100))
      : 0;
  return (
    <div className="border-t border-line bg-paper px-3 py-3 sm:px-10">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 text-sm">
        <span className="tabular">
          {rupiah(target.saved)}{" "}
          <span className="text-ink-soft">dari {rupiah(target.target)}</span>
        </span>
        <span className="text-ink-soft">
          {target.remaining === 0 ? (
            <span className="text-leaf">Target tercapai.</span>
          ) : target.monthsLeft > 0 ? (
            <>
              Sisihkan{" "}
              <span className="tabular font-medium text-ink">
                {rupiah(target.perMonth)}
              </span>{" "}
              per bulan, sisa {target.monthsLeft} bulan
            </>
          ) : (
            <>
              Tenggat sudah lewat. Sisa{" "}
              <span className="tabular font-medium text-ink">
                {rupiah(target.remaining)}
              </span>
            </>
          )}
        </span>
      </div>
      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progres ${target.title}`}
      >
        <div className="h-full rounded-full bg-leaf" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function ShareBlock({
  url,
  pending,
  run,
}: {
  url: string | null;
  pending: boolean;
  run: (fn: () => Promise<ActionResult>) => void;
}) {
  return (
    <div className="card space-y-3 px-4 py-4">
      <div>
        <h2 className="text-sm font-medium">Link baca-saja untuk MC dan vendor</h2>
        <p className="mt-1 text-xs text-ink-soft">
          Mereka selalu melihat versi terbaru tanpa perlu akun. Link ini hanya
          menampilkan rundown — bukan anggaran, daftar tamu, atau pembayaran kamu.
        </p>
      </div>
      {url ? (
        <div className="flex flex-wrap items-center gap-2">
          <input
            readOnly
            value={url}
            aria-label="Link rundown"
            onFocus={(e) => e.currentTarget.select()}
            className="input min-w-[16rem] flex-1 text-xs"
          />
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(url)}
            className="btn btn-ghost text-xs"
          >
            Salin
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => run(revokeShareAction)}
            className="btn btn-danger text-xs"
          >
            Cabut link
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(shareRundownAction)}
          className="btn btn-primary text-xs"
        >
          Buat link
        </button>
      )}
    </div>
  );
}
