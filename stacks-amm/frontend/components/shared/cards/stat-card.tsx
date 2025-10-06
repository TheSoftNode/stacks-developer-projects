import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

const iconColors = [
  "text-orange-500 bg-orange-500/10 border-orange-500/20",
  "text-teal-400 bg-teal-400/10 border-teal-400/20",
  "text-blue-500 bg-blue-500/10 border-blue-500/20",
  "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
];

let colorIndex = 0;

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: StatCardProps) {
  const iconColor = iconColors[colorIndex % iconColors.length];
  colorIndex++;

  return (
    <Card className={cn("border border-slate-800 bg-slate-950/50 backdrop-blur-sm hover:border-slate-700 transition-all duration-300", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
        <CardTitle className="text-xs font-medium text-slate-400">{title}</CardTitle>
        {Icon && (
          <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg border", iconColor)}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </CardHeader>
      <CardContent className="pb-3">
        <div className="text-2xl font-bold text-white">{value}</div>
        {description && (
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        )}
        {trend && (
          <div className="mt-2 flex items-center text-xs">
            <span
              className={cn(
                "font-medium px-1.5 py-0.5 rounded-full text-xs",
                trend.isPositive ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"
              )}
            >
              {trend.isPositive ? "↑" : "↓"} {trend.value}%
            </span>
            <span className="text-slate-500 ml-1.5">from last period</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
