import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { ThemeProvider } from '@/components/theme-provider';
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: 'Loomi | El agente de ventas que nunca duerme',
  description: 'Arquitectura serverless con razonamiento chain-of-thought, análisis de sentimiento en tiempo real, y memoria contextual persistente. Convierte conversaciones de WhatsApp en demos agendadas.',
  keywords: ['WhatsApp bot', 'sales agent', 'AI', 'automation', 'Claude', 'lead qualification'],
  authors: [{ name: 'Loomi' }],
  openGraph: {
    title: 'Loomi | El agente de ventas que nunca duerme',
    description: 'Arquitectura serverless con razonamiento chain-of-thought y memoria contextual.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" data-theme="dark" suppressHydrationWarning>
      <body className={`${dmSans.variable} font-sans`}>
        <ThemeProvider defaultTheme="dark">
          <div className="antialiased bg-background text-foreground transition-colors duration-300">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
