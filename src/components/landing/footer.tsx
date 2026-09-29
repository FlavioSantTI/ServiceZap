'use client';

import React from 'react';
import { Zap, Heart } from 'lucide-react';
import Link from 'next/link';

interface FooterProps {
  onApplyClick: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onApplyClick }) => {
  return (
    <footer className="bg-[#06232D] text-white border-t border-[#0E969C]/40 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-[#286A70]/30">
          
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-3">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#18B5B5] text-white">
                <Zap className="h-4.5 w-4.5 fill-current" />
              </div>
              <span className="font-extrabold tracking-tight text-xl text-white">
                Service<span className="text-[#39C8C5]">Zap</span>
              </span>
            </Link>
            <p className="text-xs text-[#C8F3EF]/80 max-w-sm leading-relaxed">
              Plataforma SaaS de automação comercial e gestão de atendimento via WhatsApp para prestadores de serviço e equipes de campo.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="md:col-span-4 grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-2">
              <div className="font-bold text-[#39C8C5] uppercase tracking-wider text-[11px]">Navegação</div>
              <ul className="space-y-1.5 text-[#C8F3EF]/80">
                <li><a href="#como-funciona" className="hover:text-white transition">Como funciona</a></li>
                <li><a href="#recursos" className="hover:text-white transition">Recursos</a></li>
                <li><a href="#beneficios" className="hover:text-white transition">Benefícios</a></li>
                <li><a href="#faq" className="hover:text-white transition">Perguntas Frequentes</a></li>
              </ul>
            </div>
            <div className="space-y-2">
              <div className="font-bold text-[#39C8C5] uppercase tracking-wider text-[11px]">Legal & Acesso</div>
              <ul className="space-y-1.5 text-[#C8F3EF]/80">
                <li><Link href="/login" className="hover:text-white transition">Área do Cliente</Link></li>
                <li><button onClick={onApplyClick} className="hover:text-white transition text-left cursor-pointer">Programa Piloto</button></li>
                <li><span className="opacity-60">Termos de Uso</span></li>
                <li><span className="opacity-60">Privacidade</span></li>
              </ul>
            </div>
          </div>

          {/* Action / Contact */}
          <div className="md:col-span-3 space-y-3">
            <div className="font-bold text-[#39C8C5] uppercase tracking-wider text-[11px]">Programa Piloto Beta</div>
            <p className="text-xs text-[#C8F3EF]/80">
              Garanta uma das 3 vagas restantes do lote exclusivo de 5 empresas (3 meses 100% grátis).
            </p>
            <button
              onClick={onApplyClick}
              className="inline-flex items-center gap-2 rounded-xl bg-[#18B5B5] hover:bg-[#39C8C5] px-4 py-2 text-xs font-bold text-white transition-all cursor-pointer"
            >
              Inscrever-se no Piloto
            </button>
          </div>

        </div>

        {/* Bottom Credits */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#C8F3EF]/70 gap-2">
          <div>
            © 2026 ServiceZap. Todos os direitos reservados.
          </div>
          <div className="flex items-center gap-1 text-[11px]">
            <span>Desenvolvido com</span>
            <Heart className="h-3 w-3 text-rose-400 fill-current" />
            <span>por Flavio Santiago Consultoria IA</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
