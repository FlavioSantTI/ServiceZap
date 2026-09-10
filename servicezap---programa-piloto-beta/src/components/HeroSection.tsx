import React from 'react';
import { 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  Zap, 
  AlertTriangle,
  MessageCircle
} from 'lucide-react';
import { motion } from 'motion/react';

interface HeroSectionProps {
  onApplyClick: () => void;
  vagasRestantes?: number;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ 
  onApplyClick, 
  vagasRestantes = 5 
}) => {
  return (
    <section id="topo-alerta-vagas" className="relative overflow-hidden pt-8 pb-16 sm:pt-14 sm:pb-24">
      {/* Warm background subtle ambient glows */}
      <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-[450px] w-[750px] rounded-full bg-gradient-to-br from-[#FFE0B2] via-[#FFD8A8] to-[#FF6B35]/20 blur-[120px] opacity-70" />
      <div className="pointer-events-none absolute top-1/3 right-[-5%] h-[350px] w-[400px] rounded-full bg-[#FFE8D6] blur-[90px] opacity-80" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Main Copy Column (Optimized for quick mobile & desktop reading) */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            
            {/* Selo / Destaque: ⚠️ Programa Piloto: Apenas 5 vagas abertas */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              id="hero-tagline-badge"
              className="inline-flex items-center gap-2 rounded-full border border-[#FFB380] bg-gradient-to-r from-[#FFF0E0] to-[#FFE0B2] px-3.5 py-1.5 text-xs sm:text-sm font-bold text-[#C2410C] shadow-[0_2px_10px_rgba(255,107,53,0.15)] mb-5"
            >
              <span className="text-base leading-none">⚠️</span>
              <span className="tracking-tight">Programa Piloto: Apenas {vagasRestantes} vagas abertas</span>
            </motion.div>

            {/* Título: Pare de perder orçamentos enquanto você está em atendimento. */}
            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              id="hero-main-title"
              className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.1rem] font-extrabold tracking-tight text-[#1C1917] leading-[1.18] mb-5 font-['Plus_Jakarta_Sans',sans-serif]"
            >
              Pare de perder orçamentos enquanto você está em atendimento.
            </motion.h1>

            {/* Subtítulo: Automatize seu WhatsApp sem quedas e sem complicação técnica. Responda clientes na hora e feche serviços no piloto automático. */}
            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              id="hero-subtitle"
              className="text-base sm:text-lg text-[#57534E] leading-relaxed max-w-2xl mb-8 font-normal"
            >
              Automatize seu WhatsApp sem quedas e sem complicação técnica. Responda clientes na hora e feche serviços no piloto automático.
            </motion.p>

            {/* Botão: [ Quero 3 Meses Grátis ] + Microcopy */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="w-full sm:w-auto flex flex-col items-start gap-3"
            >
              <button
                id="hero-cta-btn"
                onClick={onApplyClick}
                className="group relative inline-flex items-center justify-center gap-3 w-full sm:w-auto rounded-2xl bg-gradient-to-r from-[#FF6B35] via-[#F78C6B] to-[#EA580C] px-8 py-4 text-base sm:text-lg font-bold text-white shadow-[0_12px_28px_rgba(255,107,53,0.38)] transition-all duration-300 hover:shadow-[0_16px_36px_rgba(255,107,53,0.5)] hover:scale-[1.02] active:scale-[0.99] cursor-pointer"
              >
                <span>Quero 3 Meses Grátis</span>
                <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1.5" />
              </button>

              {/* Abaixo do botão: Acesso gratuito no Plano Básico para os 3 primeiros • Sem cartão de crédito */}
              <div 
                id="hero-below-cta-note"
                className="flex items-center gap-2 text-xs sm:text-sm font-medium text-[#78716C]"
              >
                <ShieldCheck className="h-4 w-4 text-[#EA580C] shrink-0" />
                <span>Acesso gratuito no Plano Básico para os 3 primeiros • Sem cartão de crédito</span>
              </div>
            </motion.div>

            {/* Quick 3 Highlights Badges */}
            <div className="mt-8 pt-6 border-t border-[#E7D7C1]/80 grid grid-cols-3 gap-3 sm:gap-6 w-full max-w-lg">
              <div className="rounded-2xl bg-[#FFF9F0] p-3 border border-[#FFE4C4]/70 shadow-xs text-center">
                <div className="text-lg sm:text-xl font-extrabold text-[#C2410C]">Na Hora</div>
                <div className="text-[11px] font-medium text-[#78716C]">Resposta Imediata</div>
              </div>
              <div className="rounded-2xl bg-[#FFF9F0] p-3 border border-[#FFE4C4]/70 shadow-xs text-center">
                <div className="text-lg sm:text-xl font-extrabold text-[#1C1917]">Estável</div>
                <div className="text-[11px] font-medium text-[#78716C]">Sem Quedas</div>
              </div>
              <div className="rounded-2xl bg-[#FFF9F0] p-3 border border-[#FFE4C4]/70 shadow-xs text-center">
                <div className="text-lg sm:text-xl font-extrabold text-[#D97706]">3 Meses</div>
                <div className="text-[11px] font-medium text-[#78716C]">100% Gratuito</div>
              </div>
            </div>

          </div>

          {/* Right Column: Visual WhatsApp Live Stability Demonstration Card */}
          <div className="lg:col-span-5">
            <motion.div 
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative rounded-3xl border border-[#FFD8A8] bg-[#FFFDF9]/95 shadow-[0_20px_50px_rgba(210,105,30,0.12)] p-5 sm:p-7 backdrop-blur-xl"
            >
              {/* Decorative top accent gradient bar */}
              <div className="absolute -top-px left-8 right-8 h-1 bg-gradient-to-r from-[#FF6B35] via-[#F78C6B] to-[#D2691E] rounded-full" />

              {/* Header Status Inside Card */}
              <div className="flex items-center justify-between border-b border-[#FFE4C4]/80 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#25D366] to-[#16A34A] text-white shadow-sm">
                    <MessageCircle className="h-5 w-5" />
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[#1C1917] leading-none">
                      WhatsApp Comercial
                    </h2>
                    <p className="text-[11px] text-[#16A34A] font-semibold mt-1 flex items-center gap-1">
                      <span>●</span> Ativo e respondendo clientes
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-[#FFE0B2] px-2.5 py-1 text-[11px] font-bold text-[#C2410C]">
                  QR Code 3 min
                </span>
              </div>

              {/* Real-life Scenario: Customer asking while contractor is busy */}
              <div className="space-y-3 font-sans text-xs">
                {/* Situation Alert */}
                <div className="rounded-xl bg-[#FFF8EE] border border-[#FFD8A8]/60 p-2.5 text-[11px] text-[#A16207] flex items-center gap-2">
                  <Clock className="h-4 w-4 shrink-0 text-[#EA580C]" />
                  <span>Você está executando um serviço e não pode atender o celular agora:</span>
                </div>

                {/* Message Incoming */}
                <div className="flex items-end gap-2 max-w-[85%]">
                  <div className="rounded-2xl rounded-bl-xs bg-stone-100 p-3 text-[#292524] shadow-xs">
                    <p className="font-semibold text-[11px] text-stone-600 mb-0.5">Cliente Potencial</p>
                    <p>Boa tarde! Preciso de um orçamento urgente para instalação. Vocês atendem esta semana?</p>
                    <span className="block text-[10px] text-stone-400 text-right mt-1">14:32</span>
                  </div>
                </div>

                {/* Instant Automatic Response by ServiceZap */}
                <div className="flex items-end justify-end gap-2 ml-auto max-w-[90%]">
                  <div className="rounded-2xl rounded-br-xs bg-gradient-to-br from-[#FFF0E0] to-[#FFE8D6] border border-[#FFD8A8] p-3 text-[#1C1917] shadow-xs">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="font-bold text-[11px] text-[#C2410C]">ServiceZap (Resposta Imediata)</span>
                      <span className="text-[10px] font-semibold text-[#16A34A]">0 segundos</span>
                    </div>
                    <p className="text-xs leading-relaxed">
                      Olá! Atendemos sim. Já recebi seu pedido de orçamento. Me informe seu bairro e o tipo de serviço que em instantes enviamos a proposta.
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-stone-500 mt-1.5 pt-1 border-t border-[#FFD8A8]/50">
                      <span className="text-[#EA580C] font-semibold">⚡ Cliente não foi pro concorrente</span>
                      <span>14:32 ✓✓</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scarcity Trigger at bottom of card */}
              <div className="mt-5 rounded-2xl bg-gradient-to-r from-[#FFF0E0] to-[#FFE8D6] p-3 border border-[#FFD8A8] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-[#EA580C] animate-pulse" />
                  <span className="text-xs font-bold text-[#1C1917]">Vagas do Programa Piloto:</span>
                </div>
                <span className="text-xs font-extrabold text-[#C2410C] bg-white px-2.5 py-0.5 rounded-lg border border-[#FFB380]/60 shadow-xs">
                  {vagasRestantes} de 3 restantes
                </span>
              </div>

            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
};
