import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
import { themeInitScript } from "@/lib/theme-script";
import "./globals.css";

const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "JLPT N1 Review",
    template: "%s · JLPT N1 Review",
  },
  description: "Mobile-first vocabulary review for JLPT N1.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${notoSansJp.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full bg-paper font-sans text-ink">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
