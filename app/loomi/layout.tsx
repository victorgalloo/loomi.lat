import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';

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

export default function LoomiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider defaultTheme="light">
      <div className="antialiased bg-background text-foreground transition-colors duration-300">
        {children}
      </div>
    </ThemeProvider>
  );
}
