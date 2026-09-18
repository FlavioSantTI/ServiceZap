'use client';

import React, { useState } from 'react';
import { Zap, ArrowRight, Menu, X } from 'lucide-react';
import Link from 'next/link';

interface NavbarProps {
  onApplyClick: () => void;
  vagasRestantes?: number;
  isLoggedIn?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onApplyClick, 
  vagasRestantes = 3,
  isLoggedIn = false 
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full flex justify-center px-4 pt-4 sm:pt-6 pb-2 transition-all">
      <div className="w-full max-w-6xl h-16 rounded-[18px] bg-white/95 backdrop-blur-md border border-[#C8F3EF] shadow-[0_4px_20px_rgba(24,181,181,0.08)] px-5 sm:px-7 flex items-center justify-between transition-all">
        
        {/* Logo Left */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#18B5B5] text-white shadow-sm group-hover:scale-105 transition-transform">
            <Zap className="h-5 w-5 fill-current" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold tracking-tight text-xl text-[#06232D]">
              Service<span className="text-[#18B5B5]">Zap</span>
            </span>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C8F3EF] text-[#0E969C]">
              PILOTO
            </span>
          </div>
        </Link>

        {/* Center Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          <button 
            onClick={() => scrollToSection('como-funciona')}
            className="text-sm font-semibold text-[#286A70] hover:text-[#0E969C] transition-colors cursor-pointer"
          >
            Como funciona
          </button>
          <button 
            onClick={() => scrollToSection('recursos')}
            className="text-sm font-semibold text-[#286A70] hover:text-[#0E969C] transition-colors cursor-pointer"
          >
            Recursos
          </button>
          <button 
            onClick={() => scrollToSection('beneficios')}
            className="text-sm font-semibold text-[#286A70] hover:text-[#0E969C] transition-colors cursor-pointer"
          >
            Benefícios
          </button>
          <button 
            onClick={() => scrollToSection('faq')}
            className="text-sm font-semibold text-[#286A70] hover:text-[#0E969C] transition-colors cursor-pointer"
          >
            FAQ
          </button>
        </nav>

        {/* Right CTA */}
        <div className="hidden sm:flex items-center gap-3">
          <button
            onClick={onApplyClick}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#18B5B5] hover:bg-[#0E969C] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <span>Quero participar</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={onApplyClick}
            className="inline-flex items-center justify-center rounded-xl bg-[#18B5B5] px-3.5 py-2 text-xs font-bold text-white shadow-xs"
          >
            <span>Quero participar</span>
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-[#06232D] hover:bg-[#C8F3EF]/50 transition-colors"
            aria-label="Abrir menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-24 left-4 right-4 bg-white border border-[#C8F3EF] rounded-2xl p-5 shadow-xl md:hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col gap-4 text-center">
            <button
              onClick={() => scrollToSection('como-funciona')}
              className="text-sm font-semibold text-[#286A70] py-2 border-b border-[#E2F3F2]"
            >
              Como funciona
            </button>
            <button
              onClick={() => scrollToSection('recursos')}
              className="text-sm font-semibold text-[#286A70] py-2 border-b border-[#E2F3F2]"
            >
              Recursos
            </button>
            <button
              onClick={() => scrollToSection('beneficios')}
              className="text-sm font-semibold text-[#286A70] py-2 border-b border-[#E2F3F2]"
            >
              Benefícios
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="text-sm font-semibold text-[#286A70] py-2 border-b border-[#E2F3F2]"
            >
              FAQ
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onApplyClick();
              }}
              className="w-full mt-2 py-3 rounded-xl bg-[#18B5B5] font-bold text-white text-sm"
            >
              Quero participar
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
