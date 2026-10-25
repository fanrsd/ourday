import type { ReactNode } from "react";
import type { PALETTES, InvitationContent, InvitationTheme } from "../invitation-content.ts";

/**
 * What a template is handed. The three slots are filled by the public page from
 * components the guest-list and guest-book modules own, so a template never
 * knows how an RSVP is submitted, only where it goes on the page.
 *
 * This lives in its own module so a template can import the type without
 * importing index.ts, which imports every template.
 */
export type TemplateProps = {
  content: InvitationContent;
  theme: InvitationTheme;
  palette: (typeof PALETTES)[keyof typeof PALETTES];
  /** The name from `?to=<token>`, or null for the link pasted in a group chat. */
  guestName: string | null;
  slug: string;
  rsvpSlot: ReactNode;
  wishSlot: ReactNode;
  qrSlot: ReactNode;
  /**
   * The guest-visible run of the day, owned by the planner rather than the
   * invitation document. Null for the couple who never ticked a session, which
   * is most of them — the wrapper is `empty:hidden`, so nothing renders.
   */
  rundownSlot: ReactNode;
};
