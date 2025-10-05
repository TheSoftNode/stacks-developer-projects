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

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
        <p className="text-slate-300 text-sm font-medium mb-1">{label}</p>
        <p className="text-teal-400 text-sm font-semibold">
          ${payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

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
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              timeRange === range
                ? "bg-orange-500/10 text-orange-500 border border-orange-500/20"
                : "bg-slate-800/50 text-slate-400 border border-slate-700 hover:bg-slate-800 hover:text-white"
            }`}
          >
            {range}
          </button>
        ))}
      </div>

      {/* TVL Chart */}
      <Card className="border border-slate-800 bg-slate-950/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Total Value Locked</CardTitle>
          <CardDescription className="text-slate-400">Historical TVL across all pools</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={tvlData}>
              <defs>
                <linearGradient id="colorTVL" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgb(20 184 166)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="rgb(20 184 166)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(51 65 85)" opacity={0.3} />
              <XAxis
                dataKey="date"
                tick={{ fill: 'rgb(148 163 184)', fontSize: 12 }}
                stroke="rgb(71 85 105)"
              />
              <YAxis
                tick={{ fill: 'rgb(148 163 184)', fontSize: 12 }}
                stroke="rgb(71 85 105)"
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="rgb(20 184 166)"
                strokeWidth={2}
                fill="url(#colorTVL)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Volume Chart */}
      <Card className="border border-slate-800 bg-slate-950/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Trading Volume</CardTitle>
          <CardDescription className="text-slate-400">Daily trading volume</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={volumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(51 65 85)" opacity={0.3} />
              <XAxis
                dataKey="date"
                tick={{ fill: 'rgb(148 163 184)', fontSize: 12 }}
                stroke="rgb(71 85 105)"
              />
              <YAxis
                tick={{ fill: 'rgb(148 163 184)', fontSize: 12 }}
                stroke="rgb(71 85 105)"
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="volume"
                fill="rgb(249 115 22)"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
