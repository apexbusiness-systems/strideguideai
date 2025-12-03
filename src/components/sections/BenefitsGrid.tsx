import React from 'react';

export const BenefitsGrid: React.FC = () => {
  return (
    <section className="container mx-auto px-4 py-12">
      <div className="grid md:grid-cols-3 gap-6">
        <div className="text-center p-6">
          <h3 className="text-lg font-semibold mb-2">100% Offline</h3>
          <p className="text-muted-foreground">Works without internet</p>
        </div>
        <div className="text-center p-6">
          <h3 className="text-lg font-semibold mb-2">Real-Time Detection</h3>
          <p className="text-muted-foreground">Instant obstacle alerts</p>
        </div>
        <div className="text-center p-6">
          <h3 className="text-lg font-semibold mb-2">Voice Guidance</h3>
          <p className="text-muted-foreground">Stereo audio cues</p>
        </div>
      </div>
    </section>
  );
};

