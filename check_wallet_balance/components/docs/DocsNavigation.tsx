"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BookOpen,
  Search,
  LayoutDashboard,
  Code,
  Shield,
  HelpCircle,
  Settings,
  MessageCircle
} from "lucide-react";

interface DocsNavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const navigationItems = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: BookOpen,
  },
  {
    id: 'wallet-explorer',
    title: 'Wallet Explorer',
    icon: Search,
  },
  {
    id: 'dashboard-features',
    title: 'Dashboard Features',
    icon: LayoutDashboard,
  },
  {
    id: 'api-reference',
    title: 'API Reference',
    icon: Code,
  },
  {
    id: 'security-privacy',
    title: 'Security & Privacy',
    icon: Shield,
  },
  {
    id: 'faq',
    title: 'FAQ',
    icon: HelpCircle,
  },
  {
    id: 'technical-details',
    title: 'Technical Details',
    icon: Settings,
  },
  {
    id: 'contact-support',
    title: 'Contact & Support',
    icon: MessageCircle,
  },
];

export function DocsNavigation({ activeSection, onSectionChange }: DocsNavigationProps) {
  return (
    <Card className="sticky top-20">
      <CardContent className="p-4">
        <h2 className="font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">
          Documentation
        </h2>
        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start h-auto py-2 px-3 ${
                  isActive 
                    ? "bg-brand-pink hover:bg-brand-pink/90 text-white" 
                    : "hover:bg-muted"
                }`}
                onClick={() => onSectionChange(item.id)}
              >
                <Icon className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="text-sm text-left">{item.title}</span>
              </Button>
            );
          })}
        </nav>
      </CardContent>
    </Card>
  );
}