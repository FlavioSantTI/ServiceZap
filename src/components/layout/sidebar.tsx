'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Receipt,
  Users,
  MessageSquare,
  Settings,
  Zap,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Briefcase,
  Building2,
  ClipboardList,
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
  { title: 'Ordens de Serviço', href: '/dashboard/work-orders', icon: ClipboardList },
  { title: 'Faturas & Cobranças', href: '/dashboard/invoices', icon: Receipt, badge: '4' },
  { title: 'Catálogo de Serviços', href: '/dashboard/services', icon: Briefcase },
  { title: 'Clientes', href: '/dashboard/clients', icon: Users },
  { title: 'WhatsApp (Evolution)', href: '/dashboard/whatsapp', icon: MessageSquare },
  { title: 'Perfil da Empresa', href: '/dashboard/profile', icon: Building2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <aside
      className={cn(
        'relative flex flex-col border-r bg-slate-900 text-slate-100 transition-all duration-300 min-h-screen z-20',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800">
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
            <Zap className="h-5 w-5 fill-current" />
          </div>
          {!collapsed && (
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              ServiceZap
            </span>
          )}
        </Link>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          title={collapsed ? 'Expandir' : 'Recolher'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group',
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20 shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
              )}
              title={collapsed ? item.title : undefined}
            >
              <Icon
                className={cn(
                  'h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110',
                  isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'
                )}
              />
              {!collapsed && <span className="truncate">{item.title}</span>}
              {!collapsed && item.badge && (
                <span className="ml-auto rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      {!collapsed && (
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldAlert className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Appwrite DB + Asaas Connected</span>
          </div>
        </div>
      )}
    </aside>
  );
}
