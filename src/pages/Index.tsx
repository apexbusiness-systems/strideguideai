import { CSSProperties } from "react";
import { Footer } from "@/components/layout/Footer";
import { TrustBadgesSlim } from "@/components/sections/TrustBadgesSlim";        
import { BenefitsGrid } from "@/components/sections/BenefitsGrid";
import { ImpactStrip } from "@/components/sections/ImpactStrip";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { LeadCaptureForm } from "@/components/sections/LeadCaptureForm";        
import { NoAIHypeFooter } from "@/components/sections/NoAIHypeFooter";
// import { useAnalytics } from "@/hooks/useAnalytics";
import { SEOHead } from "@/components/SEOHead";
// import { QuickActionsCard } from "@/components/dashboard/QuickActionsCard";     

const Index = () => {
  // const { trackPageView } = useAnalytics();

  // useEffect(() => {
  //   trackPageView("home");
  // }, [trackPageView]);

  const wallpaperStyle = {
    backgroundColor: "hsl(0, 0%, 97%)",
  } as CSSProperties;

  const wallpaperVariables = {
    ["--hero-wallpaper-image" as const]: "none",
  } as CSSProperties;

  const landingBackgroundStyle = {
    backgroundColor: "hsl(0, 0%, 97%)", // Fallback color if image fails (light gray)                                                                           
  } as CSSProperties;

  return (
    <div className="relative min-h-screen" style={wallpaperVariables}>
      <div
        id="app-home"
        className="absolute inset-0 -z-10 pointer-events-none bg-no-repeat bg-cover bg-center md:fixed"                                                                     
        style={wallpaperStyle}
        aria-hidden="true"
      />
      <main
        className="landing-shell min-h-screen flex flex-col relative"
        style={landingBackgroundStyle}
      >
        {/* Content with translucency - Optimized for performance */}
        <div className="relative z-10" style={{ minHeight: "100vh" }}>
          <SEOHead
              title="StrideGuide - AI Vision Assistant for Blind & Low Vision Users"
              description="Free offline AI seeing-eye assistant for blind, low vision, and senior users in Canada. Real-time obstacle detection, voice guidance, and emergency SOS. Works without internet. English & French."                                                                  
              canonical="/"
              contentType="service"
              directAnswer="StrideGuide is an offline-first AI vision assistant that helps blind, low vision, and senior users navigate safely. It provides real-time obstacle detection, stereo audio guidance, fall detection, and emergency SOS capabilities. Works completely offline with no internet required."                                                                     
              primaryEntity={{
                name: "StrideGuide - AI Vision Assistant",
                type: "Service",
                description: "Offline-first AI seeing-eye assistant for blind, low vision, and senior users",                                                                 
              }}
              keyFacts={[
                { label: "Offline Support", value: "100% offline" },
                { label: "Languages", value: "English & French" },
                { label: "Accessibility", value: "WCAG 2.2 AA+" },
                { label: "Service Area", value: "Canada" },
              ]}
              faqs={[
                {
                  question: "What is StrideGuide?",
                  answer:
                    "StrideGuide is a free offline AI vision assistant that helps blind, low vision, and senior users navigate safely. It provides real-time obstacle detection, voice guidance, and emergency SOS capabilities.",         
                },
                {
                  question: "How does StrideGuide work?",
                  answer:
                    "StrideGuide uses on-device AI to detect obstacles in real-time, provides stereo audio guidance to help you navigate safely, and includes fall detection with emergency SOS capabilities. All processing happens on your device - no internet required.",                        
                },
                {
                  question: "Does StrideGuide work offline?",
                  answer:
                    "Yes! StrideGuide works 100% offline. All AI processing happens on your device, so you don't need internet connectivity for core features like obstacle detection and voice guidance.",                                            
                },
                {
                  question: "Is StrideGuide free?",
                  answer:
                    "Yes! StrideGuide offers a free tier with 2 hours of daily guidance time. Premium features including night mode and extended usage are available for $28.99/month.", 
                },
              ]}
            />

          <div className="hero-background relative">
            <div className="hero-gradient-tint" aria-hidden="true" />
            <div className="container mx-auto px-4 py-16 text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">StrideGuide</h1>
              <p className="text-xl text-muted-foreground mb-8">Your seeing-eye assistant in your pocket</p>
            </div>
          </div>
          {/* Sections below hero with extended mask overlay */}
          <div className="relative">
            <div className="hero-gradient-overlay absolute inset-0 pointer-events-none" aria-hidden="true" />                                                   
            <div className="hero-vignette absolute inset-0 pointer-events-none" aria-hidden="true" />                                                           
            <div className="relative">
              <BenefitsGrid />
              <ImpactStrip />
              <HowItWorks />
              <div className="container mx-auto px-4 py-12 relative">
                {/* Mask overlay for Quick Actions section - 65% opacity */}
                <div className="hero-gradient-overlay absolute inset-0 pointer-events-none" style={{ background: 'rgba(255, 107, 53, 0.65)' }} aria-hidden="true" />
                <div className="hero-vignette absolute inset-0 pointer-events-none" aria-hidden="true" />
                <div className="mx-auto max-w-4xl space-y-6 text-center relative z-10">       
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">                                                                        
                    Quick actions for operators
                  </h2>
                  <p className="text-muted-foreground">
                    Jump straight into the workflows you use every day. These shortcuts survive refreshes and deep links.
                  </p>
                  {/* <QuickActionsCard /> */}
                  <div className="p-4 bg-card rounded-lg">
                    <p className="text-muted-foreground">Quick Actions Coming Soon</p>
                  </div>
                </div>
              </div>
              <TrustBadgesSlim />
              <LeadCaptureForm />
              <Footer />
              <NoAIHypeFooter />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
