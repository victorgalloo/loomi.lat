import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - Loomi by Anthana',
  description: 'Privacy Policy for Loomi, an AI-powered WhatsApp sales agent developed by Anthana.',
  openGraph: {
    title: 'Privacy Policy - Loomi by Anthana',
    description: 'Privacy Policy for Loomi, an AI-powered WhatsApp sales agent developed by Anthana.',
    type: 'website',
  },
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <style>{`
        .privacy-page * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .privacy-page {
          --text-primary: #1a1a2e;
          --text-secondary: #4a4a68;
          --text-muted: #7a7a96;
          --bg-primary: #ffffff;
          --bg-secondary: #f8f9fc;
          --pp-border: #e4e6ef;
          --accent: #4f46e5;
          --accent-light: #eef2ff;
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          color: var(--text-primary);
          background: var(--bg-primary);
          line-height: 1.7;
          font-size: 16px;
          min-height: 100vh;
        }

        .privacy-page header {
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--pp-border);
          padding: 40px 24px;
        }

        .privacy-page header .container {
          max-width: 800px;
          margin: 0 auto;
        }

        .privacy-page .company-badge {
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

        .privacy-page header h1 {
          font-family: 'DM Serif Display', serif;
          font-size: 36px;
          font-weight: 400;
          color: var(--text-primary);
          margin-bottom: 8px;
        }

        .privacy-page header p {
          color: var(--text-muted);
          font-size: 15px;
        }

        .privacy-page main {
          max-width: 800px;
          margin: 0 auto;
          padding: 48px 24px 80px;
        }

        .privacy-page .intro {
          background: var(--bg-secondary);
          border: 1px solid var(--pp-border);
          border-radius: 12px;
          padding: 28px;
          margin-bottom: 48px;
          font-size: 15px;
          color: var(--text-secondary);
        }

        .privacy-page .intro strong {
          color: var(--text-primary);
        }

        .privacy-page section {
          margin-bottom: 40px;
        }

        .privacy-page h2 {
          font-family: 'DM Serif Display', serif;
          font-size: 24px;
          font-weight: 400;
          color: var(--text-primary);
          margin-bottom: 16px;
          padding-bottom: 10px;
          border-bottom: 2px solid var(--accent-light);
        }

        .privacy-page h3 {
          font-size: 17px;
          font-weight: 600;
          color: var(--text-primary);
          margin-top: 24px;
          margin-bottom: 10px;
        }

        .privacy-page p {
          color: var(--text-secondary);
          margin-bottom: 14px;
        }

        .privacy-page ul {
          color: var(--text-secondary);
          margin-bottom: 14px;
          padding-left: 24px;
        }

        .privacy-page ul li {
          margin-bottom: 8px;
        }

        .privacy-page a {
          color: var(--accent);
          text-decoration: none;
        }

        .privacy-page a:hover {
          text-decoration: underline;
        }

        .privacy-page .table-wrapper {
          overflow-x: auto;
          margin: 16px 0;
        }

        .privacy-page table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        .privacy-page th {
          background: var(--bg-secondary);
          text-align: left;
          padding: 12px 16px;
          font-weight: 600;
          color: var(--text-primary);
          border: 1px solid var(--pp-border);
        }

        .privacy-page td {
          padding: 12px 16px;
          border: 1px solid var(--pp-border);
          color: var(--text-secondary);
        }

        .privacy-page footer {
          background: var(--bg-secondary);
          border-top: 1px solid var(--pp-border);
          padding: 40px 24px;
          text-align: center;
        }

        .privacy-page footer .container {
          max-width: 800px;
          margin: 0 auto;
        }

        .privacy-page footer p {
          color: var(--text-muted);
          font-size: 14px;
        }

        .privacy-page footer .company-name {
          font-weight: 600;
          color: var(--text-primary);
        }

        @media (max-width: 600px) {
          .privacy-page header h1 {
            font-size: 28px;
          }
          .privacy-page h2 {
            font-size: 20px;
          }
          .privacy-page main {
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
      <div className="privacy-page">
        <header>
          <div className="container">
            <div className="company-badge">Anthana · Loomi</div>
            <h1>Privacy Policy</h1>
            <p>Last updated: February 5, 2026</p>
          </div>
        </header>

        <main>
          <div className="intro">
            This Privacy Policy describes how <strong>Anthana</strong> (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), the developer and operator of <strong>Loomi</strong> (&quot;the App&quot;, &quot;the Service&quot;), collects, uses, stores, and shares your personal information when you use our AI-powered WhatsApp sales agent platform. Anthana is a software development company based in León, Guanajuato, Mexico. The individual responsible for the processing and protection of your personal data is <strong>Victor Alejandro Jimenez Gallo</strong>.
          </div>

          <section>
            <h2>1. About Loomi</h2>
            <p>Loomi is an AI-powered conversational sales agent that operates through WhatsApp Business API. Loomi helps businesses automate customer interactions, manage leads, and drive sales through intelligent WhatsApp conversations. The Service is developed and operated by Anthana.</p>
            <p>Loomi integrates with Meta&apos;s WhatsApp Business Platform to send and receive messages, manage message templates, and facilitate business-customer communications on behalf of our clients (&quot;Business Users&quot;).</p>
          </section>

          <section>
            <h2>2. Information We Collect</h2>

            <h3>2.1 Information from Business Users</h3>
            <p>When businesses sign up to use Loomi, we collect:</p>
            <ul>
              <li>Business name, contact information, and email address</li>
              <li>WhatsApp Business Account information and phone numbers</li>
              <li>Meta Business account credentials and access tokens (via Meta&apos;s OAuth or Embedded Signup flow)</li>
              <li>Payment and billing information (processed securely via Stripe)</li>
              <li>Product catalogs, pricing information, and business rules provided for AI configuration</li>
            </ul>

            <h3>2.2 Information from End Users (Customers of Business Users)</h3>
            <p>When end users interact with a Business User&apos;s WhatsApp number powered by Loomi, we may collect:</p>
            <ul>
              <li>WhatsApp phone number and display name</li>
              <li>Message content exchanged during conversations</li>
              <li>Timestamps and metadata of interactions</li>
              <li>Any information voluntarily provided during the conversation (e.g., name, preferences, inquiries)</li>
            </ul>

            <h3>2.3 Automatically Collected Information</h3>
            <ul>
              <li>Webhook event data from WhatsApp Business API</li>
              <li>Message delivery and read status</li>
              <li>Conversation analytics and performance metrics</li>
              <li>Log data, including IP addresses and timestamps</li>
            </ul>
          </section>

          <section>
            <h2>3. How We Use Your Information</h2>
            <p>We use the collected information for the following purposes:</p>
            <ul>
              <li><strong>Service Delivery:</strong> To operate, maintain, and improve the Loomi platform, including sending and receiving messages via WhatsApp Business API on behalf of Business Users</li>
              <li><strong>AI-Powered Conversations:</strong> To generate contextually relevant responses to customer inquiries using artificial intelligence</li>
              <li><strong>Template Management:</strong> To create, manage, and send WhatsApp message templates as approved by Meta</li>
              <li><strong>Analytics:</strong> To provide Business Users with insights about their customer interactions and sales performance</li>
              <li><strong>CRM Functionality:</strong> To manage leads, track customer interactions, and support sales workflows</li>
              <li><strong>Billing:</strong> To process payments and manage subscriptions</li>
              <li><strong>Compliance:</strong> To comply with legal obligations and Meta&apos;s Platform Terms</li>
              <li><strong>Improvement:</strong> To enhance, develop, and improve our services and AI capabilities</li>
            </ul>
          </section>

          <section>
            <h2>4. Data Sharing and Third Parties</h2>
            <p>We share personal information only as described below:</p>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Third Party</th>
                    <th>Purpose</th>
                    <th>Data Shared</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Meta Platforms, Inc.</strong></td>
                    <td>WhatsApp Business API messaging, template management, and account connectivity</td>
                    <td>Messages, phone numbers, business account data, template content</td>
                  </tr>
                  <tr>
                    <td><strong>OpenAI / AI Providers</strong></td>
                    <td>AI-powered conversation generation</td>
                    <td>Anonymized conversation context for response generation</td>
                  </tr>
                  <tr>
                    <td><strong>Stripe</strong></td>
                    <td>Payment processing</td>
                    <td>Billing and payment information</td>
                  </tr>
                  <tr>
                    <td><strong>Supabase</strong></td>
                    <td>Database infrastructure and data storage</td>
                    <td>Application data stored in secured databases</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p>We do not sell personal information to third parties. We may also share information when required by law, to protect our legal rights, or to prevent fraud or security threats.</p>
          </section>

          <section>
            <h2>5. Data Retention</h2>
            <p>We retain personal information for as long as necessary to provide our services and fulfill the purposes outlined in this policy. Specifically:</p>
            <ul>
              <li><strong>Conversation data:</strong> Retained for the duration of the Business User&apos;s active subscription, plus 90 days after account termination</li>
              <li><strong>Account information:</strong> Retained for as long as the account is active and for a reasonable period thereafter for legal and business purposes</li>
              <li><strong>Payment records:</strong> Retained as required by applicable tax and accounting regulations</li>
            </ul>
            <p>Business Users may request deletion of their data and their end users&apos; data at any time by contacting us.</p>
          </section>

          <section>
            <h2>6. Data Security</h2>
            <p>We implement industry-standard security measures to protect personal information, including:</p>
            <ul>
              <li>Encryption of data in transit (TLS/SSL) and at rest</li>
              <li>Secure authentication and access controls</li>
              <li>Regular security reviews and monitoring</li>
              <li>Secure API key and token management</li>
            </ul>
            <p>While we strive to protect your information, no method of electronic transmission or storage is 100% secure. We cannot guarantee absolute security of your data.</p>
          </section>

          <section>
            <h2>7. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the following rights regarding your personal information:</p>
            <ul>
              <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
              <li><strong>Rectification:</strong> Request correction of inaccurate or incomplete data</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information</li>
              <li><strong>Portability:</strong> Request a copy of your data in a structured, machine-readable format</li>
              <li><strong>Restriction:</strong> Request that we limit the processing of your data</li>
              <li><strong>Objection:</strong> Object to the processing of your data for certain purposes</li>
            </ul>
            <p>To exercise any of these rights, please contact us using the details provided below. We will respond to your request within 30 days.</p>
          </section>

          <section>
            <h2>8. International Data Transfers</h2>
            <p>Your information may be transferred to and processed in countries other than your country of residence, including Mexico and the United States, where our service providers operate. We ensure appropriate safeguards are in place to protect your information in accordance with applicable data protection laws.</p>
          </section>

          <section>
            <h2>9. Children&apos;s Privacy</h2>
            <p>Our Service is not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected personal data from a child, we will take steps to delete that information promptly.</p>
          </section>

          <section>
            <h2>10. Use of Meta Platform Data</h2>
            <p>Loomi accesses Meta Platform data (including WhatsApp Business API) in compliance with <a href="https://developers.facebook.com/terms/" target="_blank" rel="noopener noreferrer">Meta&apos;s Platform Terms</a> and <a href="https://developers.facebook.com/devpolicy/" target="_blank" rel="noopener noreferrer">Developer Policies</a>. We use Meta Platform data solely for the purposes of providing our WhatsApp-based messaging services as described in this policy. We do not use Meta Platform data for purposes unrelated to our Service, including unauthorized advertising, data brokering, or surveillance.</p>
          </section>

          <section>
            <h2>11. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time to reflect changes in our practices, technology, or legal requirements. We will notify Business Users of material changes via email or through our platform. The &quot;Last updated&quot; date at the top of this page indicates when this policy was last revised.</p>
          </section>

          <section>
            <h2>12. Contact Us</h2>
            <p>If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:</p>
            <ul>
              <li><strong>Data Controller:</strong> Victor Alejandro Jimenez Gallo</li>
              <li><strong>Company:</strong> Anthana</li>
              <li><strong>Email:</strong> privacy@anthana.com</li>
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
