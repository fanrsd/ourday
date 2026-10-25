"use client";

import { useState, useTransition } from "react";
import { setSentAction } from "./actions.ts";

/**
 * Opens the guest's own WhatsApp thread with the message and their personal link
 * already typed, then records that we sent it. The window has to open in the
 * same tick as the click or the browser treats it as a popup and blocks it, so
 * the marking happens after.
 *
 * The caption lives in here rather than beside it in the table: the button reads
 * local state and the caption would read un-revalidated server state, so the one
 * cell would briefly say both "Kirim ulang" and "Belum dikirim".
 */
export function SendWhatsApp({
  guestId,
  waHref,
  sentAt,
  openedAt,
}: {
  guestId: string;
  waHref: string | null;
  sentAt: string | null;
  openedAt: string | null;
}) {
  const [sent, setSent] = useState(sentAt != null);
  const [pending, start] = useTransition();

  const mark = (next: boolean) =>
    start(async () => {
      await setSentAction(guestId, next);
      setSent(next);
    });

  return (
    <>
      {waHref ? (
        <span className="flex items-center gap-2 whitespace-nowrap">
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost text-xs"
            onClick={() => mark(true)}
          >
            {sent ? "Kirim ulang" : "Kirim WhatsApp"}
          </a>
          {sent ? (
            <button
              type="button"
              className="text-xs text-ink-soft underline underline-offset-2 hover:text-ink"
              disabled={pending}
              onClick={() => mark(false)}
            >
              Batalkan tanda
            </button>
          ) : null}
        </span>
      ) : (
        <span className="text-xs text-ink-soft">Nomor belum diisi</span>
      )}

      {/* "Terkirim", never "Diterima": a wa.me deep link cannot tell us the
          message arrived, so this only ever claims that we sent it. */}
      <div className="mt-1 text-xs text-ink-soft">
        {sent ? "Terkirim" : "Belum dikirim"}
        {openedAt ? " · sudah dibuka" : ""}
      </div>
    </>
  );
}

/** Deleting a guest deletes their RSVP with them, so it asks first. */
export function ConfirmSubmit({
  children,
  confirm,
  className,
}: {
  children: React.ReactNode;
  confirm: string;
  className: string;
}) {
  return (
    <button
      className={className}
      onClick={(e) => {
        if (!window.confirm(confirm)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}

/**
 * The link the couple pastes into a story or a group chat. It carries no token,
 * so anyone opening it gets the invitation without a name and their RSVP is not
 * bound to a guest row.
 */
export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <span className="flex flex-wrap items-center gap-2">
      <code className="rounded bg-paper-deep px-2 py-1 text-xs break-all">{url}</code>
      <button
        type="button"
        className="btn btn-ghost text-xs"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            // Clipboard is blocked without https or permission; the text is
            // already on screen and selectable, so this is not worth an error.
          }
        }}
      >
        {copied ? "Tersalin" : "Salin"}
      </button>
    </span>
  );
}
