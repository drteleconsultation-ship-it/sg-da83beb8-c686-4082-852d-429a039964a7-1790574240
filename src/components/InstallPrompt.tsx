import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed (running in standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Detect iOS devices
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);
    setIsIOS(iOS);

    // Check if user previously dismissed the prompt
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

    // Show prompt again after 7 days
    if (dismissed && daysSinceDismissed < 7) {
      return;
    }

    // Listen for the beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      
      // Show prompt after a short delay for better UX
      setTimeout(() => {
        setShowPrompt(true);
      }, 2000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS, show custom prompt if not already installed
    if (iOS && !standalone && !dismissed) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 2000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt && !isIOS) {
      return;
    }

    if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt();
      
      // Wait for the user's response
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Don't show if already installed
  if (isStandalone) {
    return null;
  }

  // Don't show if not ready
  if (!showPrompt) {
    return null;
  }

  // iOS Install Instructions
  if (isIOS) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg animate-in slide-in-from-top duration-500">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <Smartphone className="h-5 w-5" />
            </div>
            <div className="flex-1 text-sm">
              <p className="font-semibold mb-1">Install Dr. Deogade Clinic App</p>
              <p className="text-xs text-primary-foreground/90">
                Tap <span className="inline-flex items-center px-1 py-0.5 mx-1 bg-primary-foreground/20 rounded">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
                  </svg>
                </span> then "Add to Home Screen"
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 hover:bg-primary-foreground/20 rounded-full p-1 transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Android/Chrome Install Prompt
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg animate-in slide-in-from-top duration-500">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-primary-foreground/20 rounded-lg flex items-center justify-center">
              <Download className="h-5 w-5" />
            </div>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">Install Dr. Deogade Clinic</p>
            <p className="text-xs text-primary-foreground/90">Quick access, offline support, faster booking</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleInstallClick}
              size="sm"
              variant="secondary"
              className="text-xs font-semibold"
            >
              Install
            </Button>
            <button
              onClick={handleDismiss}
              className="hover:bg-primary-foreground/20 rounded-full p-1.5 transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;