import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe } from 'lucide-react';

interface LanguageContextType {
  language: 'en' | 'hi' | 'mr';
  setLanguage: (lang: 'en' | 'hi' | 'mr') => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    'header.title': 'Dr. Deogade Clinic',
    'header.subtitle': 'Dr Rikki Deogade ( MBBS, CGO, CCH, CSD, CVD, Medical officer )',
    'hero.title': 'Professional Medical Care & Teleconsultation',
    'hero.subtitle': 'Book online consultation from home & in-clinic visits',
    'hero.bookNow': 'Book Now',
    'services.title': 'Our Services',
    'booking.title': 'Book Appointment',
    'booking.name': 'Full Name',
    'booking.age': 'Age',
    'booking.gender': 'Gender',
    'booking.whatsapp': 'WhatsApp Number',
    'booking.email': 'Email (Optional)',
    'booking.reason': 'Reason for Visit',
    'booking.attachments': 'Medical Documents (Optional)',
    'booking.consultationType': 'Consultation Type',
    'booking.serviceType': 'Service Type',
    'booking.date': 'Select Date',
    'booking.timeSlot': 'Select Time',
    'booking.submit': 'Proceed to Payment',
    'about.title': 'About Us',
    'charges.title': 'Our Services & Charges',
  },
  hi: {
    'header.title': 'डॉ. देवगडे क्लिनिक',
    'header.subtitle': 'डॉ रिक्की देवगडे (एमबीबीएस, सीजीओ, सीसीएच, सीएसडी, सीवीडी, मेडिकल ऑफिसर)',
    'hero.title': 'पेशेवर चिकित्सा देखभाल और टेलीकंसल्टेशन',
    'hero.subtitle': 'घर से ऑनलाइन परामर्श और क्लिनिक में विजिट बुक करें',
    'hero.bookNow': 'अभी बुक करें',
    'services.title': 'हमारी सेवाएं',
    'booking.title': 'अपॉइंटमेंट बुक करें',
    'booking.name': 'पूरा नाम',
    'booking.age': 'आयु',
    'booking.gender': 'लिंग',
    'booking.whatsapp': 'व्हाट्सऐप नंबर',
    'booking.email': 'ईमेल (वैकल्पिक)',
    'booking.reason': 'विजिट का कारण',
    'booking.attachments': 'मेडिकल दस्तावेज (वैकल्पिक)',
    'booking.consultationType': 'परामर्श प्रकार',
    'booking.serviceType': 'सेवा प्रकार',
    'booking.date': 'तारीख चुनें',
    'booking.timeSlot': 'समय चुनें',
    'booking.submit': 'भुगतान के लिए आगे बढ़ें',
    'about.title': 'हमारे बारे में',
    'charges.title': 'हमारी सेवाएं और शुल्क',
  },
  mr: {
    'header.title': 'डॉ. देवगडे क्लिनिक',
    'header.subtitle': 'डॉ रिक्की देवगडे (एमबीबीएस, सीजीओ, सीसीएच, सीएसडी, सीव्हीडी, मेडिकल ऑफिसर)',
    'hero.title': 'व्यावसायिक वैद्यकीय सेवा आणि टेलीकन्सल्टेशन',
    'hero.subtitle': 'घरूनच ऑनलाइन सल्ला आणि क्लिनिकमध्ये भेट बुक करा',
    'hero.bookNow': 'आता बुक करा',
    'services.title': 'आमच्या सेवा',
    'booking.title': 'अपॉइंटमेंट बुक करा',
    'booking.name': 'पूर्ण नाव',
    'booking.age': 'वय',
    'booking.gender': 'लिंग',
    'booking.whatsapp': 'व्हाट्सअप क्रमांक',
    'booking.email': 'ईमेल (पर्यायी)',
    'booking.reason': 'भेटीचे कारण',
    'booking.attachments': 'वैद्यकीय कागदपत्रे (पर्यायी)',
    'booking.consultationType': 'सल्ला प्रकार',
    'booking.serviceType': 'सेवा प्रकार',
    'booking.date': 'तारीख निवडा',
    'booking.timeSlot': 'वेळ निवडा',
    'booking.submit': 'पेमेंटसाठी पुढे जा',
    'about.title': 'आमच्याबद्दल',
    'charges.title': 'आमच्या सेवा आणि शुल्क',
  },
};

const LanguageContext = React.createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<'en' | 'hi' | 'mr'>('en');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as 'en' | 'hi' | 'mr';
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  const handleSetLanguage = (lang: 'en' | 'hi' | 'mr') => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = React.useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <Select value={language} onValueChange={setLanguage}>
        <SelectTrigger className="w-[100px] h-8 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="hi">हिन्दी</SelectItem>
          <SelectItem value="mr">मराठी</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default LanguageSelector;