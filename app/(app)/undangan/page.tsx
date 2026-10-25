import type { Metadata } from "next";
import { currentContext } from "@/lib/current.ts";
import { getOrCreateInvitation } from "@/lib/invitations.ts";
import { Editor } from "./editor.tsx";

export const metadata: Metadata = { title: "Undangan" };

export default async function UndanganPage() {
  const { userId, wedding, owns } = await currentContext();

  // The draft exists from the first visit: the couple fills it in and pays
  // later, which is the whole point of letting them start for free.
  const invitation = await getOrCreateInvitation(userId, wedding.id);

  return (
    <Editor
      invitation={invitation}
      paid={owns.invitation}
      appUrl={process.env.APP_URL ?? ""}
    />
  );
}
