"use client";

export const dynamic = 'force-dynamic';

import { useState, useRef } from "react";
import { Header, HeaderRef } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AuthModal } from "@/components/AuthModal";
import { DocsNavigation } from "@/components/docs/DocsNavigation";
import { GettingStarted } from "@/components/docs/sections/GettingStarted";
import { WalletExplorer } from "@/components/docs/sections/WalletExplorer";
import { DashboardFeatures } from "@/components/docs/sections/DashboardFeatures";
import { ApiReference } from "@/components/docs/sections/ApiReference";
import { SecurityPrivacy } from "@/components/docs/sections/SecurityPrivacy";
import { FAQ } from "@/components/docs/sections/FAQ";
import { TechnicalDetails } from "@/components/docs/sections/TechnicalDetails";
import { ContactSupport } from "@/components/docs/sections/ContactSupport";
import { motion } from "framer-motion";

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('getting-started');
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
    console.log('Authentication successful');
    if (headerRef.current?.refreshAuthStatus) {
      headerRef.current.refreshAuthStatus();
    }
  };

  const handleAuthClose = () => {
    setAuthModal({ ...authModal, isOpen: false });
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'getting-started':
        return <GettingStarted />;
      case 'wallet-explorer':
        return <WalletExplorer />;
      case 'dashboard-features':
        return <DashboardFeatures />;
      case 'api-reference':
        return <ApiReference />;
      case 'security-privacy':
        return <SecurityPrivacy />;
      case 'faq':
        return <FAQ />;
      case 'technical-details':
        return <TechnicalDetails />;
      case 'contact-support':
        return <ContactSupport />;
      default:
        return <GettingStarted />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header ref={headerRef} onAuthClick={handleAuthClick} />
      
      <main className="pt-16">
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              Documentation
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about using Wallet Monitor effectively
            </p>
          </motion.div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Navigation */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:w-64 flex-shrink-0"
            >
              <DocsNavigation 
                activeSection={activeSection} 
                onSectionChange={setActiveSection} 
              />
            </motion.div>

            {/* Main Content */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex-1 min-w-0"
            >
              <div className="prose prose-slate dark:prose-invert max-w-none">
                {renderSection()}
              </div>
            </motion.div>
          </div>
        </div>
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