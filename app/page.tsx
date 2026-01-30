// Main landing page for anthana.agency
// Last updated: January 2025
"use client";

import { useState } from "react";
import type { Language } from "@/types/landing";
import {
  Header,
  Hero,
  Services,
  Projects,
  Skills,
  Team,
  Contact,
  Footer,
} from "@/components/landing";

/**
 * Landing page with all sections
 */
export default function Home() {
  const [language, setLanguage] = useState<Language>("EN");

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <Header language={language} onLanguageChange={setLanguage} />
      <Hero language={language} />
      <Services language={language} />
      <Projects language={language} />
      <Skills language={language} />
      <Team language={language} />
      <Contact language={language} />
      <Footer language={language} />
    </main>
  );
}
