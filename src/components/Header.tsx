import React from 'react';
import logoImage from '@/assets/logo-new.jpg';
import doctorPhoto from '@/assets/doctor-photo.jpg';
import LanguageSelector from '@/components/LanguageSelector';
import ThemeToggle from '@/components/ThemeToggle';

const Header: React.FC = () => {
  return (
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
            <ThemeToggle />
            <LanguageSelector />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;