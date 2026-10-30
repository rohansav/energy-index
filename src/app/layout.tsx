import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SessionProvider } from "@/components/auth/SessionProvider";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import "@/styles/site.css";
import "@/styles/catalogue.css";

export const metadata: Metadata = {
  title: { default: "Energy drink catalogue", template: "%s — Energy index" },
  description:
    "A personal energy drink catalogue: flavor reviews, sensory profiles, and rankings by brand.",
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <SessionProvider>
          <div className="site-shell">
            <SiteHeader />
            <main id="main-content">{children}</main>
            <SiteFooter />
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
