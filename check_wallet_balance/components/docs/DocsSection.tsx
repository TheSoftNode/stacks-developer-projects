"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReactNode } from "react";

interface DocsSectionProps {
  title: string;
  description?: string;
  badge?: string;
  children: ReactNode;
}

export function DocsSection({ title, description, badge, children }: DocsSectionProps) {
  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">{title}</h1>
          {badge && (
            <Badge variant="outline" className="text-xs">
              {badge}
            </Badge>
          )}
        </div>
        {description && (
          <p className="text-lg text-muted-foreground">{description}</p>
        )}
      </div>
      
      <div className="space-y-8">
        {children}
      </div>
    </div>
  );
}

interface SubSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function SubSection({ title, children, className = "" }: SubSectionProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <h2 className="text-2xl font-semibold">{title}</h2>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

interface InfoCardProps {
  title: string;
  children: ReactNode;
  variant?: 'default' | 'warning' | 'success' | 'info';
}

export function InfoCard({ title, children, variant = 'default' }: InfoCardProps) {
  const variants = {
    default: 'border-border',
    warning: 'border-yellow-500/20 bg-yellow-50/50 dark:bg-yellow-950/20',
    success: 'border-green-500/20 bg-green-50/50 dark:bg-green-950/20',
    info: 'border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20',
  };

  return (
    <Card className={`${variants[variant]}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  );
}