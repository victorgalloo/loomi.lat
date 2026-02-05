import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Data Deletion Request - Loomi by Anthana',
  description: 'Request deletion of your personal data from Loomi, an AI-powered WhatsApp sales agent developed by Anthana.',
  openGraph: {
    title: 'Data Deletion Request - Loomi by Anthana',
    description: 'Request deletion of your personal data from Loomi.',
    type: 'website',
  },
};

export default function DataDeletionPage() {
  return (
    <>
      <style>{`
        .deletion-page * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .deletion-page {
          --text-primary: #1a1a2e;
          --text-secondary: #4a4a68;
          --text-muted: #7a7a96;
          --bg-primary: #ffffff;
          --bg-secondary: #f8f9fc;
          --dd-border: #e4e6ef;
          --accent: #4f46e5;
          --accent-light: #eef2ff;
          --warning: #dc2626;
          --warning-light: #fef2f2;
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          color: var(--text-primary);
          background: var(--bg-primary);
          line-height: 1.7;
          font-size: 16px;
          min-height: 100vh;
        }

        .deletion-page header {
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--dd-border);
          padding: 40px 24px;
        }

        .deletion-page header .container {
          max-width: 800px;
          margin: 0 auto;
        }

        .deletion-page .company-badge {
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

        .deletion-page header h1 {
          font-family: 'DM Serif Display', serif;
          font-size: 36px;
          font-weight: 400;
          color: var(--text-primary);
          margin-bottom: 8px;
        }

        .deletion-page header p {
          color: var(--text-muted);
          font-size: 15px;
        }

        .deletion-page main {
          max-width: 800px;
          margin: 0 auto;
          padding: 48px 24px 80px;
        }

        .deletion-page .intro {
          background: var(--bg-secondary);
          border: 1px solid var(--dd-border);
          border-radius: 12px;
          padding: 28px;
          margin-bottom: 48px;
          font-size: 15px;
          color: var(--text-secondary);
        }

        .deletion-page .intro strong {
          color: var(--text-primary);
        }

        .deletion-page section {
          margin-bottom: 40px;
        }

        .deletion-page h2 {
          font-family: 'DM Serif Display', serif;
          font-size: 24px;
          font-weight: 400;
          color: var(--text-primary);
          margin-bottom: 16px;
          padding-bottom: 10px;
          border-bottom: 2px solid var(--accent-light);
        }

        .deletion-page h3 {
          font-size: 17px;
          font-weight: 600;
          color: var(--text-primary);
          margin-top: 24px;
          margin-bottom: 10px;
        }

        .deletion-page p {
          color: var(--text-secondary);
          margin-bottom: 14px;
        }

        .deletion-page ul, .deletion-page ol {
          color: var(--text-secondary);
          margin-bottom: 14px;
          padding-left: 24px;
        }

        .deletion-page ul li, .deletion-page ol li {
          margin-bottom: 8px;
        }

        .deletion-page a {
          color: var(--accent);
          text-decoration: none;
        }

        .deletion-page a:hover {
          text-decoration: underline;
        }

        .deletion-page .warning-box {
          background: var(--warning-light);
          border: 1px solid var(--warning);
          border-radius: 12px;
          padding: 20px 24px;
          margin: 24px 0;
        }

        .deletion-page .warning-box p {
          color: var(--warning);
          margin-bottom: 0;
          font-weight: 500;
        }

        .deletion-page .steps-box {
          background: var(--bg-secondary);
          border: 1px solid var(--dd-border);
          border-radius: 12px;
          padding: 24px 28px;
          margin: 24px 0;
        }

        .deletion-page .steps-box ol {
          margin-bottom: 0;
        }

        .deletion-page .contact-box {
          background: var(--accent-light);
          border: 1px solid var(--accent);
          border-radius: 12px;
          padding: 24px 28px;
          margin: 24px 0;
        }

        .deletion-page .contact-box h3 {
          color: var(--accent);
          margin-top: 0;
        }

        .deletion-page .contact-box a {
          font-weight: 600;
          font-size: 18px;
        }

        .deletion-page footer {
          background: var(--bg-secondary);
          border-top: 1px solid var(--dd-border);
          padding: 40px 24px;
          text-align: center;
        }

        .deletion-page footer .container {
          max-width: 800px;
          margin: 0 auto;
        }

        .deletion-page footer p {
          color: var(--text-muted);
          font-size: 14px;
        }

        .deletion-page footer .company-name {
          font-weight: 600;
          color: var(--text-primary);
        }

        @media (max-width: 600px) {
          .deletion-page header h1 {
            font-size: 28px;
          }
          .deletion-page h2 {
            font-size: 20px;
          }
          .deletion-page main {
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
      <div className="deletion-page">
        <header>
          <div className="container">
            <div className="company-badge">Anthana · Loomi</div>
            <h1>Data Deletion Request</h1>
            <p>How to request deletion of your personal data</p>
          </div>
        </header>

        <main>
          <div className="intro">
            At <strong>Anthana</strong>, we respect your privacy and your right to control your personal data. This page explains how you can request the deletion of your data from <strong>Loomi</strong>, our AI-powered WhatsApp sales agent platform. The individual responsible for data protection is <strong>Victor Alejandro Jimenez Gallo</strong>.
          </div>

          <section>
            <h2>Your Right to Data Deletion</h2>
            <p>In compliance with applicable data protection laws (including GDPR, CCPA, and Mexico&apos;s LFPDPPP), you have the right to request the deletion of your personal data that we have collected and stored.</p>
            <p>This right applies to:</p>
            <ul>
              <li><strong>Business Users:</strong> Companies and individuals who have signed up to use Loomi</li>
              <li><strong>End Users:</strong> Customers who have interacted with a business through Loomi-powered WhatsApp conversations</li>
            </ul>
          </section>

          <section>
            <h2>How to Request Data Deletion</h2>
            <p>To request the deletion of your personal data, please follow these steps:</p>

            <div className="steps-box">
              <ol>
                <li><strong>Send an email</strong> to our data protection team at <a href="mailto:privacy@anthana.com">privacy@anthana.com</a></li>
                <li><strong>Include in your email:</strong>
                  <ul>
                    <li>Your full name</li>
                    <li>The phone number associated with your WhatsApp interactions (if applicable)</li>
                    <li>The email address associated with your account (if you are a Business User)</li>
                    <li>A clear statement that you are requesting deletion of your personal data</li>
                  </ul>
                </li>
                <li><strong>Verification:</strong> We may contact you to verify your identity before processing your request</li>
              </ol>
            </div>

            <div className="contact-box">
              <h3>Contact for Data Deletion</h3>
              <p>Email: <a href="mailto:privacy@anthana.com">privacy@anthana.com</a></p>
              <p style={{ marginBottom: 0 }}>Subject: Data Deletion Request - Loomi</p>
            </div>
          </section>

          <section>
            <h2>What Data Will Be Deleted</h2>
            <p>Upon verification of your request, we will delete:</p>
            <ul>
              <li>Your personal profile information</li>
              <li>Message history and conversation data</li>
              <li>Any contact information we have stored</li>
              <li>Analytics data associated with your interactions</li>
              <li>Any other personal data we have collected about you</li>
            </ul>

            <div className="warning-box">
              <p>Please note: Some data may be retained for legal, regulatory, or legitimate business purposes (such as fraud prevention or compliance with tax regulations). We will inform you if any data cannot be deleted and the reason why.</p>
            </div>
          </section>

          <section>
            <h2>Processing Time</h2>
            <p>We will process your data deletion request within <strong>30 days</strong> of receiving a verified request. You will receive a confirmation email once the deletion has been completed.</p>
            <p>In some cases, we may need additional time (up to 60 days) for complex requests. If this is the case, we will notify you of the extension and the reasons for it.</p>
          </section>

          <section>
            <h2>For Business Users</h2>
            <p>If you are a Business User of Loomi and wish to delete your account and all associated data:</p>
            <ol>
              <li>Log in to your Loomi dashboard</li>
              <li>Go to Settings</li>
              <li>Contact our support team through the dashboard, or</li>
              <li>Send an email to <a href="mailto:privacy@anthana.com">privacy@anthana.com</a> from your registered email address</li>
            </ol>
            <p>Deleting your Business User account will also delete all end-user conversation data associated with your account.</p>
          </section>

          <section>
            <h2>Questions?</h2>
            <p>If you have any questions about the data deletion process or your privacy rights, please contact us:</p>
            <ul>
              <li><strong>Data Controller:</strong> Victor Alejandro Jimenez Gallo</li>
              <li><strong>Company:</strong> Anthana</li>
              <li><strong>Email:</strong> <a href="mailto:privacy@anthana.com">privacy@anthana.com</a></li>
              <li><strong>Location:</strong> León, Guanajuato, Mexico</li>
            </ul>
            <p>You can also review our full <a href="/privacy">Privacy Policy</a> for more information about how we handle your data.</p>
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
