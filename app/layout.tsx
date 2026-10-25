import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "OurDay — Rencanakan, undang, sambut", template: "%s · OurDay" },
  description:
    "Wedding planner, undangan website, dan buku tamu digital QR dalam satu daftar tamu.",
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Inter:wght@400;500;600&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
