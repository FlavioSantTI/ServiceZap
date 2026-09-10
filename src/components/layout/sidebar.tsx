'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Zap,
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
import { getCurrentUserAction, logoutAction, CurrentUserSession } from '@/app/actions/auth';
import { LogOut } from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  requiredRole?: string[];
  requiredPermission?: string;
}

const navItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Agenda', href: '/dashboard/agenda', icon: Calendar, requiredPermission: 'canManageAppointments' },
  { title: 'Ordens de Serviço', href: '/dashboard/work-orders', icon: ClipboardList, requiredPermission: 'canManageWorkOrders' },
  { title: 'Faturas & Cobranças', href: '/dashboard/invoices', icon: Receipt, badge: '4', requiredPermission: 'canManageInvoices' },
  { title: 'Catálogo de Serviços', href: '/dashboard/services', icon: Briefcase, requiredPermission: 'canManageServices' },
  { title: 'Clientes CRM', href: '/dashboard/clients', icon: Users, requiredPermission: 'canManageClients' },
  { title: 'WhatsApp (Evolution)', href: '/dashboard/whatsapp', icon: MessageSquare, requiredPermission: 'canManageWhatsApp' },
  { title: 'Equipe & Permissões', href: '/dashboard/team', icon: UserCheck, requiredPermission: 'canManageTeam' },
  { title: 'Auditoria de Ações', href: '/dashboard/audit', icon: History, requiredRole: ['owner', 'admin', 'super_admin'] },
  { title: 'Planos & Assinatura', href: '/dashboard/subscription', icon: Crown, requiredRole: ['owner', 'admin', 'super_admin'] },
  { title: 'Perfil Empresarial', href: '/dashboard/profile', icon: Building2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUserSession | null>(null);

  useEffect(() => {
    getCurrentUserAction().then(setCurrentUser);
  }, []);

  // Filtragem dinâmica de itens do menu baseada no perfil e permissões do usuário
  const filteredNavItems = navItems.filter((item) => {
    if (!currentUser) return true; // Mostra tudo enquanto carrega

    const { role, permissions } = currentUser;

    // Super Admin tem acesso total
    if (role === 'super_admin') return true;

    // Se exige role específica
    if (item.requiredRole && !item.requiredRole.includes(role)) {
      return false;
    }

    // Se exige permissão granular específica
    if (item.requiredPermission && permissions) {
      if (permissions[item.requiredPermission] === false) {
        return false;
      }
    }

    // Restrições de Operador e Visualizador
    if (role === 'operator' || role === 'viewer') {
      if (item.href === '/dashboard/invoices' || item.href === '/dashboard/team' || item.href === '/dashboard/subscription') {
        return false;
      }
    }

    return true;
  });

  const isSuperAdmin = currentUser?.role === 'super_admin';

  return (
    <aside
      className={cn(
        'sticky top-0 h-screen flex flex-col border-r border-[#965B43] bg-[#AA6C52] text-[#FBE1CF] transition-all duration-300 z-20 shrink-0',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-[#965B43]">
        <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FDF6EC] text-[#AA6C52] shadow-warm-xs">
            <Zap className="h-5 w-5 fill-[#AA6C52] text-[#AA6C52]" />
          </div>
          {!collapsed && (
            <span className="font-extrabold text-lg tracking-tight text-[#FDF6EC]">
              Service<span className="text-[#FDF6EC]/90 font-black">Zap</span>
            </span>
          )}
        </Link>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg bg-[#965B43] hover:bg-[#874E37] text-[#FBE1CF] hover:text-[#FDF6EC] transition-colors"
          title={collapsed ? 'Expandir' : 'Recolher'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {filteredNavItems.map((item) => {
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
                'flex items-center gap-3 rounded-xl px-3 py-2.5 min-h-[44px] text-sm font-medium transition-all duration-200 group',
                isActive
                  ? 'bg-[#FDF6EC] text-[#3A2A1D] font-bold shadow-warm-xs'
                  : 'text-[#FBE1CF] hover:bg-[#965B43] hover:text-[#FDF6EC]'
              )}
              title={collapsed ? item.title : undefined}
            >
              <Icon
                className={cn(
                  'h-4.5 w-4.5 shrink-0 transition-transform duration-200 group-hover:scale-105',
                  isActive ? 'text-[#3A2A1D]' : 'text-[#FBE1CF] group-hover:text-[#FDF6EC]'
                )}
              />
              {!collapsed && <span className="truncate">{item.title}</span>}
              {!collapsed && item.badge && (
                <span
                  className={cn(
                    'ml-auto rounded-full px-2 py-0.5 text-xs font-semibold',
                    isActive
                      ? 'bg-[#AA6C52] text-[#FDF6EC]'
                      : 'bg-[#965B43] text-[#FDF6EC]'
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info & Logout Button */}
      <div className="p-3 border-t border-[#965B43] bg-[#965B43]/40 space-y-2 shrink-0">
        {isSuperAdmin && (
          <Link
            href="/super-admin"
            className={cn(
              'flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold bg-[#FDF6EC] text-[#3A2A1D] hover:bg-[#F4E8D6] transition-all duration-200 shadow-warm-xs group',
              collapsed ? 'justify-center px-2' : ''
            )}
            title="Acesso Master Super Admin"
          >
            <Sparkles className="h-4 w-4 text-[#AA6C52] shrink-0 group-hover:rotate-12 transition-transform" />
            {!collapsed && (
              <div className="flex flex-col">
                <span>Super Admin Master</span>
                <span className="text-xs font-medium text-[#7A6653]">Gestão Multi-Empresas</span>
              </div>
            )}
          </Link>
        )}

        <button
          onClick={() => logoutAction()}
          className={cn(
            'w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-bold text-[#FDF6EC] bg-[#874E37] hover:bg-[#78432E] transition-all border border-[#965B43] cursor-pointer min-h-[44px]',
            collapsed ? 'justify-center px-2' : ''
          )}
          title="Sair / Encerrar Sessão"
        >
          <LogOut className="h-4 w-4 text-[#FDF6EC] shrink-0" />
          {!collapsed && <span>Sair da Conta</span>}
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
