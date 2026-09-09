'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Bell,
  Plus,
  Building2,
  User,
  LogOut,
  ChevronDown,
  Sparkles,
  Check,
  Shield,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { mockTenant } from '@/lib/mock-data';
import { fetchTenantProfileAction } from '@/app/actions/tenant';
import { getCurrentUserAction, switchTenantAction, logoutAction, CurrentUserSession } from '@/app/actions/auth';
import { TenantDocument } from '@/types/appwrite';

interface HeaderProps {
  onNewInvoiceClick?: () => void;
}

export function Header({ onNewInvoiceClick }: HeaderProps) {
  const router = useRouter();
  const [tenant, setTenant] = useState<Partial<TenantDocument>>(mockTenant);
  const [user, setUser] = useState<CurrentUserSession | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);

  const loadHeaderData = async () => {
    try {
      const [currentUser, tenantData] = await Promise.all([
        getCurrentUserAction(),
        fetchTenantProfileAction(),
      ]);
      if (currentUser) setUser(currentUser);
      if (tenantData && tenantData.name) setTenant(tenantData);
    } catch (err) {
      console.error('Erro ao carregar dados do Header:', err);
    }
  };

  useEffect(() => {
    loadHeaderData();
  }, []);

  const handleSwitchTenant = async (tenantId: string) => {
    try {
      setIsSwitching(true);
      await switchTenantAction(tenantId);
      window.location.reload();
    } catch (err) {
      console.error('Erro ao alternar tenant:', err);
      setIsSwitching(false);
    }
  };

  const handleLogout = async () => {
    await logoutAction();
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/80 px-4 sm:px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
      {/* Tenant Indicator & Search */}
      <div className="flex items-center gap-3 sm:gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex items-center gap-2 rounded-2xl bg-orange-50/80 hover:bg-orange-100/80 px-3 py-1.5 dark:bg-neutral-900 dark:hover:bg-neutral-800/80 border border-orange-200/60 dark:border-neutral-800 transition-all text-left outline-none cursor-pointer"
            title="Clique para alternar Empresa (Multi-Tenant)"
          >
            <Building2 className="h-4 w-4 text-[#E8622C] shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[#2B2B2B] dark:text-neutral-200 max-w-[140px] sm:max-w-[200px] truncate">
                {user?.tenantName || tenant.name || 'Empresa Alpha'}
              </span>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                {user?.tenantId || 'tenant_01'}
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-zinc-400 ml-1" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 rounded-2xl p-2 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-xl">
            <DropdownMenuLabel className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider px-2 py-1">
              Alternar Empresa (Multi-Tenant)
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => handleSwitchTenant('tenant_01')}
              className="flex items-center justify-between p-2 rounded-xl cursor-pointer hover:bg-orange-50 dark:hover:bg-zinc-800"
            >
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-orange-500/20 flex items-center justify-center text-[#E8622C] font-bold text-xs">
                  A
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Empresa Alpha</div>
                  <div className="text-[10px] text-zinc-500 font-mono">tenant_01 • WhatsApp 1</div>
                </div>
              </div>
              {user?.tenantId === 'tenant_01' && <Check className="h-4 w-4 text-[#E8622C]" />}
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => handleSwitchTenant('tenant_02')}
              className="flex items-center justify-between p-2 rounded-xl cursor-pointer hover:bg-indigo-50 dark:hover:bg-zinc-800"
            >
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                  B
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Empresa Beta</div>
                  <div className="text-[10px] text-zinc-500 font-mono">tenant_02 • WhatsApp 2</div>
                </div>
              </div>
              {user?.tenantId === 'tenant_02' && <Check className="h-4 w-4 text-indigo-600" />}
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1 bg-zinc-100 dark:bg-zinc-800" />

            <DropdownMenuItem
              onClick={() => handleSwitchTenant('tenant_master')}
              className="flex items-center justify-between p-2 rounded-xl cursor-pointer hover:bg-purple-50 dark:hover:bg-zinc-800"
            >
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-xs">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Super Admin</div>
                  <div className="text-[10px] text-zinc-500 font-mono">tenant_master • Acesso Total</div>
                </div>
              </div>
              {user?.tenantId === 'tenant_master' && <Check className="h-4 w-4 text-purple-600" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="relative hidden md:block w-64 lg:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            type="search"
            placeholder="Buscar por cliente, documento ou fatura..."
            className="pl-9 h-9 text-xs rounded-xl bg-white/70 border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800"
          />
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Button
          onClick={onNewInvoiceClick}
          size="sm"
          className="h-9 gap-2 bg-gradient-to-r from-[#F0806B] to-[#E8622C] hover:opacity-95 text-white font-bold shadow-md shadow-orange-500/20 rounded-xl transition-all text-xs"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nova Cobrança</span>
        </Button>

        <button className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white text-neutral-600 hover:bg-orange-50 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-800 transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#E8622C] ring-2 ring-white dark:ring-neutral-950" />
        </button>

        {/* User Profile & Logout Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 p-1 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors outline-none cursor-pointer">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#2B2B2B] to-[#3D3D3D] text-white font-bold text-xs ring-2 ring-orange-200/50 dark:ring-neutral-800">
              <User className="h-4 w-4" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-xl">
            <DropdownMenuLabel className="px-2 py-1.5">
              <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{user?.name || 'Usuário'}</div>
              <div className="text-[11px] text-zinc-500 truncate">{user?.email || 'usuario@servicezap.com'}</div>
              <div className="mt-1">
                <Badge className="text-[9px] px-1.5 py-0 bg-orange-500/15 text-[#E8622C] border-none">
                  {user?.role === 'super_admin' ? 'Super Admin' : 'Gestor da Empresa'}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1 bg-zinc-100 dark:bg-zinc-800" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center gap-2 p-2 rounded-xl text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer font-semibold"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair / Encerrar Sessão</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
