'use client';

import React from 'react';
import { Zap, MessageSquareCheck, Users, Layers } from 'lucide-react';

export const AboutServiceZapSection: React.FC = () => {
  return (
    <section className="relative py-10 bg-white/60 border-y border-[#FFE0B2]/70 backdrop-blur-xs">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-[#FFFDF9] via-[#FFF8EE] to-[#FFF0E0] border border-[#FFD8A8] p-6 sm:p-10 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Col: Tagline & Explanation */}
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#FFF0E0] px-3.5 py-1 text-xs font-bold text-[#C2410C] border border-[#FFD8A8]">
                <Zap className="h-3.5 w-3.5 text-[#EA580C]" />
                <span>O QUE É O SERVICEZAP?</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1C1917] tracking-tight leading-snug font-['Plus_Jakarta_Sans',sans-serif]">
                A plataforma definitiva para profissionalizar seu atendimento no WhatsApp.
              </h2>

              <p className="text-base sm:text-lg text-[#44403C] leading-relaxed">
                O <strong>ServiceZap</strong> é a solução desenvolvida para <strong>prestadores de serviço, assistências técnicas e pequenas empresas</strong> que precisam profissionalizar o contato via WhatsApp. Com ele, você <strong>elimina o caos das mensagens e orçamentos perdidos</strong>, coloca múltiplos atendentes respondendo no mesmo número e cria fluxos automáticos sem complicação — tudo integrado à gestão de Ordens de Serviço e Faturas.
              </p>

              <div className="pt-2 flex flex-wrap gap-3 text-xs font-semibold text-[#57534E]">
                <span className="flex items-center gap-1.5 bg-white/90 px-3 py-1.5 rounded-xl border border-[#FFD8A8] shadow-2xs">
                  <MessageSquareCheck className="h-4 w-4 text-[#EA580C]" /> Zero orçamentos perdidos
                </span>
                <span className="flex items-center gap-1.5 bg-white/90 px-3 py-1.5 rounded-xl border border-[#FFD8A8] shadow-2xs">
                  <Users className="h-4 w-4 text-[#EA580C]" /> Vários atendentes no 1º número
                </span>
                <span className="flex items-center gap-1.5 bg-white/90 px-3 py-1.5 rounded-xl border border-[#FFD8A8] shadow-2xs">
                  <Layers className="h-4 w-4 text-[#EA580C]" /> Fluxos automáticos simples
                </span>
              </div>
            </div>

            {/* Right Col: Visual Summary Card */}
            <div className="lg:col-span-4 flex justify-center">
              <div className="w-full max-w-sm rounded-2xl bg-white p-5 border border-[#FFD8A8] shadow-xs text-center space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF6B35] to-[#EA580C] text-white shadow-sm">
                  <Zap className="h-7 w-7" />
                </div>
                <h3 className="text-base font-bold text-[#1C1917]">Atendimento Comercial Profissional</h3>
                <p className="text-xs text-[#78716C]">
                  Centralize conversas, conecte sua equipe e feche mais serviços direto pelo WhatsApp.
                </p>
                <div className="pt-2 text-[11px] font-extrabold text-[#C2410C] uppercase tracking-wider bg-[#FFF0E0] py-1 px-3 rounded-lg border border-[#FFB380]/60">
                  Pronto em 3 minutos
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};
