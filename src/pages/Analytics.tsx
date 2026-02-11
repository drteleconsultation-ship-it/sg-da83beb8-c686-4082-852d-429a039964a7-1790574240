import React from "react";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import Header from "@/components/Header";
import { LanguageProvider } from "@/components/LanguageSelector";

const Analytics: React.FC = () => {
  return (
    <LanguageProvider>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Header />
        <AnalyticsDashboard />
      </div>
    </LanguageProvider>
  );
};

export default Analytics;