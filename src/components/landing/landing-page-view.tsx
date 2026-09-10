'use client';

import React, { useState } from 'react';
import { Navbar } from './navbar';
import { HeroSection } from './hero-section';
import { AboutServiceZapSection } from './about-servicezap-section';
import { BenefitsSection } from './benefits-section';
import { BetaProgramSection } from './beta-program-section';
import { FinalCtaSection } from './final-cta-section';
import { Footer } from './footer';
import { WhatsAppModal } from './whatsapp-modal';
import { MessageCircle } from 'lucide-react';

interface LandingPageViewProps {
  isLoggedIn?: boolean;
}

export function LandingPageView({ isLoggedIn = false }: LandingPageViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const vagasRestantes = 5;

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FAF5ED] text-[#292524] flex flex-col selection:bg-[#FF6B35]/20 selection:text-[#C2410C] relative font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Navigation Bar */}
      <Navbar 
        onApplyClick={handleOpenModal} 
        vagasRestantes={vagasRestantes} 
        isLoggedIn={isLoggedIn}
      />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* 1. Topo com Alerta de Vagas */}
        <HeroSection onApplyClick={handleOpenModal} vagasRestantes={vagasRestantes} />

        {/* 2. O que é o ServiceZap */}
        <AboutServiceZapSection />

        {/* 3. Por que usar na sua rotina? */}
        <BenefitsSection onApplyClick={handleOpenModal} />

        {/* 3. Como funciona a liberação? */}
        <BetaProgramSection onApplyClick={handleOpenModal} />

        {/* 4. Chamada Final */}
        <FinalCtaSection onApplyClick={handleOpenModal} vagasRestantes={vagasRestantes} />
      </main>

      {/* WhatsApp Modal with candidate lead form & fast approval link */}
      <WhatsAppModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        defaultPhone="5511999999999"
      />

      {/* Floating Mobile Quick Contact Pill */}
      <div className="fixed bottom-5 right-5 z-30 sm:hidden">
        <button
          onClick={handleOpenModal}
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#25D366] to-[#16A34A] px-4 py-3 text-xs font-bold text-white shadow-[0_8px_20px_rgba(34,197,94,0.4)] active:scale-95 transition"
        >
          <MessageCircle className="h-4 w-4 fill-current" />
          <span>Vaga Grátis (3 Meses)</span>
        </button>
      </div>

      {/* Footer */}
      <Footer onApplyClick={handleOpenModal} />
    </div>
  );
}
