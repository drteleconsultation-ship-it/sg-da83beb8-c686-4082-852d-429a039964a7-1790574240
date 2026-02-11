import { supabase } from "@/integrations/supabase/client";

export interface VisitorStats {
  totalVisitors: number;
  uniqueSessions: number;
  countryBreakdown: {
    country_name: string;
    country_code: string;
    count: number;
  }[];
  dailyVisits: {
    date: string;
    count: number;
  }[];
}

export interface VisitorData {
  page_path: string;
  country_code?: string;
  country_name?: string;
  user_agent?: string;
  session_id: string;
}

// Generate a unique session ID for the current browser session
const getSessionId = (): string => {
  const sessionKey = "visitor_session_id";
  let sessionId = sessionStorage.getItem(sessionKey);
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(sessionKey, sessionId);
  }
  
  return sessionId;
};

// Detect country using IP geolocation API
const detectCountry = async (): Promise<{ country_code?: string; country_name?: string }> => {
  try {
    // Using ipapi.co for free IP geolocation (1000 requests/day)
    const response = await fetch("https://ipapi.co/json/");
    if (response.ok) {
      const data = await response.json();
      return {
        country_code: data.country_code || undefined,
        country_name: data.country_name || undefined,
      };
    }
  } catch (error) {
    console.error("Error detecting country:", error);
  }
  return {};
};

// Log a visitor session
export const logVisit = async (pagePath: string = "/"): Promise<void> => {
  try {
    const sessionId = getSessionId();
    const userAgent = navigator.userAgent;
    
    // Check if this session has already been logged in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: recentVisit } = await supabase
      .from("page_visits")
      .select("id")
      .eq("session_id", sessionId)
      .gte("visited_at", oneHourAgo)
      .single();
    
    // Only log if no recent visit found
    if (!recentVisit) {
      const countryData = await detectCountry();
      
      const visitorData: VisitorData = {
        page_path: pagePath,
        country_code: countryData.country_code,
        country_name: countryData.country_name,
        user_agent: userAgent,
        session_id: sessionId,
      };
      
      const { error } = await supabase
        .from("page_visits")
        .insert([visitorData]);
      
      if (error) {
        console.error("Error logging visit:", error);
      }
    }
  } catch (error) {
    console.error("Error in logVisit:", error);
  }
};

// Get visitor statistics with time filter
export const getVisitorStats = async (
  timeFilter: "today" | "yesterday" | "24h" | "7days" | "1month"
): Promise<VisitorStats> => {
  try {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;
    
    switch (timeFilter) {
      case "today":
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date(now.setHours(23, 59, 59, 999));
        break;
      case "yesterday": {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        startDate = new Date(yesterday.setHours(0, 0, 0, 0));
        endDate = new Date(yesterday.setHours(23, 59, 59, 999));
        break;
      }
      case "24h":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "7days":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "1month":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.setHours(0, 0, 0, 0));
    }
    
    // Get total visitors and unique sessions
    const { data: visits, error: visitsError } = await supabase
      .from("page_visits")
      .select("*")
      .gte("visited_at", startDate.toISOString())
      .lte("visited_at", endDate.toISOString())
      .order("visited_at", { ascending: false });
    
    if (visitsError) {
      console.error("Error fetching visits:", visitsError);
      throw visitsError;
    }
    
    const totalVisitors = visits?.length || 0;
    const uniqueSessions = new Set(visits?.map(v => v.session_id)).size;
    
    // Get country breakdown
    const countryMap = new Map<string, { country_name: string; count: number }>();
    
    visits?.forEach(visit => {
      if (visit.country_code && visit.country_name) {
        const existing = countryMap.get(visit.country_code);
        if (existing) {
          existing.count++;
        } else {
          countryMap.set(visit.country_code, {
            country_name: visit.country_name,
            count: 1,
          });
        }
      }
    });
    
    const countryBreakdown = Array.from(countryMap.entries())
      .map(([country_code, data]) => ({
        country_code,
        country_name: data.country_name,
        count: data.count,
      }))
      .sort((a, b) => b.count - a.count);
    
    // Get daily visits for chart
    const dailyMap = new Map<string, number>();
    
    visits?.forEach(visit => {
      const date = new Date(visit.visited_at).toISOString().split("T")[0];
      dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
    });
    
    const dailyVisits = Array.from(dailyMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    return {
      totalVisitors,
      uniqueSessions,
      countryBreakdown,
      dailyVisits,
    };
  } catch (error) {
    console.error("Error getting visitor stats:", error);
    return {
      totalVisitors: 0,
      uniqueSessions: 0,
      countryBreakdown: [],
      dailyVisits: [],
    };
  }
};