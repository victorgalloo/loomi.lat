import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - Loomi by Anthana',
  description: 'Terms of Service for Loomi, an AI-powered WhatsApp sales agent developed by Anthana.',
  openGraph: {
    title: 'Terms of Service - Loomi by Anthana',
    description: 'Terms of Service for Loomi, an AI-powered WhatsApp sales agent developed by Anthana.',
    type: 'website',
  },
};

export default function TermsOfServicePage() {
  return (
    <>
      <style>{`
        .terms-page * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .terms-page {
          --text-primary: #1a1a2e;
          --text-secondary: #4a4a68;
          --text-muted: #7a7a96;
          --bg-primary: #ffffff;
          --bg-secondary: #f8f9fc;
          --ts-border: #e4e6ef;
          --accent: #4f46e5;
          --accent-light: #eef2ff;
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          color: var(--text-primary);
          background: var(--bg-primary);
          line-height: 1.7;
          font-size: 16px;
          min-height: 100vh;
        }

        .terms-page header {
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--ts-border);
          padding: 40px 24px;
        }

        .terms-page header .container {
          max-width: 800px;
          margin: 0 auto;
        }

        .terms-page .company-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--accent-light);
          color: var(--accent);
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.02em;
          margin-bottom: 20px;
        }

        .terms-page header h1 {
          font-family: 'DM Serif Display', serif;
          font-size: 36px;
          font-weight: 400;
          color: var(--text-primary);
          margin-bottom: 8px;
        }

        .terms-page header p {
          color: var(--text-muted);
          font-size: 15px;
        }

        .terms-page main {
          max-width: 800px;
          margin: 0 auto;
          padding: 48px 24px 80px;
        }

        .terms-page .intro {
          background: var(--bg-secondary);
          border: 1px solid var(--ts-border);
          border-radius: 12px;
          padding: 28px;
          margin-bottom: 48px;
          font-size: 15px;
          color: var(--text-secondary);
        }

        .terms-page .intro strong {
          color: var(--text-primary);
        }

        .terms-page section {
          margin-bottom: 40px;
        }

        .terms-page h2 {
          font-family: 'DM Serif Display', serif;
          font-size: 24px;
          font-weight: 400;
          color: var(--text-primary);
          margin-bottom: 16px;
          padding-bottom: 10px;
          border-bottom: 2px solid var(--accent-light);
        }

        .terms-page h3 {
          font-size: 17px;
          font-weight: 600;
          color: var(--text-primary);
          margin-top: 24px;
          margin-bottom: 10px;
        }

        .terms-page p {
          color: var(--text-secondary);
          margin-bottom: 14px;
        }

        .terms-page ul, .terms-page ol {
          color: var(--text-secondary);
          margin-bottom: 14px;
          padding-left: 24px;
        }

        .terms-page ul li, .terms-page ol li {
          margin-bottom: 8px;
        }

        .terms-page a {
          color: var(--accent);
          text-decoration: none;
        }

        .terms-page a:hover {
          text-decoration: underline;
        }

        .terms-page footer {
          background: var(--bg-secondary);
          border-top: 1px solid var(--ts-border);
          padding: 40px 24px;
          text-align: center;
        }

        .terms-page footer .container {
          max-width: 800px;
          margin: 0 auto;
        }

        .terms-page footer p {
          color: var(--text-muted);
          font-size: 14px;
        }

        .terms-page footer .company-name {
          font-weight: 600;
          color: var(--text-primary);
        }

        @media (max-width: 600px) {
          .terms-page header h1 {
            font-size: 28px;
          }
          .terms-page h2 {
            font-size: 20px;
          }
          .terms-page main {
            padding: 32px 16px 60px;
          }
        }
      `}</style>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap"
        rel="stylesheet"
      />
      <div className="terms-page">
        <header>
          <div className="container">
            <div className="company-badge">Anthana · Loomi</div>
            <h1>Terms of Service</h1>
            <p>Last updated: February 5, 2026</p>
          </div>
        </header>

        <main>
          <div className="intro">
            Welcome to <strong>Loomi</strong>. These Terms of Service (&quot;Terms&quot;) govern your access to and use of the Loomi platform, an AI-powered WhatsApp sales agent service developed and operated by <strong>Anthana</strong> (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). By accessing or using our Service, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use our Service.
          </div>

          <section>
            <h2>1. Definitions</h2>
            <ul>
              <li><strong>&quot;Service&quot;</strong> refers to the Loomi platform, including all features, functionalities, and related services.</li>
              <li><strong>&quot;User&quot;</strong> or <strong>&quot;Business User&quot;</strong> refers to any individual or entity that registers for and uses the Service.</li>
              <li><strong>&quot;End User&quot;</strong> refers to customers who interact with a Business User through Loomi-powered WhatsApp conversations.</li>
              <li><strong>&quot;Content&quot;</strong> refers to any text, images, data, or other materials uploaded, transmitted, or displayed through the Service.</li>
            </ul>
          </section>

          <section>
            <h2>2. Eligibility</h2>
            <p>To use the Service, you must:</p>
            <ul>
              <li>Be at least 18 years of age</li>
              <li>Have the legal capacity to enter into a binding agreement</li>
              <li>Not be prohibited from using the Service under applicable laws</li>
              <li>Have a valid WhatsApp Business Account or be eligible to create one</li>
            </ul>
            <p>By using the Service, you represent and warrant that you meet all eligibility requirements.</p>
          </section>

          <section>
            <h2>3. Account Registration</h2>
            <p>To access the Service, you must create an account by providing accurate, complete, and current information. You are responsible for:</p>
            <ul>
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use of your account</li>
              <li>Ensuring that your account information remains accurate and up-to-date</li>
            </ul>
            <p>We reserve the right to suspend or terminate accounts that violate these Terms or for any other reason at our sole discretion.</p>
          </section>

          <section>
            <h2>4. Service Description</h2>
            <p>Loomi provides an AI-powered conversational sales agent that operates through WhatsApp Business API. The Service includes:</p>
            <ul>
              <li>Automated customer interaction and response generation</li>
              <li>Lead qualification and management</li>
              <li>WhatsApp message template management</li>
              <li>Conversation analytics and reporting</li>
              <li>CRM integration capabilities</li>
              <li>Broadcast messaging features</li>
            </ul>
            <p>We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time with or without notice.</p>
          </section>

          <section>
            <h2>5. Acceptable Use</h2>
            <p>You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree NOT to:</p>
            <ul>
              <li>Use the Service for any illegal, fraudulent, or unauthorized purpose</li>
              <li>Send spam, unsolicited messages, or bulk messages without proper consent</li>
              <li>Violate Meta&apos;s WhatsApp Business Policy or Terms of Service</li>
              <li>Transmit any content that is harmful, threatening, abusive, defamatory, or otherwise objectionable</li>
              <li>Impersonate any person or entity or misrepresent your affiliation</li>
              <li>Attempt to gain unauthorized access to the Service or its related systems</li>
              <li>Use the Service to collect personal data without proper consent</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
              <li>Use the Service in a manner that could damage, disable, or impair the Service</li>
            </ul>
          </section>

          <section>
            <h2>6. WhatsApp Business API Compliance</h2>
            <p>As a user of Loomi, you acknowledge and agree that:</p>
            <ul>
              <li>You must comply with Meta&apos;s WhatsApp Business Policy and Commerce Policy</li>
              <li>You are responsible for obtaining proper consent before sending messages to End Users</li>
              <li>You must use approved message templates for business-initiated conversations</li>
              <li>You will not use the Service to send prohibited content as defined by Meta</li>
              <li>Your use of WhatsApp Business API through Loomi is subject to Meta&apos;s terms and policies</li>
            </ul>
            <p>Violation of Meta&apos;s policies may result in suspension of your WhatsApp Business Account and/or termination of your Loomi account.</p>
          </section>

          <section>
            <h2>7. Fees and Payment</h2>
            <p>Access to the Service may require payment of fees as described on our pricing page or in a separate agreement. You agree to:</p>
            <ul>
              <li>Pay all applicable fees in accordance with the billing terms</li>
              <li>Provide accurate billing and payment information</li>
              <li>Authorize us to charge your payment method for all fees due</li>
            </ul>
            <p>All fees are non-refundable unless otherwise specified. We reserve the right to change our fees with 30 days&apos; notice. Continued use of the Service after a fee change constitutes acceptance of the new fees.</p>
          </section>

          <section>
            <h2>8. Intellectual Property</h2>
            <h3>8.1 Our Intellectual Property</h3>
            <p>The Service, including its original content, features, and functionality, is owned by Anthana and is protected by international copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, sell, or lease any part of the Service without our prior written consent.</p>

            <h3>8.2 Your Content</h3>
            <p>You retain ownership of any Content you submit through the Service. By submitting Content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and display such Content solely for the purpose of providing and improving the Service.</p>

            <h3>8.3 AI-Generated Content</h3>
            <p>Content generated by Loomi&apos;s AI is provided &quot;as is&quot; and you are responsible for reviewing and approving such content before it is sent to End Users.</p>
          </section>

          <section>
            <h2>9. Data Protection and Privacy</h2>
            <p>Your use of the Service is also governed by our <a href="/privacy">Privacy Policy</a>, which describes how we collect, use, and protect your personal data. By using the Service, you consent to our data practices as described in the Privacy Policy.</p>
            <p>You are responsible for complying with applicable data protection laws in your jurisdiction when using the Service to process End User data.</p>
          </section>

          <section>
            <h2>10. Disclaimer of Warranties</h2>
            <p>THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</p>
            <p>We do not warrant that:</p>
            <ul>
              <li>The Service will be uninterrupted, secure, or error-free</li>
              <li>The results obtained from the Service will be accurate or reliable</li>
              <li>The AI-generated responses will be appropriate for all situations</li>
              <li>Any errors in the Service will be corrected</li>
            </ul>
          </section>

          <section>
            <h2>11. Limitation of Liability</h2>
            <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, ANTHANA AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, OR GOODWILL, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE.</p>
            <p>IN NO EVENT SHALL OUR TOTAL LIABILITY EXCEED THE AMOUNT PAID BY YOU TO US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.</p>
          </section>

          <section>
            <h2>12. Indemnification</h2>
            <p>You agree to indemnify, defend, and hold harmless Anthana and its officers, directors, employees, and agents from and against any claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys&apos; fees) arising out of or related to:</p>
            <ul>
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any rights of another party</li>
              <li>Your Content or data processed through the Service</li>
            </ul>
          </section>

          <section>
            <h2>13. Termination</h2>
            <p>We may terminate or suspend your access to the Service immediately, without prior notice or liability, for any reason, including if you breach these Terms.</p>
            <p>Upon termination:</p>
            <ul>
              <li>Your right to use the Service will immediately cease</li>
              <li>We may delete your account and all associated data</li>
              <li>Provisions that by their nature should survive termination shall survive</li>
            </ul>
            <p>You may terminate your account at any time by contacting us or through your account settings.</p>
          </section>

          <section>
            <h2>14. Changes to Terms</h2>
            <p>We reserve the right to modify these Terms at any time. We will notify you of material changes by posting the updated Terms on this page and updating the &quot;Last updated&quot; date. Your continued use of the Service after such changes constitutes acceptance of the new Terms.</p>
          </section>

          <section>
            <h2>15. Governing Law</h2>
            <p>These Terms shall be governed by and construed in accordance with the laws of Mexico, without regard to its conflict of law provisions. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts located in León, Guanajuato, Mexico.</p>
          </section>

          <section>
            <h2>16. Severability</h2>
            <p>If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.</p>
          </section>

          <section>
            <h2>17. Entire Agreement</h2>
            <p>These Terms, together with our Privacy Policy and any other agreements expressly incorporated by reference, constitute the entire agreement between you and Anthana regarding the Service.</p>
          </section>

          <section>
            <h2>18. Contact Us</h2>
            <p>If you have any questions about these Terms of Service, please contact us:</p>
            <ul>
              <li><strong>Company:</strong> Anthana</li>
              <li><strong>Representative:</strong> Victor Alejandro Jimenez Gallo</li>
              <li><strong>Email:</strong> <a href="mailto:legal@anthana.com">legal@anthana.com</a></li>
              <li><strong>Location:</strong> León, Guanajuato, Mexico</li>
            </ul>
          </section>
        </main>

        <footer>
          <div className="container">
            <p><span className="company-name">Anthana</span> · Loomi — AI-Powered WhatsApp Sales Agent</p>
            <p style={{ marginTop: '8px' }}>© 2026 Anthana. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
