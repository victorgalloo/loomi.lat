"use client";

import Link from "next/link";
import { Linkedin } from "lucide-react";
import type { Language } from "@/types/landing";
import { getTranslations } from "@/lib/translations";
import { Container } from "./shared";
import { company, styles } from "@/lib/constants";

interface FooterProps {
  language: Language;
}

/**
 * Footer section with navigation links and company info
 */
export default function Footer({ language }: FooterProps) {
  const t = getTranslations("footer", language);

  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <Container className="py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center mb-4">
              <span className="text-xl font-bold text-gray-900">{company.name}</span>
            </Link>
            <p className="text-sm text-gray-500 mb-6 max-w-xs">
              {t.tagline}
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://www.linkedin.com/company/anthana"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#FF3621] hover:border-[#FF3621] transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <FooterLinkGroup 
            title={t.navigation.title} 
            links={t.navigation.links} 
          />

          {/* Products */}
          <FooterLinkGroup 
            title={t.products.title} 
            links={t.products.links}
            useNextLink 
          />

          {/* Legal */}
          <FooterLinkGroup 
            title={t.legal.title} 
            links={t.legal.links} 
          />
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              {t.copyright}
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{t.builtWith.prefix}</span>
              <span className="text-[#FF3621]">{t.builtWith.tech1}</span>
              <span>{t.builtWith.separator}</span>
              <span className="text-[#FF3621]">{t.builtWith.tech2}</span>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}

/**
 * Footer link group component
 */
interface FooterLinkGroupProps {
  title: string;
  links: ReadonlyArray<{ readonly label: string; readonly href: string }>;
  useNextLink?: boolean;
}

function FooterLinkGroup({ title, links, useNextLink = false }: FooterLinkGroupProps) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-900 mb-4">
        {title}
      </h4>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            {useNextLink ? (
              <Link
                href={link.href}
                className="text-sm text-gray-500 hover:text-[#FF3621] transition-colors"
              >
                {link.label}
              </Link>
            ) : (
              <a
                href={link.href}
                className="text-sm text-gray-500 hover:text-[#FF3621] transition-colors"
              >
                {link.label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
