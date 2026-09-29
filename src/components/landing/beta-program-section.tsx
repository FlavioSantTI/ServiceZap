'use client';

import React from 'react';
import { 
  MousePointerClick, 
  QrCode, 
  Gift, 
  CheckCircle2 
} from 'lucide-react';

interface BetaProgramSectionProps {
  onApplyClick: () => void;
}

export const BetaProgramSection: React.FC<BetaProgramSectionProps> = ({ onApplyClick }) => {
  const steps = [
    {
      stepNumber: '1',
      icon: MousePointerClick,
      title: 'Toque no botão:',
      description: 'Preencha o formulário rápido para avaliação e garantia de uma das 3 vagas restantes.',
      badge: 'Passo 1',
      detail: 'Análise imediata do seu perfil de atendimento'
    },
    {
      stepNumber: '2',
      icon: QrCode,
      title: 'Conecte seu WhatsApp:',
      description: 'Ajudamos você a deixar tudo configurado em minutos.',
      badge: 'Passo 2',
      detail: 'Leitura rápida de QR Code sem configurações difíceis'
    },
    {
      stepNumber: '3',
      icon: Gift,
      title: 'Use 3 meses de graça:',
      description: 'Teste na prática o impacto de nunca mais demorar para responder.',
      badge: 'Passo 3',
      detail: 'Plano Básico integral sem cobranças nem fidelidade'
    }
  ];

  return (
    <section id="como-funciona" className="relative py-16 sm:py-20 bg-[#F7FCFC] overflow-hidden">
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-[350px] w-[500px] rounded-full bg-[#C8F3EF]/40 blur-[120px]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#C8F3EF] px-3.5 py-1 text-xs font-bold text-[#0E969C] border border-[#39C8C5]/30 mb-3">
            <span>PASSO A PASSO SIMPLES</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#06232D] tracking-tight leading-tight">
            Como funciona a liberação?
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#286A70]">
            Processo descomplicado em 3 etapas para você começar a atender no automático hoje mesmo.
          </p>
        </div>

        {/* 3 Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {steps.map((item) => {
            const IconComponent = item.icon;
            return (
              <div
                key={item.stepNumber}
                id={`passo-liberacao-${item.stepNumber}`}
                className="relative rounded-2xl border border-[#E2F3F2] bg-white p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:shadow-[0_12px_28px_rgba(24,181,181,0.12)] hover:-translate-y-1 transition-all duration-300"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C8F3EF] text-[#18B5B5] border border-[#39C8C5]/30 shadow-xs">
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#18B5B5] text-white font-extrabold text-sm shadow-xs">
                        {item.stepNumber}
                      </span>
                      <span className="font-mono text-xs font-bold text-[#0E969C] uppercase tracking-wider bg-[#C8F3EF]/50 px-2.5 py-1 rounded-full border border-[#C8F3EF]">
                        {item.badge}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-[#06232D] mb-2 tracking-tight">
                    {item.title}
                  </h3>

                  <p className="text-sm sm:text-base text-[#286A70] leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#E2F3F2] text-xs text-[#286A70] flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#10B981] shrink-0" />
                  <span>{item.detail}</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
