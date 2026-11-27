import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ORVEX — Your Entire Business. One Space.",
  description:
    "ORVEX brings your business operations together in one premium workspace.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
