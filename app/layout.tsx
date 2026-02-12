import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider } from '@/components/theme-provider';
import { ChatBubble } from '@/components/loomi/chat-bubble';
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
    <html lang="es" data-theme="light" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <ThemeProvider defaultTheme="light">
          <div className="antialiased bg-background text-foreground transition-colors duration-300">
            {children}
            <ChatBubble />
          </div>
        </ThemeProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
