'use client';

import { motion } from 'framer-motion';
import { Download, Linkedin, Mail, CheckCircle2 } from 'lucide-react';

const DOCUMENTS = [
  { title: 'Pitch Deck', description: '10-page investor presentation', url: '/investors/pitch-deck-final.pdf', icon: '📊' },
  { title: 'One-Pager', description: 'Executive summary', url: '/investors/one-pager.pdf', icon: '📄' },
  { title: 'Business Plan', description: 'Full business plan', url: '/investors/business-plan.pdf', icon: '📑' },
  { title: 'Market Trends', description: 'One-page market analysis', url: '/investors/market-trends.pdf', icon: '📈' },
];

const TEAM = [
  {
    name: 'Victor Gallo',
    role: 'Co-Founder & CEO',
    company: 'ex-Konfío, ex-Globant',
    description: 'Growth & commercialization. B2B sales expertise in LATAM.',
    linkedin: 'https://www.linkedin.com/in/victorgalloo/',
    initial: 'V',
  },
  {
    name: 'Carlos Cardona',
    role: 'Co-Founder & CPO',
    company: 'ex-Disney',
    description: 'Former PM at Disney. Shipped products used by millions.',
    linkedin: 'https://www.linkedin.com/in/carloscardonadev/',
    initial: 'C',
  },
  {
    name: 'JJ Cardona',
    role: 'Co-Founder & CDO',
    company: 'ex-Grupo Bimbo',
    description: 'Data expert at Grupo Bimbo (Fortune 500).',
    linkedin: 'https://www.linkedin.com/in/jjcardon/',
    initial: 'J',
  },
];

