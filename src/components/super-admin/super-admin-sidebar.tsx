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
        'relative flex flex-col border-r border-[#2C2C2C] bg-[#1E1E1E] text-[#E0E0E0] transition-all duration-300 min-h-screen z-20',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-[#2C2C2C]">
        <Link href="/super-admin" className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#F0806B] to-[#E8622C] p-2 shadow-warm-xs">
            <Shield className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                ServiceZap <span className="text-[10px] bg-[#E8622C] text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold">Master</span>
              </span>
              <span className="text-[11px] text-[#A0A0A0]">Super Admin Panel</span>
            </div>
          )}
        </Link>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg bg-[#2C2C2C] hover:bg-[#3C3C3C] text-[#A0A0A0] hover:text-white transition-colors"
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
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group',
                isActive
                  ? 'bg-gradient-to-r from-[#F0806B] to-[#E8622C] text-white font-bold shadow-warm-xs'
                  : 'text-[#B0B0B0] hover:bg-[#2C2C2C] hover:text-white'
              )}
              title={collapsed ? item.title : undefined}
            >
              <Icon
                className={cn(
                  'h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-105',
                  isActive ? 'text-white' : 'text-[#888888] group-hover:text-white'
                )}
              />
              {!collapsed && <span className="truncate">{item.title}</span>}
              {!collapsed && item.badge && (
                <span
                  className={cn(
                    'ml-auto rounded-full px-2 py-0.5 text-xs font-semibold',
                    isActive ? 'bg-white/20 text-white' : 'bg-[#333333] text-[#CCCCCC]'
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Return to Tenant App / Footer */}
      <div className="p-3 border-t border-[#2C2C2C] bg-[#181818] space-y-2">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-[#C0C0C0] hover:text-white hover:bg-[#2C2C2C] transition-colors"
          title="Voltar ao App da Empresa"
        >
          <ArrowLeft className="h-4 w-4 text-[#F0806B] shrink-0" />
          {!collapsed && <span>Voltar ao App da Empresa</span>}
        </Link>

        {!collapsed && (
          <div className="flex items-center gap-2 px-3 pt-1 text-[11px] text-[#777777]">
            <ShieldCheck className="h-3.5 w-3.5 text-[#10B981] shrink-0" />
            <span>Root Admin Mode</span>
          </div>
        )}
      </div>
    </aside>
  );
}
