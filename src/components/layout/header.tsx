'use client';

import React, { useState, useEffect } from 'react';
import { Search, Bell, Plus, Building2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { mockTenant } from '@/lib/mock-data';
import { fetchTenantProfileAction } from '@/app/actions/tenant';
import { TenantDocument } from '@/types/appwrite';

interface HeaderProps {
  onNewInvoiceClick?: () => void;
}

export function Header({ onNewInvoiceClick }: HeaderProps) {
  const [tenant, setTenant] = useState<Partial<TenantDocument>>(mockTenant);

  useEffect(() => {
    async function loadTenantHeader() {
      try {
        const data = await fetchTenantProfileAction();
        if (data && data.name) {
          setTenant(data);
        }
      } catch (err) {
        console.error('Erro ao carregar tenant no Header:', err);
      }
    }

    loadTenantHeader();
  }, []);

  return (
    <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
      {/* Tenant Indicator & Search */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-xl bg-orange-50/70 px-3 py-1.5 dark:bg-neutral-900 border border-orange-200/60 dark:border-neutral-800">
          <Building2 className="h-4 w-4 text-[#E8622C]" />
          <span className="text-xs font-semibold text-[#2B2B2B] dark:text-neutral-200">
            {tenant.name || mockTenant.name}
          </span>
          <Badge variant="outline" className="text-[10px] uppercase font-bold text-[#E8622C] border-orange-300 dark:border-orange-500/30 bg-white/80 dark:bg-neutral-800">
            {tenant.plan || 'PRO'}
          </Badge>
        </div>

        <div className="relative hidden sm:block w-64 md:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            type="search"
            placeholder="Buscar por cliente, documento ou fatura..."
            className="pl-9 h-9 text-xs rounded-xl bg-white/70 border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800"
          />
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-3">
        <Button
          onClick={onNewInvoiceClick}
          size="sm"
          className="h-9 gap-2 bg-gradient-to-r from-[#F0806B] to-[#E8622C] hover:opacity-95 text-white font-bold shadow-md shadow-orange-500/20 rounded-xl transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Nova Cobrança</span>
        </Button>

        <button className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white text-neutral-600 hover:bg-orange-50 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-800 transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#E8622C] ring-2 ring-white dark:ring-neutral-950" />
        </button>

        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#2B2B2B] to-[#3D3D3D] text-white font-bold text-xs ring-2 ring-orange-200/50 dark:ring-neutral-800">
          <User className="h-4 w-4" />
        </div>
      </div>
    </header>
  );
}