export default function InvestorsPage() {
  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      {/* Cinematic background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px]"
          style={{
            background: 'radial-gradient(ellipse at center top, rgba(0,255,102,0.12) 0%, rgba(0,255,102,0.04) 40%, transparent 70%)',
          }}
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-8 py-20">

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-24"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-muted mb-8 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-neon-green" />
            Investor Data Room
          </p>
          <h1 className="text-8xl sm:text-9xl font-black tracking-tighter mb-6 relative">
            <span
              className="absolute inset-0 text-neon-green blur-3xl opacity-30"
              aria-hidden="true"
            >
              LOOMI
            </span>
            <span className="relative">LOOMI</span>
          </h1>
          <p className="text-xl text-muted font-light">
            The AI sales agent that closes while you sleep
          </p>
          <p className="text-sm text-muted/60 mt-4">by Anthana · January 2026</p>
        </motion.header>

        {/* Key Metrics */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-28"
        >
          <div className="flex justify-center gap-20">
            {[
              { value: '$45K', label: 'Verified Revenue' },
              { value: 'MVP', label: 'Product Ready' },
              { value: '$23B+', label: 'TAM' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-6xl font-black tracking-tight mb-2">{stat.value}</p>
                <p className="text-xs uppercase tracking-wider text-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Company Overview */}
        <Section title="Company" accent="Overview.">
          <p className="text-lg text-muted leading-relaxed mb-10">
            <strong className="text-foreground">Loomi</strong> is an AI-powered sales agent for WhatsApp, built by{' '}
            <strong className="text-foreground">Anthana</strong>, a profitable software company.
          </p>
          <table className="w-full">
            <tbody>
              {[
                ['Company', 'Anthana (Parent) → Loomi (Product)'],
                ['Location', 'León, Mexico → Expanding to Dubai'],
                ['Founded', '2024'],
                ['Stage', 'Pre-seed / MVP'],
                ['Industry', 'AI & ML / SaaS'],
                ['Revenue', '$45,000 USD (verified)'],
              ].map(([label, value], i) => (
                <tr key={label} className="border-b border-border/50">
                  <td className="py-4 text-muted font-medium w-40">{label}</td>
                  <td className={`py-4 ${i === 5 ? 'text-neon-green font-bold' : ''}`}>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* Founding Team */}
        <Section title="Founding" accent="Team.">
          <p className="text-lg text-muted leading-relaxed mb-10">
            Experienced operators from global companies with proven execution capabilities.
          </p>
          <div className="space-y-10">
            {TEAM.map((member) => (
              <div key={member.name} className="flex gap-6 items-start">
                <div className="w-16 h-16 rounded-full bg-neon-green flex items-center justify-center text-2xl font-bold text-background flex-shrink-0">
                  {member.initial}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{member.name}</h3>
                  <p className="text-neon-green font-medium text-sm">{member.role}</p>
                  <p className="text-muted text-sm mb-2">{member.company}</p>
                  <p className="text-muted">{member.description}</p>
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-muted hover:text-neon-green mt-2 transition-colors"
                  >
                    <Linkedin className="w-4 h-4" />
                    LinkedIn
                  </a>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Key Documents */}
        <Section title="Key" accent="Documents.">
          <div className="space-y-4">
            {DOCUMENTS.map((doc) => (
              <a
                key={doc.title}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between py-5 border-b border-border/50 group hover:border-neon-green/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{doc.icon}</span>
                  <div>
                    <h3 className="font-bold text-lg group-hover:text-neon-green transition-colors">{doc.title}</h3>
                    <p className="text-sm text-muted">{doc.description}</p>
                  </div>
                </div>
                <Download className="w-5 h-5 text-muted group-hover:text-neon-green transition-colors" />
              </a>
            ))}
          </div>
        </Section>

        {/* Financial Projections */}
        <Section title="Financial" accent="Projections.">
          <div className="flex justify-between mb-12">
            {[
              { year: '2026', arr: '$300K' },
              { year: '2027', arr: '$1.2M' },
              { year: '2028', arr: '$3.6M' },
            ].map((item) => (
              <div key={item.year} className="text-center">
                <p className="text-sm text-muted mb-2">{item.year}</p>
                <p className="text-4xl font-black text-neon-green">{item.arr}</p>
                <p className="text-xs text-muted uppercase tracking-wider mt-1">ARR</p>
              </div>
            ))}
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="text-left py-3 text-xs uppercase tracking-wider text-muted font-semibold">Year</th>
                <th className="text-left py-3 text-xs uppercase tracking-wider text-muted font-semibold">Customers</th>
                <th className="text-left py-3 text-xs uppercase tracking-wider text-muted font-semibold">MRR</th>
                <th className="text-left py-3 text-xs uppercase tracking-wider text-muted font-semibold">ARR</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['2026', '50', '$25,000', '$300,000'],
                ['2027', '200', '$100,000', '$1,200,000'],
                ['2028', '500+', '$300,000', '$3,600,000'],
              ].map((row) => (
                <tr key={row[0]} className="border-b border-border/50">
                  <td className="py-4 font-medium">{row[0]}</td>
                  <td className="py-4 text-muted">{row[1]}</td>
                  <td className="py-4 text-muted">{row[2]}</td>
                  <td className="py-4 font-bold text-neon-green">{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* Product & Technology */}
        <Section title="Product &" accent="Technology.">
          <table className="w-full mb-10">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="text-left py-3 text-xs uppercase tracking-wider text-muted font-semibold">Integration</th>
                <th className="text-left py-3 text-xs uppercase tracking-wider text-muted font-semibold">Status</th>
                <th className="text-left py-3 text-xs uppercase tracking-wider text-muted font-semibold">Purpose</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['WhatsApp Business API', 'Live', 'Core messaging platform'],
                ['Stripe', 'Live', 'Payment processing in-chat'],
                ['Eleven Labs', 'Live', 'Voice AI (voice notes/calls)'],
                ['OpenAI/LLMs', 'Live', 'Conversational AI engine'],
              ].map((row) => (
                <tr key={row[0]} className="border-b border-border/50">
                  <td className="py-4 font-medium">{row[0]}</td>
                  <td className="py-4">
                    <span className="inline-flex items-center gap-1.5 text-neon-green font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      {row[1]}
                    </span>
                  </td>
                  <td className="py-4 text-muted">{row[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="grid grid-cols-2 gap-4">
            {[
              '24/7 AI sales conversations',
              'Automated lead qualification',
              'In-chat payment collection',
              'Voice AI integration',
              'Multi-language support',
              'CRM & Calendar sync',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-neon-green flex-shrink-0" />
                <span className="text-muted">{feature}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Market Opportunity */}
        <Section title="$23B+" accent="Market.">
          <p className="text-lg text-muted leading-relaxed mb-10">
            Two high-growth regions with WhatsApp dominance and underserved SMB markets.
          </p>
          <div className="grid grid-cols-2 gap-16">
            <div>
              <h3 className="font-bold text-lg mb-4">Latin America (Current)</h3>
              <table className="w-full">
                <tbody>
                  {[
                    ['Total SMBs', '30+ million'],
                    ['WhatsApp', '95%+ penetration'],
                    ['Growth', '25% annually'],
                    ['TAM', '$15B+'],
                  ].map(([label, value]) => (
                    <tr key={label} className="border-b border-border/50">
                      <td className="py-3 text-muted">{label}</td>
                      <td className="py-3 font-semibold">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">MENA (Expansion)</h3>
              <table className="w-full">
                <tbody>
                  {[
                    ['Total SMBs', '5+ million'],
                    ['WhatsApp', '85%+ penetration'],
                    ['Digital Spend', '$15B annually'],
                    ['TAM', '$8B+'],
                  ].map(([label, value]) => (
                    <tr key={label} className="border-b border-border/50">
                      <td className="py-3 text-muted">{label}</td>
                      <td className="py-3 font-semibold">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Section>

        {/* Traction */}
        <Section title="Traction &" accent="Validation.">
          <div className="grid grid-cols-2 gap-12">
            <div>
              <h3 className="font-bold mb-4">Anthana (Parent Company)</h3>
              <ul className="space-y-3">
                {[
                  'Founded 2024',
                  '$45,000 USD verified revenue',
                  'Cash-flow positive',
                  '10+ clients served',
                  '3 co-founders + contractors',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-muted">
                    <CheckCircle2 className="w-4 h-4 text-neon-green flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Loomi (Product)</h3>
              <ul className="space-y-3">
                {[
                  'WhatsApp Business API ✓',
                  'AI Conversational Engine ✓',
                  'Stripe Payments ✓',
                  'ElevenLabs Voice AI ✓',
                  'Calendar + CRM Sync ✓',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-muted">
                    <CheckCircle2 className="w-4 h-4 text-neon-green flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        {/* Contact */}
        <Section title="Get in" accent="Touch.">
          <div className="flex items-center gap-8">
            <div className="w-20 h-20 rounded-full bg-neon-green flex items-center justify-center text-3xl font-bold text-background">
              V
            </div>
            <div>
              <h3 className="text-2xl font-bold">Victor Gallo</h3>
              <p className="text-muted mb-4">Co-Founder & CEO</p>
              <div className="flex gap-6">
                <a
                  href="mailto:hello@anthanagroup.com"
                  className="flex items-center gap-2 text-muted hover:text-neon-green transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  hello@anthanagroup.com
                </a>
                <a
                  href="https://www.linkedin.com/in/victorgalloo/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted hover:text-neon-green transition-colors"
                >
                  <Linkedin className="w-4 h-4" />
                  LinkedIn
                </a>
              </div>
            </div>
          </div>
        </Section>

        {/* Footer */}
        <footer className="mt-24 pt-8 border-t border-border text-center">
          <p className="text-sm text-muted">
            <strong className="text-foreground">LOOMI</strong> by Anthana · Investor Data Room · January 2026
          </p>
        </footer>
      </div>
    </main>
  );
}

function Section({
  title,
  accent,
  children
}: {
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
      className="mb-28"
    >
      <h2 className="text-5xl font-black tracking-tight mb-8">
        {title}<br />
        <span className="text-neon-green">{accent}</span>
      </h2>
      {children}
    </motion.section>
  );
}
