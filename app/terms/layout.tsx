export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ background: '#ffffff', color: '#1a1a2e', minHeight: '100vh' }}>
      {children}
    </div>
  );
}
