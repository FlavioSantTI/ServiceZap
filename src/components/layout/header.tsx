'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Bell,
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
  DropdownMenuGroup,
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
      const currentUser = await getCurrentUserAction();
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser({
          userId: 'usr_default',
          name: 'Flavio Santiago (Super Admin)',
          email: 'flavio.santiago.ti@outlook.com',
          role: 'super_admin',
          tenantId: 'tenant_master',
          tenantName: 'ServiceZap Plataforma',
        });
      }
    } catch (err) {
      console.error('Erro ao carregar usuário do Header:', err);
      setUser({
        userId: 'usr_default',
        name: 'Flavio Santiago (Super Admin)',
        email: 'flavio.santiago.ti@outlook.com',
        role: 'super_admin',
        tenantId: 'tenant_master',
        tenantName: 'ServiceZap Plataforma',
      });
    }

    try {
      const tenantData = await fetchTenantProfileAction();
      if (tenantData && tenantData.name) {
        setTenant(tenantData);
      }
    } catch (err) {
      // Silenciosamente ignora se o tenant profile não puder ser obtido no contexto Super Admin
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
    <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b border-border bg-background/95 px-4 sm:px-6 backdrop-blur-md">
      {/* Tenant Indicator & Search */}
      <div className="flex items-center gap-3 sm:gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex items-center gap-2 rounded-2xl bg-card hover:bg-muted px-3 py-2 border border-border transition-all text-left outline-none cursor-pointer min-h-[44px]"
            title="Clique para alternar Empresa (Multi-Tenant)"
          >
            <Building2 className="h-4 w-4 text-primary shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-foreground max-w-[140px] sm:max-w-[220px] truncate">
                {tenant.name || user?.tenantName || 'Empresa Alpha'}
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-1" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-72 rounded-2xl p-2.5 bg-card border border-border shadow-xl">
            <DropdownMenuLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2 py-1">
              Alternar Empresa (Multi-Tenant)
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => handleSwitchTenant('tenant_01')}
              className="flex items-center justify-between p-2.5 rounded-xl cursor-pointer hover:bg-muted"
            >
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center text-primary font-bold text-xs">
                  A
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">Alpha Climatização & Elétrica</div>
                  <div className="text-xs text-muted-foreground font-normal">Empresa Principal</div>
                </div>
              </div>
              {user?.tenantId === 'tenant_01' && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => handleSwitchTenant('tenant_02')}
              className="flex items-center justify-between p-2.5 rounded-xl cursor-pointer hover:bg-muted"
            >
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center text-primary font-bold text-xs">
                  B
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">Beta Hidráulica & Desentupidora</div>
                  <div className="text-xs text-muted-foreground font-normal">Unidade Beta</div>
                </div>
              </div>
              {user?.tenantId === 'tenant_02' && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1 bg-border" />

            <DropdownMenuItem
              onClick={() => handleSwitchTenant('tenant_master')}
              className="flex items-center justify-between p-2.5 rounded-xl cursor-pointer hover:bg-muted"
            >
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center text-primary font-bold text-xs">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">Super Admin Master</div>
                  <div className="text-xs text-muted-foreground font-normal">Painel Geral SaaS</div>
                </div>
              </div>
              {user?.tenantId === 'tenant_master' && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="relative hidden md:block w-64 lg:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar cliente, O.S. ou fatura..."
            className="pl-9 pr-14 h-10 text-xs rounded-xl bg-card border-border shadow-sm focus-visible:ring-1 focus-visible:ring-primary text-foreground"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-xs font-semibold text-muted-foreground">
            <span>⌘K</span>
          </kbd>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button 
          className="relative flex h-10 w-10 min-h-[44px] sm:min-h-[40px] items-center justify-center rounded-xl bg-card text-foreground hover:bg-muted border border-border transition-colors cursor-pointer"
          title="Notificações"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
        </button>

        {/* User Profile & Logout Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 p-1 rounded-xl hover:bg-muted transition-colors outline-none cursor-pointer min-h-[44px] sm:min-h-[40px]">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-xs ring-2 ring-border">
              <User className="h-4 w-4" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 rounded-2xl p-3 bg-card border border-border shadow-xl">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-2 py-1 space-y-1">
                <div className="text-sm font-extrabold text-foreground">{user?.name || 'Sessão Ativa'}</div>
                <div className="text-xs font-medium text-muted-foreground break-all">{user?.email || 'carregando perfil...'}</div>
                <div className="pt-1.5 flex flex-wrap gap-1.5 items-center">
                  <Badge className="text-xs px-2 py-0.5 bg-primary/15 text-primary border-none font-semibold">
                    {user?.role === 'super_admin' ? 'Super Admin Master' : user?.role === 'owner' ? 'Dono da Empresa' : 'Gestor da Empresa'}
                  </Badge>
                  {user?.tenantName && (
                    <Badge variant="outline" className="text-xs px-2 py-0.5 text-foreground border-border font-medium">
                      {user.tenantName}
                    </Badge>
                  )}
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="my-2 bg-border" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center gap-2 p-2.5 rounded-xl text-xs text-rose-600 hover:bg-rose-500/10 cursor-pointer font-bold"
            >
              <LogOut className="h-4 w-4 text-rose-600" />
              <span>Sair / Encerrar Sessão</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
