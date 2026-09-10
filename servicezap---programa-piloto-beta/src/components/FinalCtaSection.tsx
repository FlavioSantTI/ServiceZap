import React from 'react';
import { ArrowRight, ShieldCheck, Zap, AlertTriangle, MessageCircle, Clock } from 'lucide-react';
import { motion } from 'motion/react';

interface FinalCtaSectionProps {
  onApplyClick: () => void;
  vagasRestantes?: number;
}

export const FinalCtaSection: React.FC<FinalCtaSectionProps> = ({ 
  onApplyClick,
  vagasRestantes = 3
}) => {
  return (
    <section id="chamada-final" className="relative py-16 sm:py-24 bg-gradient-to-b from-[#FAF5ED] to-[#FFF4E5] overflow-hidden">
      {/* Background warm glowing aura */}
      <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 h-[450px] w-[750px] rounded-full bg-gradient-to-t from-[#FFD8A8]/60 via-[#FFE0B2]/40 to-transparent blur-[120px]" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55 }}
          className="relative rounded-3xl border-2 border-[#FFB380] bg-gradient-to-br from-white via-[#FFFDF9] to-[#FFF5E6] p-8 sm:p-12 text-center shadow-[0_20px_50px_rgba(255,107,53,0.18)]"
        >
          {/* Top Pill: Aviso */}
          <div 
            id="aviso-encerramento"
            className="inline-flex items-center gap-2 rounded-full bg-[#FFF0E0] px-4 py-1.5 text-xs sm:text-sm font-bold text-[#C2410C] border border-[#FFB380] mb-6 shadow-xs"
          >
            <span className="text-base leading-none">⚠️</span>
            <span>Aviso: As vagas gratuitas encerram assim que o 3º prestador de serviço conectar.</span>
          </div>

          {/* Section Main Title */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#1C1917] tracking-tight leading-tight max-w-3xl mx-auto mb-5 font-['Plus_Jakarta_Sans',sans-serif]">
            Não deixe seus clientes esperando o próximo orçamento.
          </h2>

          <p className="text-base sm:text-lg text-[#57534E] max-w-2xl mx-auto mb-8 font-normal">
            Garanta agora 3 meses de ServiceZap gratuito no Plano Básico e coloque seu WhatsApp para atender no piloto automático.
          </p>

          {/* Scarcity Counter Bar */}
          <div className="inline-flex items-center gap-3 rounded-2xl bg-[#FFF0E0] px-5 py-2.5 border border-[#FFD8A8] mb-8">
            <span className="flex h-3 w-3 rounded-full bg-[#EA580C] animate-pulse" />
            <span className="text-xs sm:text-sm font-semibold text-[#1C1917]">
              Status das Vagas:
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-[#C2410C] bg-white px-3 py-1 rounded-lg border border-[#FFB380]/70 shadow-xs">
              Apenas {vagasRestantes} vagas abertas
            </span>
          </div>

          {/* Botão: [ Garantir Minha Vaga Gratuita ] */}
          <div className="flex flex-col items-center justify-center gap-3">
            <button
              id="final-cta-btn"
              onClick={onApplyClick}
              className="group relative inline-flex items-center justify-center gap-3 w-full sm:w-auto rounded-2xl bg-gradient-to-r from-[#FF6B35] via-[#F78C6B] to-[#EA580C] px-8 sm:px-10 py-4 sm:py-5 text-base sm:text-lg font-bold text-white shadow-[0_12px_30px_rgba(255,107,53,0.4)] transition-all duration-300 hover:shadow-[0_18px_40px_rgba(255,107,53,0.55)] hover:scale-[1.02] active:scale-[0.99] cursor-pointer"
            >
              <MessageCircle className="h-5 w-5" />
              <span>Garantir Minha Vaga Gratuita</span>
              <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1.5" />
            </button>

            {/* Microcopy */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs sm:text-sm font-medium text-[#78716C] mt-2">
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-4 w-4 text-[#EA580C]" /> Sem cartão de crédito
              </span>
              <span>•</span>
              <span>Configuração assistida em minutos</span>
              <span>•</span>
              <span className="text-[#C2410C] font-semibold">100% Gratuito por 3 Meses</span>
            </div>
          </div>

        </motion.div>
      </div>
    </section>
  );
};
