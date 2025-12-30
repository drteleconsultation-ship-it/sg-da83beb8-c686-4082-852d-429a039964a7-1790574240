import React, { useState } from 'react';
import logoImage from '@/assets/logo-new.jpg';
import doctorPhoto from '@/assets/doctor-photo.jpg';
import LanguageSelector from '@/components/LanguageSelector';
import ThemeToggle from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/AuthModal';
import PatientDashboard from '@/components/PatientDashboard';
import { User as UserIcon, LogIn, LayoutDashboard } from 'lucide-react';
import { User } from '@supabase/supabase-js';

const Header: React.FC = () => {
  const { user } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);

  const handleAuthSuccess = (user: User) => {
    setIsAuthOpen(false);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex justify-center items-center gap-2 md:gap-4 flex-1 md:flex-none">
              <img 
                src={doctorPhoto} 
                alt="Dr. Deogade - Medical Professional" 
                className="h-12 w-12 md:h-16 md:w-16 rounded-full object-cover border-2 border-primary/20"
              />
              <img 
                src={logoImage} 
                alt="Dr Deogade Clinic Logo - Rejuvenating Life" 
                className="h-16 md:h-20 w-auto object-contain hidden xs:block"
              />
            </div>
            
            <div className="flex items-center gap-2 md:gap-3">
              {user ? (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="hidden md:flex gap-2"
                  onClick={() => setIsDashboardOpen(true)}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  My Dashboard
                </Button>
              ) : (
                <Button 
                  variant="default" 
                  size="sm"
                  className="hidden md:flex gap-2 bg-primary hover:bg-primary/90"
                  onClick={() => setIsAuthOpen(true)}
                >
                  <LogIn className="h-4 w-4" />
                  Patient Login
                </Button>
              )}

              {/* Mobile Icon Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => user ? setIsDashboardOpen(true) : setIsAuthOpen(true)}
              >
                {user ? <LayoutDashboard className="h-5 w-5" /> : <UserIcon className="h-5 w-5" />}
              </Button>

              <ThemeToggle />
              <LanguageSelector />
            </div>
          </div>
        </div>
      </header>

      <AuthModal 
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {user && (
        <PatientDashboard 
          isOpen={isDashboardOpen}
          onClose={() => setIsDashboardOpen(false)}
          user={user}
          onLogout={() => setIsDashboardOpen(false)}
        />
      )}
    </>
  );
};

export default Header;