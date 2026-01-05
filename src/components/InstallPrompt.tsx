import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, Smartphone } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

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
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS, show custom prompt if not already installed
    if (iOS && !standalone && !dismissed) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
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

  // iOS Install Instructions Modal
  if (isIOS) {
    return (
      <Dialog open={showPrompt} onOpenChange={handleDismiss}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              Install Dr. Deogade Clinic
            </DialogTitle>
            <DialogDescription>
              Add to your home screen for quick access
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Download className="h-8 w-8 text-primary" />
              </div>
            </div>
            
            <div className="space-y-3 text-sm">
              <p className="font-semibold text-center">How to install:</p>
              <ol className="space-y-2 list-decimal list-inside text-muted-foreground">
                <li>Tap the Share button <span className="inline-flex items-center px-1.5 py-0.5 mx-1 bg-muted rounded font-mono text-xs">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"/>
                  </svg>
                </span></li>
                <li>Scroll down and tap "Add to Home Screen"</li>
                <li>Tap "Add" to confirm</li>
              </ol>
            </div>

            <div className="bg-primary/5 p-3 rounded-lg">
              <p className="text-xs text-center text-muted-foreground">
                ✨ Quick access • Offline support • Faster booking
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleDismiss} variant="outline" className="flex-1">
              Maybe Later
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Android/Chrome Install Prompt Modal
  return (
    <Dialog open={showPrompt} onOpenChange={handleDismiss}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Install Dr. Deogade Clinic
          </DialogTitle>
          <DialogDescription>
            Get the app for a better experience
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg">
              <img src="/logo-192.jpg" alt="Dr. Deogade Clinic" className="w-16 h-16 rounded-xl" />
            </div>
          </div>
          
          <div className="space-y-2 text-center">
            <h3 className="font-semibold text-lg">Install Our App</h3>
            <p className="text-sm text-muted-foreground">
              Book appointments faster with our progressive web app
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 py-2">
            <div className="text-center">
              <div className="w-10 h-10 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-1">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-xs font-medium">Fast</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-1">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                </svg>
              </div>
              <p className="text-xs font-medium">Offline</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-1">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-xs font-medium">Home Screen</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleDismiss} variant="outline" className="flex-1">
            Not Now
          </Button>
          <Button onClick={handleInstallClick} variant="medical" className="flex-1">
            <Download className="w-4 h-4 mr-2" />
            Install
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InstallPrompt;