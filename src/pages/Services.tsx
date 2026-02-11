import React, { useState } from 'react';
import Header from '@/components/Header';
import ServicesSection from '@/components/ServicesSection';
import ChargesSection from '@/components/ChargesSection';
import BookingModal from '@/components/BookingModal';
import FloatingButtons from '@/components/FloatingButtons';
import ScrollToTopButton from '@/components/ScrollToTopButton';
import PageLoader from '@/components/PageLoader';
import { LanguageProvider } from '@/components/LanguageSelector';

const Services = () => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  return (
    <LanguageProvider>
      <PageLoader />
      <div className="min-h-screen bg-background">
        <Header />
        
        <div className="pt-20">
          <ChargesSection />
          <ServicesSection />
        </div>
        
        <BookingModal 
          isOpen={isBookingOpen} 
          onClose={() => setIsBookingOpen(false)} 
        />
        
        <FloatingButtons />
        <ScrollToTopButton />
      </div>
    </LanguageProvider>
  );
};

export default Services;