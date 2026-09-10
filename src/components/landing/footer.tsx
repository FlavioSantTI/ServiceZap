'use client';

import React from 'react';
import { Zap, ShieldCheck, Heart } from 'lucide-react';
import Link from 'next/link';

interface FooterProps {
  onApplyClick?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onApplyClick }) => {
  return (
    <footer className="border-t border-[#FFE0B2]/80 bg-[#FAF5ED] py-12 text-[#57534E]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#D2691E] text-white shadow-xs">
                <Zap className="h-4 w-4" />
              </div>
              <span className="font-extrabold tracking-tight text-lg text-[#1C1917]">
                Service<span className="text-[#EA580C]">Zap</span>
              </span>
              <span className="rounded-full bg-[#FFE0B2] px-2 py-0.5 text-[10px] font-bold text-[#C2410C]">
                PILOTO BETA
              </span>
            </div>

            <p className="text-xs text-[#78716C] max-w-sm leading-relaxed">
              Automação comercial de WhatsApp sem quedas e sem complicação técnica. Feito sob medida para prestadores de serviço.
            </p>

            <div className="flex items-center gap-2 text-xs font-semibold text-[#C2410C]">
              <ShieldCheck className="h-4 w-4" />
              <span>Conexão direta e segura</span>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1C1917] mb-3">
              Programa Piloto
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#por-que-usar" className="hover:text-[#EA580C] transition">
                  Por que usar?
                </a>
              </li>
              <li>
                <a href="#como-funciona-liberacao" className="hover:text-[#EA580C] transition">
                  Como funciona?
                </a>
              </li>
              <li>
                <button onClick={onApplyClick} className="text-[#C2410C] font-bold hover:underline cursor-pointer">
                  Candidatar-se (3 Meses Grátis)
                </button>
              </li>
            </ul>
          </div>

          {/* Program Info */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1C1917] mb-3">
              Vagas do Piloto
            </h4>
            <div className="rounded-xl bg-[#FFF0E0] p-3 border border-[#FFD8A8] text-xs text-[#C2410C] font-semibold space-y-1">
              <div>⚠️ Programa de Acesso Controlado</div>
              <div className="text-[11px] text-[#78716C] font-normal">
                Acesso liberado exclusivamente para empresas com candidatura pré-aprovada.
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-[#E7D7C1] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#78716C]">
          <p>© {new Date().getFullYear()} ServiceZap. Todos os direitos reservados.</p>
          <p className="flex items-center gap-1">
            <span>Desenvolvido para impulsionar prestadores de serviço</span>
            <Heart className="h-3.5 w-3.5 text-red-500 fill-current" />
          </p>
        </div>
      </div>
    </footer>
  );
};
