import React, { useState, useEffect } from 'react';
import { Zap, ArrowRight, MessageCircle } from 'lucide-react';

interface NavbarProps {
  onApplyClick: () => void;
  vagasRestantes?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ onApplyClick, vagasRestantes = 3 }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        scrolled
          ? 'bg-[#FAF5ED]/95 backdrop-blur-md border-b border-[#D2691E]/20 shadow-[0_4px_20px_rgba(210,105,30,0.08)] py-3'
          : 'bg-transparent border-b border-[#FFE0B2]/60 py-4'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#D2691E] text-white shadow-[0_4px_12px_rgba(255,107,53,0.35)]">
            <Zap className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-xl text-[#1C1917]">
                Service<span className="text-[#EA580C]">Zap</span>
              </span>
              <span className="rounded-full bg-[#FFE0B2]/80 px-2 py-0.5 text-[10px] font-bold text-[#C2410C] border border-[#FFB380]/60">
                PILOTO
              </span>
            </div>
            <p className="text-[11px] font-medium text-[#78716C] hidden sm:block">
              WhatsApp sem quedas para prestadores de serviço
            </p>
          </div>
        </div>

        {/* Center Live Scarcity Badge */}
        <div className="hidden md:flex items-center gap-2 rounded-full border border-[#FFB380] bg-[#FFF8EE]/90 px-3.5 py-1 text-xs font-medium text-[#57534E] shadow-xs">
          <span>⚠️</span>
          <span className="font-bold text-[#C2410C]">Apenas {vagasRestantes} vagas abertas</span>
          <span className="text-[#D6D3D1]">|</span>
          <span className="text-[#78716C] text-[11px]">3 meses grátis</span>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <button
            id="nav-apply-btn"
            onClick={onApplyClick}
            className="group relative inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B35] via-[#F78C6B] to-[#EA580C] px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-[0_4px_15px_rgba(255,107,53,0.3)] transition-all duration-200 hover:shadow-[0_6px_20px_rgba(255,107,53,0.45)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>Garantir Vaga</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
