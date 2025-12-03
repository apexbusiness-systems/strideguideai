import React from 'react';
import { useTranslation } from 'react-i18next';

export const TrustBadgesSlim: React.FC = () => {
  const { i18n } = useTranslation();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="text-primary">✓</span>
          <span>{i18n.language === 'en' ? '24/7 Availability' : 'Disponibilité 24/7'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-primary">✓</span>
          <span>{i18n.language === 'en' ? 'Secure & Private' : 'Sécurisé et Privé'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-primary">✓</span>
          <span>{i18n.language === 'en' ? 'Canadian Built' : 'Fabriqué au Canada'}</span>
        </div>
      </div>
    </div>
  );
};

