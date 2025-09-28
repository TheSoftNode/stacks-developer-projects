"use client";

import { useState, useRef } from "react";
import { Header, HeaderRef } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { AuthModal } from "@/components/AuthModal";
import { Footer } from "@/components/Footer";

export default function LandingPage() {
  const [authModal, setAuthModal] = useState<{
    isOpen: boolean;
    type: 'login' | 'signup';
  }>({
    isOpen: false,
    type: 'login'
  });
  
  const headerRef = useRef<HeaderRef>(null);

  const handleAuthClick = (type: 'login' | 'signup') => {
    setAuthModal({ isOpen: true, type });
  };

  const handleAuthSuccess = () => {
    // Handle successful authentication
    console.log('Authentication successful');
    // Refresh header auth status
    if (headerRef.current?.refreshAuthStatus) {
      headerRef.current.refreshAuthStatus();
    }
  };

  const handleAuthClose = () => {
    setAuthModal({ ...authModal, isOpen: false });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header ref={headerRef} onAuthClick={handleAuthClick} />
      
      <main className="pt-16">
        <HeroSection onGetStarted={() => handleAuthClick('signup')} />
        
        {/* Additional sections will be added here */}
      </main>

      <Footer />

      <AuthModal
        isOpen={authModal.isOpen}
        onClose={handleAuthClose}
        type={authModal.type}
        onSuccess={handleAuthSuccess}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
