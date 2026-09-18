'use client';

import React from 'react';
import { Star, Quote, CheckCircle2 } from 'lucide-react';

export const TestimonialsSection: React.FC = () => {
  const testimonials = [
    {
      name: 'Marcos Oliveira',
      role: 'Técnico em Ar-Condicionado & Climatização',
      city: 'São Paulo, SP',
      comment: 'Antes do ServiceZap, eu perdia orçamentos direto porque estava no meio do atendimento de campo. Agora o cliente recebe resposta imediata e já aprova o serviço na hora!',
      rating: 5,
      badge: 'Usuário Beta Alpha'
    },
    {
      name: 'Eduardo Santos',
      role: 'Eletricista & Instalações Residenciais',
      city: 'Campinas, SP',
      comment: 'A emissão de O.S. com PDF e chave PIX direto no WhatsApp facilitou demais. Meus clientes adoram o termo de garantia e o fechamento ficou muito mais rápido.',
      rating: 5,
      badge: 'Usuário Beta'
    },
    {
      name: 'Juliana Mendes',
      role: 'Gestora de Assistência Técnica',
      city: 'Curitiba, PR',
      comment: 'Colocamos 3 atendentes no mesmo WhatsApp com a equipe organizada. A plataforma é super leve, rápida e nunca travou.',
      rating: 5,
      badge: 'Usuária Beta Pro'
    }
  ];

  return (
    <section className="py-16 sm:py-20 bg-[#C8F3EF]/30 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-[#0E969C] border border-[#C8F3EF] mb-3 shadow-2xs">
            <Star className="h-3.5 w-3.5 fill-[#F59E0B] text-[#F59E0B]" />
            <span>DEPOIMENTOS DE QUEM JÁ USA</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#06232D] tracking-tight">
            Faça parte dos <span className="text-[#18B5B5]">primeiros usuários</span> da plataforma.
          </h2>
          <p className="mt-3 text-base text-[#286A70]">
            Veja o que prestadores de serviço e assistências técnicas estão achando da experiência.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <div 
              key={idx}
              className="rounded-2xl bg-white border border-[#C8F3EF] p-6 shadow-[0_4px_20px_rgba(6,35,45,0.04)] flex flex-col justify-between hover:-translate-y-1 transition-all duration-300"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex text-[#F59E0B] gap-1">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#C8F3EF] text-[#0E969C]">
                    {t.badge}
                  </span>
                </div>

                <p className="text-sm text-[#06232D] leading-relaxed italic mb-6">
                  "{t.comment}"
                </p>
              </div>

              <div className="pt-4 border-t border-[#E2F3F2] flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-[#06232D]">{t.name}</div>
                  <div className="text-xs text-[#286A70]">{t.role}</div>
                </div>
                <CheckCircle2 className="h-5 w-5 text-[#10B981] shrink-0" />
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
