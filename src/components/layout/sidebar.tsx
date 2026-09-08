'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Receipt,
  Users,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Briefcase,
  Building2,
  ClipboardList,
  Calendar,
  UserCheck,
  History,
  Crown,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const navItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Agenda', href: '/dashboard/agenda', icon: Calendar },
  { title: 'Ordens de Serviço', href: '/dashboard/work-orders', icon: ClipboardList },
  { title: 'Faturas & Cobranças', href: '/dashboard/invoices', icon: Receipt, badge: '4' },
  { title: 'Catálogo de Serviços', href: '/dashboard/services', icon: Briefcase },
  { title: 'Clientes CRM', href: '/dashboard/clients', icon: Users },
  { title: 'WhatsApp (Evolution)', href: '/dashboard/whatsapp', icon: MessageSquare },
  { title: 'Equipe & Permissões', href: '/dashboard/team', icon: UserCheck },
  { title: 'Auditoria de Ações', href: '/dashboard/audit', icon: History },
  { title: 'Planos & Assinatura', href: '/dashboard/subscription', icon: Crown },
  { title: 'Perfil Empresarial', href: '/dashboard/profile', icon: Building2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <aside
      className={cn(
        'relative flex flex-col border-r border-[#DECDBB] bg-[#EDE0D0] text-[#2B2B2B] transition-all duration-300 min-h-screen z-20',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-[#DECDBB]">
        <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 border border-[#D8C4AF] p-1 shadow-warm-xs overflow-hidden">
            <img src="/logo.png" alt="ServiceZap Logo" className="h-full w-full object-contain rounded-lg" />
          </div>
          {!collapsed && (
            <span className="font-extrabold text-lg tracking-tight text-[#2B2B2B]">
              ServiceZap
            </span>
          )}
        </Link>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg bg-[#DFD1BF] hover:bg-[#D5C5B1] text-[#4A4A4A] hover:text-[#2B2B2B] transition-colors"
          title={collapsed ? 'Expandir' : 'Recolher'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 group',
                isActive
                  ? 'bg-gradient-to-r from-[#F0806B] to-[#E8622C] text-white font-bold shadow-warm-xs'
                  : 'text-[#4A4A4A] hover:bg-[#DFD1BF] hover:text-[#2B2B2B]'
              )}
              title={collapsed ? item.title : undefined}
            >
              <Icon
                className={cn(
                  'h-4.5 w-4.5 shrink-0 transition-transform duration-200 group-hover:scale-105',
                  isActive ? 'text-white' : 'text-[#5A5A5A] group-hover:text-[#2B2B2B]'
                )}
              />
              {!collapsed && <span className="truncate">{item.title}</span>}
              {!collapsed && item.badge && (
                <span
                  className={cn(
                    'ml-auto rounded-full px-2 py-0.5 text-xs font-semibold',
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-[#DCCBB7] text-[#2B2B2B]'
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Super Admin Direct Link & Footer */}
      <div className="p-3 border-t border-[#DECDBB] bg-[#E5D7C5]/70 space-y-2">
        <Link
          href="/super-admin"
          className={cn(
            'flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold border border-[#E8622C]/30 bg-gradient-to-r from-[#FFF5F2] to-[#FFEBE4] text-[#E8622C] hover:bg-[#FFE0D6] transition-all duration-200 shadow-warm-xs group',
            collapsed ? 'justify-center px-2' : ''
          )}
          title="Acesso Master Super Admin"
        >
          <Sparkles className="h-4 w-4 text-[#E8622C] shrink-0 group-hover:rotate-12 transition-transform" />
          {!collapsed && (
            <div className="flex flex-col">
              <span>Super Admin Master</span>
              <span className="text-[10px] font-normal text-[#8A503C]">Gestão Multi-Empresas</span>
            </div>
          )}
        </Link>

        {!collapsed && (
          <div className="flex items-center gap-2 px-1 text-[11px] text-[#6A6A6A]">
            <ShieldCheck className="h-3.5 w-3.5 text-[#10B981] shrink-0" />
            <span className="font-medium">Multi-tenant Ativo & Seguro</span>
          </div>
        )}
      </div>
    </aside>
  );
}
