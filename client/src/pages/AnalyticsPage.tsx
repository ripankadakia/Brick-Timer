import { useState, useMemo } from "react";
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
import { useQuery } from "@tanstack/react-query";
import type { Workout, Segment } from "@shared/schema";

export default function AnalyticsPage() {
  const { data: workouts, isLoading } = useQuery<{ workout: Workout; segments: Segment[] }[]>({
    queryKey: ["/api/workouts"],
  });

  const segmentTypes = useMemo(() => {
    if (!workouts) return [];
    const uniqueTypes = new Set<string>();
    workouts.forEach(({ segments }) => {
      segments.forEach((seg) => uniqueTypes.add(seg.name));
    });
    return Array.from(uniqueTypes).sort();
  }, [workouts]);

  const [selectedSegment, setSelectedSegment] = useState<string>("");

  // Set default selected segment when data loads
  useMemo(() => {
    if (segmentTypes.length > 0 && !selectedSegment) {
      setSelectedSegment(segmentTypes[0]);
    }
  }, [segmentTypes, selectedSegment]);

  const segmentStats = useMemo(() => {
    if (!workouts || !selectedSegment) {
      return {
        segments: [],
        average: 0,
        best: 0,
        count: 0,
        trend: [],
        recent: [],
        improvement: 0,
      };
    }

    // Get all segments of the selected type
    const segments: Array<{ duration: number; date: Date; workoutId: string; order: number }> = [];
    workouts.forEach(({ workout, segments: segs }) => {
      segs.forEach((seg) => {
        if (seg.name === selectedSegment) {
          segments.push({
            duration: seg.duration,
            date: new Date(workout.date),
            workoutId: workout.id,
            order: seg.order,
          });
        }
      });
    });

    // Sort by date (newest first), then by order within same date
    segments.sort((a, b) => {
      const dateCompare = b.date.getTime() - a.date.getTime();
      if (dateCompare !== 0) return dateCompare;
      // Same date: sort by order (segments completed first come first)
      return a.order - b.order;
    });

    if (segments.length === 0) {
      return {
        segments: [],
        average: 0,
        best: 0,
        count: 0,
        trend: [],
        recent: [],
        improvement: 0,
      };
    }

    const count = segments.length;
    const best = Math.min(...segments.map((s) => s.duration));
    const last5 = segments.slice(0, Math.min(5, segments.length));
    const average = last5.reduce((sum, s) => sum + s.duration, 0) / last5.length;

    // Calculate improvement (compare recent 5 vs previous 5)
    let improvement = 0;
    if (segments.length >= 10) {
      const recent5Avg = last5.reduce((sum, s) => sum + s.duration, 0) / 5;
      const previous5 = segments.slice(5, 10);
      const previous5Avg = previous5.reduce((sum, s) => sum + s.duration, 0) / 5;
      improvement = ((recent5Avg - previous5Avg) / previous5Avg) * 100;
    }

    // Recent times (up to 5)
    const recent = last5.map((seg) => ({
      date: seg.date,
      time: seg.duration,
    }));

    // Trend data (last 10 or all if less)
    const trendData = segments
      .slice(0, Math.min(10, segments.length))
      .reverse()
      .map((seg) => ({
        date: seg.date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        time: seg.duration,
      }));

    return {
      segments,
      average,
      best,
      count,
      trend: trendData,
      recent,
      improvement,
    };
  }, [workouts, selectedSegment]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 pb-24">
        <div className="text-center">
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!workouts || workouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 pb-24">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No Data Yet</h2>
          <p className="text-muted-foreground mb-6">
            Complete some workouts to see analytics
          </p>
        </div>
      </div>
    );
  }

  if (segmentTypes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 pb-24">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No Segments Found</h2>
          <p className="text-muted-foreground mb-6">
            Complete workouts with named segments to see analytics
          </p>
        </div>
      </div>
    );
  }

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
        <StatCard 
          label="Average Time" 
          value={formatTime(Math.round(segmentStats.average))} 
          subtitle="Last 5 workouts" 
        />
        <StatCard 
          label="Best Time" 
          value={formatTime(segmentStats.best)} 
          subtitle="Personal record" 
        />
        <StatCard 
          label="Total Count" 
          value={segmentStats.count.toString()} 
          subtitle="All time" 
        />
        <StatCard 
          label="Improvement" 
          value={segmentStats.improvement !== 0 ? `${segmentStats.improvement > 0 ? '+' : ''}${segmentStats.improvement.toFixed(1)}%` : "N/A"} 
          subtitle="vs previous 5" 
        />
      </div>

      {segmentStats.trend.length > 0 && (
        <Card className="p-4 mb-6">
          <h3 className="text-sm font-semibold mb-4">Performance Trend</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={segmentStats.trend}>
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
      )}

      {segmentStats.recent.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">Recent {selectedSegment} Times</h3>
          <div className="space-y-2">
            {segmentStats.recent.map((entry, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
                data-testid={`recent-time-${index}`}
              >
                <span className="text-sm text-muted-foreground">{formatDate(entry.date)}</span>
                <span className="text-sm font-mono font-semibold tabular-nums">
                  {formatTime(entry.time)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
