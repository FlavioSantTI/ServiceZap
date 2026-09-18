'use client';

import React from 'react';
import { Zap, MessageSquareCheck, Users, Layers } from 'lucide-react';

export const AboutServiceZapSection: React.FC = () => {
  return (
    <section className="relative py-12 bg-white border-y border-[#C8F3EF]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-[#C8F3EF]/30 via-white to-[#C8F3EF]/30 border border-[#C8F3EF] p-6 sm:p-10 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Col: Tagline & Explanation */}
            <div className="lg:col-span-8 space-y-4 text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#C8F3EF] px-3.5 py-1 text-xs font-bold text-[#0E969C] border border-[#39C8C5]/30">
                <Zap className="h-3.5 w-3.5 text-[#18B5B5] fill-current" />
                <span>O QUE É O SERVICEZAP?</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#06232D] tracking-tight leading-snug font-['Plus_Jakarta_Sans',sans-serif]">
                A plataforma definitiva para profissionalizar seu atendimento no WhatsApp.
              </h2>

              <p className="text-base sm:text-lg text-[#286A70] leading-relaxed">
                O <strong>ServiceZap</strong> foi desenvolvido para <strong>prestadores de serviço, assistências técnicas e pequenas empresas</strong> que precisam profissionalizar o contato via WhatsApp. Com ele, você <strong>elimina mensagens e orçamentos perdidos</strong>, coloca múltiplos atendentes no mesmo número e cria fluxos automáticos sem complicação.
              </p>

              <div className="pt-2 flex flex-wrap gap-3 text-xs font-semibold text-[#0E969C]">
                <span className="flex items-center gap-1.5 bg-white px-3.5 py-2 rounded-xl border border-[#C8F3EF] shadow-2xs">
                  <MessageSquareCheck className="h-4 w-4 text-[#18B5B5]" /> Zero orçamentos perdidos
                </span>
                <span className="flex items-center gap-1.5 bg-white px-3.5 py-2 rounded-xl border border-[#C8F3EF] shadow-2xs">
                  <Users className="h-4 w-4 text-[#18B5B5]" /> Vários atendentes no mesmo número
                </span>
                <span className="flex items-center gap-1.5 bg-white px-3.5 py-2 rounded-xl border border-[#C8F3EF] shadow-2xs">
                  <Layers className="h-4 w-4 text-[#18B5B5]" /> Fluxos automáticos simples
                </span>
              </div>
            </div>

            {/* Right Col: Visual Summary Card */}
            <div className="lg:col-span-4 flex justify-center">
              <div className="w-full max-w-sm rounded-2xl bg-white p-6 border border-[#C8F3EF] shadow-sm text-center space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#18B5B5] text-white shadow-sm">
                  <Zap className="h-7 w-7 fill-current" />
                </div>
                <h3 className="text-base font-bold text-[#06232D]">Atendimento Comercial Profissional</h3>
                <p className="text-xs text-[#286A70]">
                  Centralize conversas, conecte sua equipe e feche mais serviços direto pelo WhatsApp.
                </p>
                <div className="pt-2 text-[11px] font-extrabold text-[#0E969C] uppercase tracking-wider bg-[#C8F3EF] py-1.5 px-3 rounded-lg border border-[#39C8C5]/40">
                  ⚡ Pronto em 3 minutos
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};
