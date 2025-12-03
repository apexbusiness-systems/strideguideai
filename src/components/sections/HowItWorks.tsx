import React from 'react';

export const HowItWorks: React.FC = () => {
  return (
    <section className="container mx-auto px-4 py-12">
      <h2 className="text-2xl font-semibold text-center mb-8">How It Works</h2>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-primary mb-2">1</div>
          <h3 className="font-semibold mb-2">Open App</h3>
          <p className="text-muted-foreground">Start guidance mode</p>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-primary mb-2">2</div>
          <h3 className="font-semibold mb-2">AI Detects</h3>
          <p className="text-muted-foreground">Real-time obstacle detection</p>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-primary mb-2">3</div>
          <h3 className="font-semibold mb-2">Voice Guidance</h3>
          <p className="text-muted-foreground">Audio cues guide you safely</p>
        </div>
      </div>
    </section>
  );
};

