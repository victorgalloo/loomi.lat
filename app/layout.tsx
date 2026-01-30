import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "anthana.agency | Data & AI Automation Studio",
  description: "Helping companies turn their data into decisions. Specialized in Databricks, Azure & AI agents.",
  keywords: ["Databricks", "AI", "Data Engineering", "Azure", "AI Agents", "Web Development", "Mobile Development"],
  authors: [{ name: "Anthana" }],
  openGraph: {
    title: "anthana.agency | Data & AI Automation Studio",
    description: "Helping companies turn their data into decisions. Specialized in Databricks, Azure & AI agents.",
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
      <body className={`${dmSans.variable} font-sans`}>{children}</body>
    </html>
  );
}
