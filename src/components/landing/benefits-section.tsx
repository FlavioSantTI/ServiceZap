'use client';

import React from 'react';
import { 
  MessageCircle, 
  FileText, 
  QrCode, 
  Users, 
  ArrowRight, 
  Zap, 
  ShieldCheck, 
  CheckCircle2 
} from 'lucide-react';

interface BenefitsSectionProps {
  onApplyClick: () => void;
}

export const BenefitsSection: React.FC<BenefitsSectionProps> = ({ onApplyClick }) => {
  const benefits = [
    {
      id: 'atendimento-whatsapp',
      icon: MessageCircle,
      title: 'WhatsApp Comercial Nativo',
      description: 'Transforme seu WhatsApp em um canal de vendas mais eficiente. Organize seus atendimentos, responda orçamentos com agilidade e aproveite melhor suas oportunidades para vender mais.',
      highlight: 'Sincronização em tempo real'
    },
    {
      id: 'ordens-servico-pdf',
      icon: FileText,
      title: 'Ordens de Serviço & PDF',
      description: 'Gere propostas e ordens de serviço profissionais com numeração automática e termo de garantia. Envie em PDF com 1 clique.',
      highlight: 'Termo de Garantia incluso'
    },
    {
      id: 'faturamento-pix',
      icon: QrCode,
      title: 'Faturas & Cobrança PIX',
      description: 'Dispare cobranças com QR Code PIX dinâmico e chave Copia e Cola direto no chat do cliente. Receba direto na sua conta.',
      highlight: 'Sem taxa por intermediação'
    },
    {
      id: 'multi-atendentes-equipes',
      icon: Users,
      title: 'Gestão de Equipes & Clientes',
      description: 'Organize cadastros de clientes, histórico de serviços e permissões para múltiplos colaboradores no mesmo WhatsApp.',
      highlight: 'Isolamento multi-tenant'
    }
  ];

  return (
    <section id="beneficios" className="py-16 sm:py-24 bg-white relative overflow-hidden">
      
      {/* Elemento de iluminação suave verde água */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#C8F3EF]/20 blur-[100px] rounded-full" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Título Centralizado conforme a especificação */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#C8F3EF] px-4 py-1.5 text-xs font-bold text-[#0E969C] mb-4">
            <Zap className="h-3.5 w-3.5 fill-current text-[#18B5B5]" />
            <span>BENEFÍCIOS EXCLUSIVOS</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#06232D] tracking-tight leading-tight">
            Mais simplicidade para <span className="text-[#18B5B5]">gerenciar seu negócio</span>
          </h2>

          <p className="mt-4 text-base sm:text-lg text-[#286A70]">
            Tudo o que você precisa para organizar seu atendimento e crescer no piloto automático.
          </p>
        </div>

        {/* Grid de 4 Cards (Fundo Branco, Border-radius 16px, Borda #E2F3F2, Hover Elevação) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((item) => {
            const IconComponent = item.icon;
            return (
              <div
                key={item.id}
                className="group rounded-2xl bg-white border border-[#E2F3F2] p-6 sm:p-7 flex flex-col justify-between shadow-[0_4px_20px_rgba(6,35,45,0.03)] hover:shadow-[0_12px_30px_rgba(24,181,181,0.12)] hover:-translate-y-1.5 transition-all duration-300"
              >
                <div>
                  {/* Ícone com Fundo Verde Água Claro #C8F3EF e Ícone #18B5B5 */}
                  <div className="h-13 w-13 rounded-2xl bg-[#C8F3EF] text-[#18B5B5] flex items-center justify-center mb-5 group-hover:bg-[#18B5B5] group-hover:text-white transition-colors duration-300">
                    <IconComponent className="h-6 w-6" />
                  </div>

                  <h3 className="text-xl font-bold text-[#06232D] mb-2.5 tracking-tight group-hover:text-[#18B5B5] transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-sm text-[#286A70] leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#E2F3F2] flex items-center gap-2 text-xs font-semibold text-[#0E969C]">
                  <CheckCircle2 className="h-4 w-4 text-[#10B981] shrink-0" />
                  <span>{item.highlight}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA Intermediário de Conversão */}
        <div className="mt-14 text-center">
          <button
            onClick={onApplyClick}
            className="inline-flex items-center gap-2.5 rounded-xl bg-[#18B5B5] hover:bg-[#0E969C] px-8 py-4 text-base font-bold text-white shadow-md transition-all hover:scale-[1.02] cursor-pointer"
          >
            <span>Quero testar o ServiceZap por 3 meses grátis</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>

      </div>
    </section>
  );
};
