'use client';

import React from 'react';
import { ArrowRight, ShieldCheck, Zap } from 'lucide-react';

interface FinalCtaSectionProps {
  onApplyClick: () => void;
  vagasRestantes?: number;
}

export const FinalCtaSection: React.FC<FinalCtaSectionProps> = ({ 
  onApplyClick,
  vagasRestantes = 3
}) => {
  return (
    <section id="chamada-final" className="relative py-16 sm:py-24 bg-gradient-to-br from-[#0E969C] via-[#18B5B5] to-[#0E969C] text-white overflow-hidden">
      
      {/* Background organic wave graphics */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[#39C8C5]/20 blur-[120px] rounded-full" />
        <div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] bg-[#C8F3EF]/20 blur-[90px] rounded-full" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center z-10">
        <div className="rounded-[24px] border border-white/20 bg-white/10 backdrop-blur-md p-8 sm:p-14 shadow-2xl">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-4 py-1.5 text-xs font-extrabold text-white border border-white/30 mb-6 shadow-xs">
            <Zap className="h-4 w-4 fill-current text-[#C8F3EF]" />
            <span>ÚLTIMA OPORTUNIDADE DO PROGRAMA PILOTO</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight max-w-3xl mx-auto mb-5 font-['Plus_Jakarta_Sans',sans-serif]">
            Pronto para experimentar?
          </h2>

          <p className="text-base sm:text-lg text-[#C8F3EF] max-w-2xl mx-auto mb-8 font-medium">
            Inscreva-se em menos de 1 minuto e garanta 3 meses de acesso gratuito ao ServiceZap no Plano Básico.
          </p>

          <div className="inline-flex items-center gap-2 rounded-xl bg-[#FFF7ED] px-4 py-2 border border-[#F59E0B]/50 mb-8 shadow-xs">
            <span className="flex h-2.5 w-2.5 rounded-full bg-[#F59E0B] animate-pulse" />
            <span className="text-xs sm:text-sm font-extrabold text-[#06232D]">
              🔥 Restam apenas {vagasRestantes} vagas no Programa Piloto.
            </span>
          </div>

          <div className="flex flex-col items-center justify-center gap-4">
            <button
              id="final-cta-btn"
              onClick={onApplyClick}
              className="group inline-flex items-center justify-center gap-3 rounded-xl bg-white hover:bg-[#C8F3EF] px-9 py-4.5 text-base sm:text-lg font-extrabold text-[#0E969C] shadow-[0_10px_30px_rgba(6,35,45,0.25)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <span>Garantir minha vaga gratuita</span>
              <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
            </button>

            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-[#C8F3EF] mt-2">
              <ShieldCheck className="h-4 w-4 text-white shrink-0" />
              <span>Sem cartão de crédito • Configuração fácil • Cancelamento livre</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
