import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono, Noto_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { THEME_COOKIE, parseTheme } from "@/lib/theme";

const playfairDisplayHeading = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-heading",
});

const notoSans = Noto_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NyaySetu — Legal Consultation & Logistics",
  description:
    "Unified platform connecting clients to lawyers for virtual consultations, with a physical logistics network for document delivery.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Read on the server so the first paint already has the right theme.
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);

  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        notoSans.variable,
        playfairDisplayHeading.variable,
        theme === "dark" && "dark"
      )}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
