import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { BenefitsSection } from './components/BenefitsSection';
import { BetaProgramSection } from './components/BetaProgramSection';
import { FinalCtaSection } from './components/FinalCtaSection';
import { Footer } from './components/Footer';
import { WhatsAppModal } from './components/WhatsAppModal';
import { MessageCircle } from 'lucide-react';

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const vagasRestantes = 3;

  const handleOpenWhatsApp = () => {
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FAF5ED] text-[#292524] flex flex-col selection:bg-[#FF6B35]/20 selection:text-[#C2410C] relative font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Navigation */}
      <Navbar onApplyClick={handleOpenWhatsApp} vagasRestantes={vagasRestantes} />

      {/* Main Content Sections (Strictly following the 4 requested sections) */}
      <main className="flex-1">
        {/* 1. Topo com Alerta de Vagas */}
        <HeroSection onApplyClick={handleOpenWhatsApp} vagasRestantes={vagasRestantes} />

        {/* 2. Por que usar na sua rotina? */}
        <BenefitsSection onApplyClick={handleOpenWhatsApp} />

        {/* 3. Como funciona a liberação? */}
        <BetaProgramSection onApplyClick={handleOpenWhatsApp} />

        {/* 4. Chamada Final */}
        <FinalCtaSection onApplyClick={handleOpenWhatsApp} vagasRestantes={vagasRestantes} />
      </main>

      {/* WhatsApp Modal with direct chat & owner phone configuration */}
      <WhatsAppModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        defaultPhone="5511999999999"
      />

      {/* Floating Mobile Quick Contact Pill */}
      <div className="fixed bottom-5 right-5 z-30 sm:hidden">
        <button
          onClick={handleOpenWhatsApp}
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#25D366] to-[#16A34A] px-4 py-3 text-xs font-bold text-white shadow-[0_8px_20px_rgba(34,197,94,0.4)] active:scale-95 transition"
        >
          <MessageCircle className="h-4 w-4 fill-current" />
          <span>Vaga Grátis (3 Meses)</span>
        </button>
      </div>

      {/* Footer */}
      <Footer onApplyClick={handleOpenWhatsApp} />
    </div>
  );
}
