'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export const FaqSection: React.FC<{ onApplyClick: () => void }> = ({ onApplyClick }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'Como funciona o Programa Piloto?',
      answer: 'O Programa Piloto permite que prestadores de serviço testem o ServiceZap com acompanhamento direto da nossa equipe. Você terá suporte na configuração do seu WhatsApp, respostas automáticas, orçamentos e Ordens de Serviço sem complicações.'
    },
    {
      question: 'Os 3 meses são realmente gratuitos?',
      answer: 'Sim! Os 3 primeiros meses são 100% gratuitos no Plano Básico para todos os aprovados na seleção do Programa Piloto, sem cobranças escondidas e sem intermediários.'
    },
    {
      question: 'O que acontece depois dos 3 meses?',
      answer: 'Ao final dos 3 meses, você poderá escolher continuar no plano que melhor atende à sua rotina (a partir de R$ 49/mês), sem fidelidade ou multa de cancelamento. Se optar por não continuar, sua conta é pausada normalmente.'
    },
    {
      question: 'Quantas vagas estão disponíveis?',
      answer: 'O Programa Piloto é restrito a apenas 5 vagas no total para garantir atendimento personalizado a cada empresa participante. No momento, restam apenas 3 vagas disponíveis.'
    },
    {
      question: 'Preciso cadastrar cartão de crédito?',
      answer: 'Não! O cadastro da candidatura exige apenas o nome, WhatsApp e dados básicos do seu serviço. Não solicitamos dados bancários nem cartão de crédito para ingressar no programa piloto.'
    },
    {
      question: 'Como posso participar?',
      answer: 'Basta clicar no botão "Garantir minha vaga gratuita", preencher o formulário rápido de candidatura e nossa equipe entrará em contato direto no seu WhatsApp para liberar seu acesso.'
    }
  ];

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-16 sm:py-24 bg-white relative overflow-hidden">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#C8F3EF] px-4 py-1.5 text-xs font-bold text-[#0E969C] mb-3">
            <HelpCircle className="h-4 w-4" />
            <span>TIRE SUAS DÚVIDAS</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#06232D] tracking-tight">
            Perguntas Frequentes (FAQ)
          </h2>
          <p className="mt-3 text-base text-[#286A70]">
            Respostas claras sobre o funcionamento do Programa Piloto e do ServiceZap.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div 
                key={idx}
                className="rounded-2xl border border-[#E2F3F2] bg-white overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between p-5 text-left text-base sm:text-lg font-bold text-[#06232D] hover:text-[#18B5B5] transition-colors cursor-pointer"
                >
                  <span>{faq.question}</span>
                  <ChevronDown className={`h-5 w-5 text-[#0E969C] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-sm sm:text-base text-[#286A70] leading-relaxed border-t border-[#E2F3F2]/60 pt-3 animate-in fade-in duration-200">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-[#286A70] mb-4">
            Ficou com alguma dúvida específica sobre o seu tipo de serviço?
          </p>
          <button
            onClick={onApplyClick}
            className="inline-flex items-center gap-2 text-sm font-bold text-[#18B5B5] hover:text-[#0E969C] underline decoration-[#C8F3EF] decoration-2 cursor-pointer"
          >
            Falar diretamente com nossa equipe no WhatsApp →
          </button>
        </div>

      </div>
    </section>
  );
};
