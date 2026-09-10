import React from 'react';
import { Zap, MessageCircle } from 'lucide-react';

interface FooterProps {
  onApplyClick?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onApplyClick }) => {
  return (
    <footer className="border-t border-[#FFE0B2]/80 bg-[#1C1917] py-10 text-[#A8A29E] text-xs">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#D2691E] text-white shadow-xs">
              <Zap className="h-4 w-4" />
            </div>
            <span className="font-extrabold text-sm text-white tracking-tight">
              Service<span className="text-[#FF6B35]">Zap</span>
            </span>
            <span className="text-[#57534E]">|</span>
            <span className="text-[#D6D3D1]">Programa Piloto: 5 Vagas Gratuitas por 3 Meses</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 text-center md:text-right text-[#A8A29E]">
            {onApplyClick && (
              <button
                onClick={onApplyClick}
                className="inline-flex items-center gap-1.5 text-[#FF6B35] hover:text-[#FFA07A] font-semibold transition cursor-pointer"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>Garantir Vaga no WhatsApp</span>
              </button>
            )}
            <p className="text-[11px] text-[#78716C]">
              © {new Date().getFullYear()} ServiceZap. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
