import React from 'react';
import { useLanguage } from './LanguageSelector';
import { Link } from 'react-router-dom';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-white py-8 mt-16">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center space-y-4">
          {/* Clinic Info */}
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">Dr Deogade Clinic</h3>
            <p className="text-gray-400 text-sm">
              Professional Medical Care & Teleconsultation
            </p>
          </div>

          {/* Divider */}
          <div className="w-full max-w-md border-t border-gray-700"></div>

          {/* Footer Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <Link 
              to="/privacy-policy" 
              className="text-gray-400 hover:text-white transition-colors"
            >
              {t('footer.privacyPolicy')}
            </Link>
            <span className="text-gray-600">|</span>
            <a 
              href="tel:+919422152702" 
              className="text-gray-400 hover:text-white transition-colors"
            >
              +91 94221 52702
            </a>
          </div>

          {/* Copyright */}
          <div className="text-center text-sm text-gray-500 mt-4">
            <p>© {new Date().getFullYear()} Dr Deogade Clinic. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;