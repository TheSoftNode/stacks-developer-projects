"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

// Mock data for charts
const tvlData = [
  { date: "Jan", value: 0 },
  { date: "Feb", value: 0 },
  { date: "Mar", value: 0 },
  { date: "Apr", value: 0 },
  { date: "May", value: 0 },
  { date: "Jun", value: 0 },
];

const volumeData = [
  { date: "Mon", volume: 0 },
  { date: "Tue", volume: 0 },
  { date: "Wed", volume: 0 },
  { date: "Thu", volume: 0 },
  { date: "Fri", volume: 0 },
  { date: "Sat", volume: 0 },
  { date: "Sun", volume: 0 },
];

export function AnalyticsCharts() {
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d" | "1y">("7d");

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex gap-2">
        {["24h", "7d", "30d", "1y"].map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range as any)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              timeRange === range
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            {range}
          </button>
        ))}
      </div>

      {/* TVL Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Total Value Locked</CardTitle>
          <CardDescription>Historical TVL across all pools</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={tvlData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Volume Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Trading Volume</CardTitle>
          <CardDescription>Daily trading volume</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={volumeData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip />
              <Bar dataKey="volume" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
