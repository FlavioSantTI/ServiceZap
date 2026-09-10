'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Building2,
  Users,
  CreditCard,
  ShieldCheck,
  Plus,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fetchTenantsAction, getSuperAdminMetricsAction } from '@/app/actions/super-admin';
import { TenantDocument } from '@/types/appwrite';
import { TenantDialog } from '@/components/super-admin/tenant-dialog';
import { CampaignLeadsCard } from '@/components/super-admin/campaign-leads-card';

export default function SuperAdminOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<TenantDocument[]>([]);
  const [metrics, setMetrics] = useState<{
    totalTenants: number;
    activeTenants: number;
    mrr: number;
    totalUsersLimit: number;
    planDistribution: Record<string, number>;
  }>({
    totalTenants: 0,
    activeTenants: 0,
    mrr: 0,
    totalUsersLimit: 0,
    planDistribution: {
      free: 0,
      starter: 0,
      pro: 0,
      enterprise: 0,
    },
  });
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tenantsList, metricsData] = await Promise.all([
        fetchTenantsAction(),
        getSuperAdminMetricsAction(),
      ]);
      setTenants(tenantsList);
      setMetrics(metricsData);
    } catch (e) {
      console.error('Erro ao carregar dados do Super Admin:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl bg-card p-6 text-foreground shadow-warm-xs border border-border">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="flex h-6 items-center px-2.5 text-xs font-extrabold uppercase tracking-wider rounded-lg bg-primary text-primary-foreground shadow-warm-xs">
              Super Admin Master
            </span>
            <span className="text-xs text-muted-foreground font-medium">Visão Consolidada Multi-Tenant</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Painel Geral do SaaS ServiceZap
          </h1>
          <p className="text-xs text-muted-foreground">
            Gerencie todas as empresas clientes, administre planos contratados e acompanhe a receita recorrente.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="border-border text-foreground hover:bg-muted rounded-xl font-semibold cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-warm-xs rounded-xl cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Nova Empresa
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MRR */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-warm-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">MRR Recorrente</span>
            <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary border border-primary/25 flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground">
            R$ {metrics.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-xs font-normal text-muted-foreground"> /mês</span>
          </div>
          <p className="text-xs text-muted-foreground">Soma de assinaturas ativas</p>
        </div>

        {/* Empresas Ativas */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-warm-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Empresas Cadastradas</span>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/15 text-emerald-700 border border-emerald-500/25 flex items-center justify-center">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground">
            {metrics.activeTenants} <span className="text-sm font-medium text-muted-foreground">/ {metrics.totalTenants} ativas</span>
          </div>
          <p className="text-xs text-muted-foreground">Tenants em operação no sistema</p>
        </div>

        {/* Total Usuários Alocados */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-warm-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Capacidade de Equipes</span>
            <div className="h-10 w-10 rounded-xl bg-indigo-500/15 text-indigo-700 border border-indigo-500/25 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground">
            {metrics.totalUsersLimit} <span className="text-xs font-normal text-muted-foreground">assentos</span>
          </div>
          <p className="text-xs text-muted-foreground">Soma dos limites contratados</p>
        </div>

        {/* Planos Contratados */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-warm-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Distribuição de Planos</span>
            <div className="h-10 w-10 rounded-xl bg-amber-500/15 text-amber-700 border border-amber-500/25 flex items-center justify-center">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="bg-emerald-500/15 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-500/20">Pro: {metrics.planDistribution.pro || 0}</span>
            <span className="bg-primary/15 text-primary px-1.5 py-0.5 rounded border border-primary/20">Starter: {metrics.planDistribution.starter || 0}</span>
            <span className="bg-indigo-500/15 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-500/20">Ent: {metrics.planDistribution.enterprise || 0}</span>
          </div>
          <p className="text-xs text-muted-foreground">Free / Trial: {metrics.planDistribution.free || 0}</p>
        </div>
      </div>

      {/* Campaign Leads Captured */}
      <CampaignLeadsCard />

      {/* Empresas Recentes Table Preview */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-warm-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground">Empresas Clientes Recentes</h3>
            <p className="text-xs text-muted-foreground">Listagem de organizações ativas na plataforma</p>
          </div>
          <Link href="/super-admin/tenants">
            <Button variant="outline" size="sm" className="border-border text-primary hover:bg-primary/10 rounded-xl font-bold">
              Ver Todas as Empresas <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs font-bold text-muted-foreground uppercase bg-muted/30">
              <tr>
                <th className="py-3 px-3">Empresa / Documento</th>
                <th className="py-3 px-3">Admin Responsável</th>
                <th className="py-3 px-3">Plano Contratado</th>
                <th className="py-3 px-3">Limite Usuários</th>
                <th className="py-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tenants.slice(0, 5).map((tenant) => (
                <tr key={tenant.$id} className="hover:bg-muted/40 transition-colors">
                  <td className="py-3.5 px-3">
                    <div className="font-bold text-foreground">{tenant.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{tenant.document}</div>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="font-medium text-foreground">{tenant.ownerName || 'Não informado'}</div>
                    <div className="text-xs text-muted-foreground">{tenant.ownerEmail || tenant.email}</div>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-primary/15 text-primary border border-primary/20">
                      {tenant.plan || 'Free'}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 font-semibold text-foreground">
                    {tenant.maxUsers || 1} colaborador{(tenant.maxUsers || 1) > 1 ? 'es' : ''}
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 border border-emerald-500/20">
                      <CheckCircle2 className="h-3 w-3" />
                      Ativa
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <TenantDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={loadData}
      />
    </div>
  );
}
