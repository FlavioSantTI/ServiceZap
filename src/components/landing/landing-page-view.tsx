'use client';

import React, { useState } from 'react';
import { Navbar } from './navbar';
import { HeroSection } from './hero-section';
import { AboutServiceZapSection } from './about-servicezap-section';
import { BenefitsSection } from './benefits-section';
import { BetaProgramSection } from './beta-program-section';
import { FaqSection } from './faq-section';
import { FinalCtaSection } from './final-cta-section';
import { Footer } from './footer';
import { WhatsAppModal } from './whatsapp-modal';
import { MessageCircle } from 'lucide-react';

interface LandingPageViewProps {
  isLoggedIn?: boolean;
}

export function LandingPageView({ isLoggedIn = false }: LandingPageViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const vagasRestantes = 3;

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F7FCFC] text-[#06232D] flex flex-col selection:bg-[#18B5B5]/20 selection:text-[#06232D] relative font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Floating Navbar Card */}
      <Navbar 
        onApplyClick={handleOpenModal} 
        vagasRestantes={vagasRestantes} 
        isLoggedIn={isLoggedIn}
      />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* 1. Hero Section com Gradiente e Mockup SaaS */}
        <HeroSection onApplyClick={handleOpenModal} vagasRestantes={vagasRestantes} />

        {/* 2. O que é o ServiceZap */}
        <AboutServiceZapSection />

        {/* 3. Benefícios (Seção Branca) */}
        <BenefitsSection onApplyClick={handleOpenModal} />

        {/* 4. Como funciona o Programa Piloto (3 Passos) */}
        <BetaProgramSection onApplyClick={handleOpenModal} />

        {/* 5. FAQ (Perguntas Frequentes em Accordion) */}
        <FaqSection onApplyClick={handleOpenModal} />

        {/* 7. Chamada Final em Turquesa */}
        <FinalCtaSection onApplyClick={handleOpenModal} vagasRestantes={vagasRestantes} />
      </main>

      {/* WhatsApp Modal com Formulário de Candidatura */}
      <WhatsAppModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        defaultPhone={process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || "5563984913860"}
      />

      {/* Floating Mobile Pill */}
      <div className="fixed bottom-5 right-5 z-40 sm:hidden">
        <button
          onClick={handleOpenModal}
          className="flex items-center gap-2 rounded-full bg-[#18B5B5] px-4 py-3 text-xs font-bold text-white shadow-lg active:scale-95 transition"
        >
          <MessageCircle className="h-4 w-4 fill-current" />
          <span>Garantir vaga grátis</span>
        </button>
      </div>

      {/* Footer */}
      <Footer onApplyClick={handleOpenModal} />
    </div>
  );
}
