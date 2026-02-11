import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Globe, TrendingUp, Calendar } from "lucide-react";
import { getVisitorStats, type VisitorStats } from "@/services/visitorService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type TimeFilter = "today" | "yesterday" | "24h" | "7days" | "1month";

const AnalyticsDashboard: React.FC = () => {
  const [stats, setStats] = useState<VisitorStats>({
    totalVisitors: 0,
    uniqueSessions: 0,
    countryBreakdown: [],
    dailyVisits: [],
  });
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("today");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [timeFilter]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await getVisitorStats(timeFilter);
      setStats(data);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMaxVisits = () => {
    return Math.max(...stats.dailyVisits.map(d => d.count), 1);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getFilterLabel = (filter: TimeFilter) => {
    const labels: Record<TimeFilter, string> = {
      today: "Today",
      yesterday: "Yesterday",
      "24h": "Last 24 Hours",
      "7days": "Last 7 Days",
      "1month": "Last 1 Month",
    };
    return labels[filter];
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track your website visitor statistics and insights
          </p>
        </div>
        
        <Select value={timeFilter} onValueChange={(value) => setTimeFilter(value as TimeFilter)}>
          <SelectTrigger className="w-[180px]">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="yesterday">Yesterday</SelectItem>
            <SelectItem value="24h">Last 24 Hours</SelectItem>
            <SelectItem value="7days">Last 7 Days</SelectItem>
            <SelectItem value="1month">Last 1 Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : stats.totalVisitors.toLocaleString()}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {getFilterLabel(timeFilter)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Sessions</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : stats.uniqueSessions.toLocaleString()}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Distinct visitors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Countries</CardTitle>
            <Globe className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : stats.countryBreakdown.length}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Different locations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Visitor Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Visitor Trend</CardTitle>
          <CardDescription>Daily visitor count over the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-64 flex items-center justify-center text-gray-500">
              Loading chart...
            </div>
          ) : stats.dailyVisits.length > 0 ? (
            <div className="space-y-4">
              <div className="h-64 flex items-end justify-between gap-2">
                {stats.dailyVisits.map((day, index) => {
                  const height = (day.count / getMaxVisits()) * 100;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex flex-col items-center">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {day.count}
                        </span>
                        <div
                          className="w-full bg-primary rounded-t-lg transition-all hover:opacity-80 cursor-pointer"
                          style={{ height: `${height}%`, minHeight: "20px" }}
                          title={`${formatDate(day.date)}: ${day.count} visitors`}
                        />
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400 transform -rotate-45 mt-2">
                        {formatDate(day.date)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No visitor data available for this period
            </div>
          )}
        </CardContent>
      </Card>

      {/* Country Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Geographic Distribution</CardTitle>
          <CardDescription>Visitors by country</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-gray-500">Loading countries...</div>
          ) : stats.countryBreakdown.length > 0 ? (
            <div className="space-y-3">
              {stats.countryBreakdown.map((country, index) => {
                const percentage = ((country.count / stats.totalVisitors) * 100).toFixed(1);
                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <Badge variant="outline" className="font-mono text-xs">
                        {country.country_code}
                      </Badge>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {country.country_name}
                      </span>
                      <div className="flex-1 mx-4">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 min-w-[120px] justify-end">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {percentage}%
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white min-w-[60px] text-right">
                        {country.count.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              No country data available for this period
            </div>
          )}
        </CardContent>
      </Card>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button onClick={loadStats} disabled={loading} variant="outline">
          {loading ? "Refreshing..." : "Refresh Data"}
        </Button>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;