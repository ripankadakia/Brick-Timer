import { Card } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
}

export default function StatCard({ label, value, subtitle }: StatCardProps) {
  return (
    <Card className="p-6">
      <div className="text-sm text-muted-foreground mb-2">{label}</div>
      <div className="text-3xl font-bold tabular-nums font-mono mb-1" data-testid={`stat-${label.toLowerCase().replace(/\s+/g, '-')}`}>
        {value}
      </div>
      {subtitle && (
        <div className="text-xs text-muted-foreground">{subtitle}</div>
      )}
    </Card>
  );
}
