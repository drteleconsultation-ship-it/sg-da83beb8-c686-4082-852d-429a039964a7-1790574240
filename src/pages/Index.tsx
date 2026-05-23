import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import ServicesSection from '@/components/ServicesSection';
import ChargesSection from '@/components/ChargesSection';
import MissionSection from '@/components/MissionSection';
import StatsCounter from '@/components/StatsCounter';
import AboutSection from '@/components/AboutSection';
import MapSection from '@/components/MapSection';
import BookingModal from '@/components/BookingModal';
import FloatingButtons from '@/components/FloatingButtons';
import InstallPrompt from '@/components/InstallPrompt';
import SocialShareButtons from '@/components/SocialShareButtons';
import ScrollToTopButton from '@/components/ScrollToTopButton';
import PageLoader from '@/components/PageLoader';
import { LanguageProvider } from '@/components/LanguageSelector';
import Footer from '@/components/Footer';

const Index = () => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('book') === 'true' || params.get('action') === 'book') {
      setIsBookingOpen(true);
      window.history.replaceState({}, '', window.location.pathname);
    }

    // Keyboard shortcuts
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only trigger if not typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch(e.key.toLowerCase()) {
        case 'b':
          setIsBookingOpen(true);
          break;
        case 'h':
          window.scrollTo({ top: 0, behavior: 'smooth' });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <LanguageProvider>
      <PageLoader />
      <div className="min-h-screen bg-background">
        <Header />
        <InstallPrompt />
        <SocialShareButtons />
        <HeroSection onBookingClick={() => setIsBookingOpen(true)} />
        <ServicesSection />
        <ChargesSection />
        <MissionSection />
        <StatsCounter />
        <AboutSection />
        <MapSection />
        
        <BookingModal 
          isOpen={isBookingOpen} 
          onClose={() => setIsBookingOpen(false)} 
        />
        
        <FloatingButtons />
        <ScrollToTopButton />
        <Footer />
      </div>
    </LanguageProvider>
  );
};

export default Index;