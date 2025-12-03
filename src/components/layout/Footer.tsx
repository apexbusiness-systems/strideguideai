import React from 'react';
import { Logo } from '@/components/Logo';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

export const Footer: React.FC = () => {
  const { i18n } = useTranslation();

  // Language toggle handler - works on all platforms (mobile, desktop, PWA)
  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'fr' : 'en';
    i18n.changeLanguage(newLang);
    document.documentElement.lang = newLang;
  };

  return (
    <footer className="border-t bg-background mt-auto" role="contentinfo">      
      <div className="container py-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">                                                                          
          <div className="text-center md:text-left">
            <div className="flex items-center gap-2 mb-2">
              <Logo variant="text" size="sm" />
            </div>
            <address className="not-italic text-sm">
              <strong>StrideGuide</strong> • Built for accessibility • Made in Canada<br />                                                             
              <a href="mailto:info@strideguide.cam" className="hover:text-foreground transition-colors" style={{ color: '#FF6B35' }}>info@strideguide.cam</a>                                                                             
            </address>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">                                                                        
              <span>© 2025 <span style={{ color: '#FF6B35' }}>StrideGuide</span>. Walk with confidence.</span>                                      
            </div>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-4 md:gap-6">                                                                           
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="min-h-[44px] px-3"
              aria-label={`Switch to ${i18n.language === 'en' ? 'French' : 'English'}`}
            >
              <Globe className="w-4 h-4 mr-1" aria-hidden="true" />
              <span>{i18n.language === 'en' ? 'FR' : 'EN'}</span>
            </Button>
            <a
              href="/security"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"                                                                 
            >
              Security
            </a>
            <a
              href="/compare"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"                                                                 
            >
              Compare
            </a>
            <a
              href="/privacy"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"                                                                 
            >
              Privacy
            </a>
            <a
              href="/terms"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"                                                                 
            >
              Terms
            </a>
            <a
              href="mailto:info@strideguide.cam"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"                                                                 
            >
              Contact
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
};



