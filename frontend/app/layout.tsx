import type { Metadata } from "next";
import "./globals.css";
import Providers from "./(app)/providers"
import { site } from "@/config/site"

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s | ${site.name}` },
  description: site.description,
};

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
