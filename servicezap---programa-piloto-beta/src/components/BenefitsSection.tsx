import React from 'react';
import { 
  Zap, 
  ShieldCheck, 
  QrCode, 
  Clock, 
  CheckCircle2, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';

interface BenefitsSectionProps {
  onApplyClick?: () => void;
}

export const BenefitsSection: React.FC<BenefitsSectionProps> = ({ onApplyClick }) => {
  const benefits = [
    {
      id: 'atendimento-na-hora',
      icon: Zap,
      title: 'Atendimento na hora',
      description: 'O cliente recebe retorno imediato e não fecha com o concorrente.',
      badge: 'Retenção Imediata',
      highlightColor: 'from-[#FF6B35] to-[#EA580C]'
    },
    {
      id: 'conexao-estavel',
      icon: ShieldCheck,
      title: 'Conexão estável',
      description: 'O sistema não desconecta sozinho nem te deixa na mão.',
      badge: 'Zero Quedas',
      highlightColor: 'from-[#EA580C] to-[#C2410C]'
    },
    {
      id: 'facil-de-verdade',
      icon: QrCode,
      title: 'Fácil de verdade',
      description: 'Conecte via QR Code em 3 minutos, sem configurações difíceis.',
      badge: '3 Minutos',
      highlightColor: 'from-[#D2691E] to-[#B45309]'
    }
  ];

  return (
    <section 
      id="por-que-usar" 
      className="relative py-16 sm:py-20 bg-gradient-to-b from-[#FAF5ED] via-[#FFF9F0] to-[#FAF5ED] border-y border-[#FFE0B2]/80 overflow-hidden"
    >
      {/* Background soft ambient glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[650px] rounded-full bg-[#FFE8D6]/70 blur-[110px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-12 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-[#FFF0E0] px-3.5 py-1 text-xs font-bold text-[#C2410C] border border-[#FFD8A8] mb-3 shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-[#EA580C]" />
            <span>VANTAGENS REAIS PARA O SEU DIA A DIA</span>
          </div>

          {/* 2. Por que usar na sua rotina? */}
          <h2 
            id="benefits-main-heading"
            className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#1C1917] tracking-tight leading-tight"
          >
            Por que usar na sua rotina?
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#57534E]">
            Desenvolvido pensando no prestador de serviço que passa o dia na rua e não pode deixar clientes sem resposta.
          </p>
        </motion.div>

        {/* 3 Simple, Focused Benefit Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {benefits.map((benefit, idx) => {
            const IconComponent = benefit.icon;
            return (
              <motion.div
                key={benefit.id}
                id={benefit.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.45, delay: idx * 0.12 }}
                whileHover={{ y: -4 }}
                className="group relative rounded-3xl border border-[#FFD8A8]/90 bg-white/95 p-6 sm:p-8 shadow-xs hover:shadow-[0_15px_30px_rgba(255,107,53,0.12)] transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className={`flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-br ${benefit.highlightColor} text-white shadow-[0_4px_12px_rgba(255,107,53,0.25)] group-hover:scale-105 transition-transform`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <span className="rounded-full bg-[#FFF0E0] px-2.5 py-0.5 text-[11px] font-bold text-[#C2410C] border border-[#FFD8A8]">
                      {benefit.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-[#1C1917] mb-2 tracking-tight">
                    {benefit.title}
                  </h3>

                  <p className="text-sm sm:text-base text-[#57534E] leading-relaxed">
                    {benefit.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#F5E6D3] flex items-center gap-2 text-xs font-semibold text-[#EA580C]">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Sem complexidade técnica</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Quick in-between CTA trigger */}
        {onApplyClick && (
          <div className="mt-12 text-center">
            <button
              onClick={onApplyClick}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#C2410C] hover:text-[#9A3412] hover:underline cursor-pointer transition"
            >
              <span>Garantir meus 3 meses de acesso gratuito agora</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

      </div>
    </section>
  );
};
