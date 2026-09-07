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
        <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-1.5 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {tenant.name || mockTenant.name}
          </span>
          <Badge variant="outline" className="text-[10px] uppercase font-bold text-emerald-600 border-emerald-500/30">
            {tenant.plan || 'PRO'}
          </Badge>
        </div>

        <div className="relative hidden sm:block w-64 md:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            placeholder="Buscar por cliente, documento ou fatura..."
            className="pl-9 h-9 text-xs rounded-xl bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800"
          />
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-3">
        <Button
          onClick={onNewInvoiceClick}
          size="sm"
          className="h-9 gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-md shadow-emerald-600/20 rounded-xl"
        >
          <Plus className="h-4 w-4" />
          <span>Nova Cobrança</span>
        </Button>

        <button className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-950" />
        </button>

        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 text-white font-bold text-xs ring-2 ring-slate-200 dark:ring-slate-800">
          <User className="h-4 w-4" />
        </div>
      </div>
    </header>
  );
}
