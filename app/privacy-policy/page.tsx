"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-600 hover:text-[#FF3621] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <article className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
        <p className="text-gray-500 mb-12">Last updated: January 2026</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-600 leading-relaxed">
              Welcome to Anthana.agency (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your privacy 
              and ensuring the security of your personal information. This Privacy Policy explains how we collect, 
              use, disclose, and safeguard your information when you interact with our services, including our 
              WhatsApp Business and Meta integrations.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
            <p className="text-gray-600 leading-relaxed mb-4">We may collect the following types of information:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li><strong>Contact Information:</strong> Name, phone number, email address</li>
              <li><strong>Communication Data:</strong> Messages exchanged through WhatsApp Business</li>
              <li><strong>Technical Data:</strong> Device information, IP address, browser type</li>
              <li><strong>Usage Data:</strong> How you interact with our services and communications</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-600 leading-relaxed mb-4">We use your information to:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Respond to your inquiries and provide customer support</li>
              <li>Send relevant updates about our services</li>
              <li>Improve our products and services</li>
              <li>Comply with legal obligations</li>
              <li>Enable automated responses through our AI-powered assistant</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Sharing</h2>
            <p className="text-gray-600 leading-relaxed">
              We do not sell your personal information. We may share your data with:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 mt-4">
              <li><strong>Service Providers:</strong> Meta (WhatsApp Business API), cloud hosting providers</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Retention</h2>
            <p className="text-gray-600 leading-relaxed">
              We retain your personal information only for as long as necessary to fulfill the purposes 
              outlined in this policy, unless a longer retention period is required by law.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Your Rights</h2>
            <p className="text-gray-600 leading-relaxed mb-4">You have the right to:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Access your personal data</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of marketing communications</li>
              <li>Withdraw consent at any time</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-4">
              To exercise these rights, please visit our{" "}
              <Link href="/eliminacion" className="text-[#FF3621] hover:underline">
                Data Deletion page
              </Link>
              .
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Security</h2>
            <p className="text-gray-600 leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal 
              information against unauthorized access, alteration, disclosure, or destruction.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Contact Us</h2>
            <p className="text-gray-600 leading-relaxed">
              If you have any questions about this Privacy Policy or our data practices, please contact us at:
            </p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-700 font-medium">Anthana.agency</p>
              <p className="text-gray-600">Email: privacy@anthana.agency</p>
            </div>
          </section>
        </div>
      </article>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-sm text-gray-500">© 2026 Anthana.agency. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
