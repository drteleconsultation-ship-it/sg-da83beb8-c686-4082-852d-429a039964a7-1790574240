import React from "react";
import { Link } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import LanguageSelector from "./LanguageSelector";
import { BarChart3 } from "lucide-react";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo-192.jpg" alt="Dr Deogade Clinic" className="h-10 w-10 rounded-full" />
          <span className="font-semibold text-gray-900 dark:text-white">Dr Deogade Clinic</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to="/services"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="View Services & Charges"
          >
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Services</span>
          </Link>
          <Link
            to="/analytics"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="View Analytics"
          >
            <BarChart3 className="h-5 w-5 text-primary" />
            <span className="hidden sm:inline text-sm font-medium">Analytics</span>
          </Link>
          <LanguageSelector />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default Header;