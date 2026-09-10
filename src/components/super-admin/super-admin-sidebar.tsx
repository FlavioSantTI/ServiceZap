'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  TrendingUp,
  Shield,
  Layers,
  LogOut,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
  Crown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logoutAction } from '@/app/actions/auth';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const superAdminNavItems: NavItem[] = [
  { title: 'Visão Geral (SaaS)', href: '/super-admin', icon: TrendingUp },
  { title: 'Empresas & Tenants', href: '/super-admin/tenants', icon: Building2 },
  { title: 'Planos & Preços SaaS', href: '/super-admin/plans', icon: Crown },
];

export function SuperAdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <aside
      className={cn(
        'sticky top-0 h-screen flex flex-col border-r border-[#965B43] bg-[#AA6C52] text-[#FBE1CF] transition-all duration-300 z-20 shrink-0',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-[#965B43]">
        <Link href="/super-admin" className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FDF6EC] p-2 shadow-warm-xs">
            <Shield className="h-5 w-5 text-[#AA6C52]" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-[#FDF6EC] flex items-center gap-1.5">
                ServiceZap <span className="text-xs bg-[#874E37] text-[#FDF6EC] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Master</span>
              </span>
              <span className="text-xs text-[#FBE1CF]/80">Super Admin Panel</span>
            </div>
          )}
        </Link>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg bg-[#965B43] hover:bg-[#874E37] text-[#FBE1CF] hover:text-[#FDF6EC] transition-colors cursor-pointer"
          title={collapsed ? 'Expandir' : 'Recolher'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 space-y-1.5 p-3">
        {superAdminNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 min-h-[44px] text-sm font-medium transition-all duration-200 group',
                isActive
                  ? 'bg-[#FDF6EC] text-[#3A2A1D] font-bold shadow-warm-xs'
                  : 'text-[#FBE1CF] hover:bg-[#965B43] hover:text-[#FDF6EC]'
              )}
              title={collapsed ? item.title : undefined}
            >
              <Icon
                className={cn(
                  'h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-105',
                  isActive ? 'text-[#3A2A1D]' : 'text-[#FBE1CF] group-hover:text-[#FDF6EC]'
                )}
              />
              {!collapsed && <span className="truncate">{item.title}</span>}
              {!collapsed && item.badge && (
                <span
                  className={cn(
                    'ml-auto rounded-full px-2 py-0.5 text-xs font-semibold',
                    isActive ? 'bg-[#AA6C52] text-[#FDF6EC]' : 'bg-[#965B43] text-[#FDF6EC]'
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Return to Tenant App & Logout Button */}
      <div className="p-3 border-t border-[#965B43] bg-[#965B43]/40 space-y-2 shrink-0">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold text-[#FDF6EC] hover:bg-[#965B43] transition-colors min-h-[44px]"
          title="Voltar ao App da Empresa"
        >
          <ArrowLeft className="h-4 w-4 text-[#FDF6EC] shrink-0" />
          {!collapsed && <span>Voltar ao App da Empresa</span>}
        </Link>

        <button
          onClick={() => logoutAction()}
          className={cn(
            'w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-bold text-[#FDF6EC] bg-[#874E37] hover:bg-[#78432E] transition-all border border-[#965B43] cursor-pointer min-h-[44px]',
            collapsed ? 'justify-center px-2' : ''
          )}
          title="Sair / Encerrar Sessão"
        >
          <LogOut className="h-4 w-4 text-[#FDF6EC] shrink-0" />
          {!collapsed && <span>Sair / Encerrar Sessão</span>}
        </button>

        {!collapsed && (
          <div className="flex items-center gap-2 px-1 text-xs text-[#FBE1CF]">
            <ShieldCheck className="h-4 w-4 text-[#FDF6EC] shrink-0" />
            <span className="font-semibold text-xs leading-tight">Desenvolvida por Flavio Santiago Consultor IA</span>
          </div>
        )}
      </div>
    </aside>
  );
}
