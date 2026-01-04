import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import MissionSection from '@/components/MissionSection';
import ChargesSection from '@/components/ChargesSection';
import AboutSection from '@/components/AboutSection';
import ServicesSection from '@/components/ServicesSection';
import MapSection from '@/components/MapSection';
import BookingModal from '@/components/BookingModal';
import FloatingButtons from '@/components/FloatingButtons';
import InstallPrompt from '@/components/InstallPrompt';
import { LanguageProvider } from '@/components/LanguageSelector';

const Index = () => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('book') === 'true' || params.get('action') === 'book') {
      setIsBookingOpen(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <InstallPrompt />
        <HeroSection onBookingClick={() => setIsBookingOpen(true)} />
        <MissionSection />
        <ChargesSection />
        <AboutSection />
        <ServicesSection />
        <MapSection />
        
        <BookingModal 
          isOpen={isBookingOpen} 
          onClose={() => setIsBookingOpen(false)} 
        />
        
        <FloatingButtons />
      </div>
    </LanguageProvider>
  );
};

export default Index;