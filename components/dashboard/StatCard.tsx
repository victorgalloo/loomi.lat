interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
}

export default function StatCard({ label, value, subtitle }: StatCardProps) {
  return (
    <div className="p-4 rounded-xl bg-surface border border-border">
      <p className="text-xs uppercase tracking-widest text-muted mb-1">{label}</p>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      {subtitle && <p className="text-xs text-muted mt-1">{subtitle}</p>}
    </div>
  );
}
