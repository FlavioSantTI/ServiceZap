'use client';

import React from 'react';
import { 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  MessageCircle, 
  CheckCircle2, 
  TrendingUp, 
  Zap, 
  Check, 
  Sparkles,
  Play
} from 'lucide-react';

interface HeroSectionProps {
  onApplyClick: () => void;
  vagasRestantes?: number;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ 
  onApplyClick, 
  vagasRestantes = 3 
}) => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="recursos" className="relative overflow-hidden pt-6 pb-16 sm:pt-10 sm:pb-24 min-h-[75vh] flex items-center">
      
      {/* Background inspirado na imagem de referência: Gradiente fluido e formas orgânicas teal/turquesa */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        {/* Blob Orgânico Grande Superior Direita */}
        <div className="absolute -top-24 right-[-10%] w-[650px] h-[650px] rounded-full bg-gradient-to-br from-[#39C8C5]/20 via-[#18B5B5]/15 to-[#C8F3EF]/30 blur-[100px]" />
        
        {/* Onda/Blob Suave Inferior Esquerda */}
        <div className="absolute top-1/3 -left-32 w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-[#C8F3EF]/60 via-[#39C8C5]/10 to-transparent blur-[110px]" />
        
        {/* Luz Difusa Central */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[450px] bg-[#C8F3EF]/30 blur-[130px] rounded-full" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          
          {/* Coluna Esquerda: Conteúdo Principal e Oferta */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            
            {/* 3. Badge de Oferta: ⚡ PROGRAMA PILOTO */}
            <div 
              id="hero-badge"
              className="inline-flex items-center gap-2 rounded-full bg-[#C8F3EF] border border-[#39C8C5]/40 px-4 py-1.5 text-xs sm:text-sm font-bold text-[#0E969C] shadow-xs mb-5"
            >
              <Zap className="h-4 w-4 fill-current text-[#18B5B5]" />
              <span className="tracking-wide uppercase text-[11px] sm:text-xs">⚡ PROGRAMA PILOTO</span>
              <span className="text-[#39C8C5]">•</span>
              <span className="font-semibold text-[#0E969C]">ACESSO ANTECIPADO</span>
            </div>

            {/* 4. Headline Grande */}
            <h1 
              id="hero-headline"
              className="text-3xl sm:text-5xl lg:text-[3.6rem] font-extrabold tracking-tight text-[#06232D] leading-[1.02] mb-5 font-['Plus_Jakarta_Sans',sans-serif]"
            >
              Controle seu negócio e WhatsApp com <span className="text-[#18B5B5] underline decoration-[#C8F3EF] decoration-wavy decoration-2">mais simplicidade</span>.
            </h1>

            {/* 5. Subtítulo */}
            <p 
              id="hero-subtitle"
              className="text-base sm:text-lg text-[#286A70] leading-relaxed max-w-2xl mb-6 font-medium"
            >
              Faça parte dos primeiros usuários e tenha 3 meses de acesso gratuito. Responda clientes na hora, envie orçamentos e emita Ordens de Serviço sem complicações.
            </p>

            {/* 6. Bloco Oferta do Programa Piloto (Scarcity Box) */}
            <div 
              id="hero-scarcity-box"
              className="w-full max-w-xl rounded-[14px] bg-[#FFF7ED] border border-[#F59E0B]/40 p-4 mb-7 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#F59E0B]">
                    ⚠️ Apenas 5 vagas
                  </span>
                  <span className="text-stone-300">•</span>
                  <span className="text-xs font-semibold text-[#06232D]">
                    3 meses de acesso gratuito
                  </span>
                </div>
                <p className="text-xs text-[#286A70]">
                  Garantia de atendimento prioritário e onboarding assistido.
                </p>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#F59E0B]/50 shadow-2xs shrink-0">
                <span className="flex h-2.5 w-2.5 rounded-full bg-[#F59E0B] animate-pulse" />
                <span className="text-xs font-black text-[#06232D]">
                  🔥 Restam apenas {vagasRestantes} vagas
                </span>
              </div>
            </div>

            {/* 7 & 8. Botões CTAs */}
            <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 mb-4">
              {/* CTA Principal */}
              <button
                id="hero-cta-main"
                onClick={onApplyClick}
                className="group inline-flex items-center justify-center gap-3 rounded-xl bg-[#18B5B5] hover:bg-[#0E969C] px-8 h-14 text-base font-bold text-white shadow-[0_6px_20px_rgba(24,181,181,0.3)] transition-all duration-200 hover:shadow-[0_8px_25px_rgba(14,150,156,0.4)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <span>Garantir meus 3 meses grátis</span>
                <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
              </button>

              {/* CTA Secundário */}
              <button
                id="hero-cta-secondary"
                onClick={() => scrollToSection('como-funciona')}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-[#18B5B5] hover:bg-[#C8F3EF]/60 px-6 h-14 text-base font-bold text-[#0E969C] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Conhecer a plataforma</span>
              </button>
            </div>

            {/* Microcopy abaixo dos botões */}
            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-[#286A70]">
              <ShieldCheck className="h-4 w-4 text-[#18B5B5] shrink-0" />
              <span>Após o preenchimento das 5 vagas, o acesso gratuito do Programa Piloto será encerrado.</span>
            </div>

          </div>

          {/* Coluna Direita: Mockup do Produto SaaS (Aparência Real & Premium) */}
          <div className="lg:col-span-5 relative mt-6 lg:mt-0">
            
            {/* Formas orgânicas flutuantes ao redor do Mockup */}
            <div className="absolute -top-8 -left-8 w-24 h-24 rounded-full bg-[#C8F3EF] opacity-80 blur-xl pointer-events-none" />
            <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-[#39C8C5]/30 blur-2xl pointer-events-none" />

            {/* Card Flutuante Topo Direita: Notificação de Novo Orçamento */}
            <div className="absolute -top-5 right-2 z-20 hidden sm:flex items-center gap-3 rounded-2xl bg-white border border-[#C8F3EF] p-3 shadow-[0_10px_30px_rgba(6,35,45,0.12)] animate-bounce duration-1000">
              <div className="h-9 w-9 rounded-xl bg-[#10B981]/15 text-[#10B981] flex items-center justify-center font-bold">
                <Check className="h-5 w-5" />
              </div>
              <div className="text-left pr-2">
                <div className="text-xs font-bold text-[#06232D]">Orçamento Aprovado!</div>
                <div className="text-[11px] font-medium text-[#10B981]">R$ 450,00 via WhatsApp</div>
              </div>
            </div>

            {/* Card Flutuante Baixo Esquerda: Cobrança PIX */}
            <div className="absolute -bottom-5 -left-4 z-20 hidden sm:flex items-center gap-3 rounded-2xl bg-white border border-[#C8F3EF] p-3 shadow-[0_10px_30px_rgba(6,35,45,0.12)]">
              <div className="h-9 w-9 rounded-xl bg-[#18B5B5]/15 text-[#18B5B5] flex items-center justify-center">
                <Zap className="h-5 w-5 fill-current" />
              </div>
              <div className="text-left pr-2">
                <div className="text-xs font-bold text-[#06232D]">Fatura PIX Gerada</div>
                <div className="text-[11px] font-medium text-[#286A70]">Sem intermediários</div>
              </div>
            </div>

            {/* Mockup Container Principal */}
            <div className="relative rounded-[18px] border border-[#C8F3EF] bg-white p-4 sm:p-5 shadow-[0_20px_50px_rgba(14,150,156,0.12)]">
              
              {/* Header da Janela SaaS Mockup */}
              <div className="flex items-center justify-between border-b border-[#E2F3F2] pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-rose-400" />
                    <span className="h-3 w-3 rounded-full bg-amber-400" />
                    <span className="h-3 w-3 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-xs font-bold text-[#06232D] ml-2">ServiceZap Dashboard</span>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#C8F3EF] text-[10px] font-bold text-[#0E969C]">
                  <span className="h-2 w-2 rounded-full bg-[#10B981] animate-ping" />
                  <span>WhatsApp Online</span>
                </div>
              </div>

              {/* Sidebar + Dashboard Grid inside Mockup */}
              <div className="grid grid-cols-12 gap-3 text-left">
                
                {/* Mini Sidebar */}
                <div className="col-span-3 bg-[#0E969C] text-white rounded-xl p-2.5 flex flex-col justify-between hidden sm:flex h-[280px]">
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Zap className="h-4 w-4 text-[#39C8C5] fill-current" />
                      <span>SZap</span>
                    </div>
                    <div className="space-y-1 text-[11px]">
                      <div className="p-1.5 rounded-lg bg-white/15 font-bold">● Atendimento</div>
                      <div className="p-1.5 rounded-lg opacity-80 hover:opacity-100">Ordens de Serv.</div>
                      <div className="p-1.5 rounded-lg opacity-80 hover:opacity-100">Faturas PIX</div>
                      <div className="p-1.5 rounded-lg opacity-80 hover:opacity-100">Clientes</div>
                    </div>
                  </div>
                  <div className="text-[10px] opacity-75">v1.1 Piloto</div>
                </div>

                {/* Main Content inside Mockup */}
                <div className="col-span-12 sm:col-span-9 space-y-3">
                  
                  {/* Metric Cards Top */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-xl bg-[#C8F3EF]/40 border border-[#C8F3EF]">
                      <div className="text-[10px] font-bold text-[#286A70] uppercase">Faturamento Mensal</div>
                      <div className="text-base font-extrabold text-[#06232D] mt-0.5">R$ 14.850,00</div>
                      <div className="text-[10px] font-bold text-[#10B981] flex items-center gap-0.5 mt-0.5">
                        <TrendingUp className="h-3 w-3" /> +24% este mês
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#FFF7ED] border border-[#F59E0B]/30">
                      <div className="text-[10px] font-bold text-[#F59E0B] uppercase">O.S. Prontas p/ Cobrar</div>
                      <div className="text-base font-extrabold text-[#06232D] mt-0.5">8 serviços</div>
                      <div className="text-[10px] font-semibold text-[#286A70] mt-0.5">Disparo PIX em 1 clique</div>
                    </div>
                  </div>

                  {/* Live Chat Mockup Box */}
                  <div className="rounded-xl border border-[#E2F3F2] bg-slate-50 p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[11px] font-bold text-[#06232D] border-b border-slate-200 pb-1.5">
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3.5 w-3.5 text-[#18B5B5]" />
                        <span>Atendimento WhatsApp Automático</span>
                      </span>
                      <span className="text-[10px] font-semibold text-[#10B981]">Resposta: 0s</span>
                    </div>

                    {/* Customer Message */}
                    <div className="bg-white p-2 rounded-lg border border-slate-200 max-w-[85%] text-[11px] text-slate-700">
                      <span className="font-bold text-slate-900 block text-[10px]">Cliente:</span>
                      Olá! Preciso de orçamento de manutenção técnica para hoje.
                    </div>

                    {/* Bot Auto-reply */}
                    <div className="bg-[#C8F3EF]/60 border border-[#39C8C5]/30 p-2 rounded-lg ml-auto max-w-[90%] text-[11px] text-[#06232D]">
                      <span className="font-bold text-[#0E969C] block text-[10px]">ServiceZap (Bot de Orçamento):</span>
                      Olá! Recebi seu pedido. Já gerei seu orçamento nº ORC-2026-042 com termo de garantia.
                    </div>
                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
