import { useState } from "react";
import StatCard from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

export default function AnalyticsPage() {
  const [selectedSegment, setSelectedSegment] = useState("Run");

  //todo: remove mock functionality
  const segmentTypes = ["Run", "Bike", "Row"];
  
  const mockData = [
    { date: "Mon", time: 185 },
    { date: "Tue", time: 200 },
    { date: "Wed", time: 190 },
    { date: "Thu", time: 180 },
    { date: "Fri", time: 175 },
  ];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col h-full p-4 pb-24 overflow-y-auto">
      <h1 className="text-2xl font-bold mb-6">Analytics</h1>

      <div className="mb-6">
        <label className="text-sm font-medium mb-2 block">Segment Type</label>
        <Select value={selectedSegment} onValueChange={setSelectedSegment}>
          <SelectTrigger data-testid="select-segment-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {segmentTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard label="Average Time" value="3:05" subtitle="Last 5 workouts" />
        <StatCard label="Best Time" value="2:55" subtitle="Personal record" />
        <StatCard label="Total Count" value="12" subtitle="All time" />
        <StatCard label="Improvement" value="-8%" subtitle="vs last week" />
      </div>

      <Card className="p-4 mb-6">
        <h3 className="text-sm font-semibold mb-4">Performance Trend</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={mockData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `${Math.floor(value / 60)}m`}
            />
            <Line 
              type="monotone" 
              dataKey="time" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={{ fill: "hsl(var(--primary))", r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">Recent {selectedSegment} Times</h3>
        <div className="space-y-2">
          {[
            { date: "Today", time: 175 },
            { date: "Yesterday", time: 180 },
            { date: "Dec 26", time: 190 },
            { date: "Dec 25", time: 200 },
            { date: "Dec 24", time: 185 },
          ].map((entry, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 border-b border-border last:border-0"
              data-testid={`recent-time-${index}`}
            >
              <span className="text-sm text-muted-foreground">{entry.date}</span>
              <span className="text-sm font-mono font-semibold tabular-nums">
                {formatTime(entry.time)}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
