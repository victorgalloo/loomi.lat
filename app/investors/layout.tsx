import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
  title: 'Loomi by Anthana | Investor Data Room',
  description: 'Virtual Data Room for Loomi by Anthana - AI-powered sales agent for WhatsApp. Sandbox DTEC Dubai application.',
  openGraph: {
    title: 'Loomi by Anthana | Investor Data Room',
    description: 'Virtual Data Room for Loomi - AI-powered sales agent for WhatsApp.',
    type: 'website',
  },
};

export default function DataRoomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider defaultTheme="light">
      <div className="antialiased bg-background text-foreground">
        {children}
      </div>
    </ThemeProvider>
  );
}
