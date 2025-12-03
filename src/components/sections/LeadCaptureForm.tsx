import React from 'react';
import { Button } from '@/components/ui/button';

export const LeadCaptureForm: React.FC = () => {
  return (
    <section className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto text-center">
        <h2 className="text-2xl font-semibold mb-4">Get Started Today</h2>
        <p className="text-muted-foreground mb-6">
          Start navigating safely with AI-powered vision guidance
        </p>
        <Button size="lg" className="w-full">
          Contact Us
        </Button>
      </div>
    </section>
  );
};

