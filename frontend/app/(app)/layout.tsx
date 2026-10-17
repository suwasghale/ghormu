import type { Metadata } from "next";
import "../globals.css";
import Providers from "./providers"
import { site } from "@/config/site"

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s | ${site.name}` },
  description: site.description,
};

/**
 * Root layout for the account, profile and admin screens.
 *
 * The public site under `app/[locale]` has its own root layout, because only
 * a root layout can set `<html lang>` and that differs per language there.
 * These screens are not translated yet, so they stay English and keep the
 * auth and query providers the public pages do not need.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
