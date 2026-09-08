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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-[#2B2B2B] via-[#38322E] to-[#2B2B2B] p-6 text-white shadow-warm-md border border-[#443C37]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-6 items-center px-2 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-[#E8622C] text-white">
              Super Admin Master
            </span>
            <span className="text-xs text-[#DECDBB]">Visão Consolidada Multi-Tenant</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Painel Geral do SaaS ServiceZap
          </h1>
          <p className="text-sm text-[#C8B8A6]">
            Gerencie todas as empresas clientes, administre planos contratados e acompanhe a receita recorrente.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="border-[#5C5046] text-[#DECDBB] hover:text-white hover:bg-[#3E342D]"
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-gradient-to-r from-[#F0806B] to-[#E8622C] text-white font-bold hover:brightness-105 shadow-warm-sm"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Nova Empresa
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MRR */}
        <div className="rounded-2xl border border-[#DECDBB] bg-white p-5 shadow-warm-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8A503C] uppercase tracking-wider">MRR Recorrente</span>
            <div className="h-9 w-9 rounded-xl bg-[#FFF3EE] flex items-center justify-center text-[#E8622C]">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#2B2B2B]">
            R$ {metrics.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-xs font-normal text-[#777777]"> /mês</span>
          </div>
          <p className="text-xs text-[#777777]">Soma de assinaturas ativas</p>
        </div>

        {/* Empresas Ativas */}
        <div className="rounded-2xl border border-[#DECDBB] bg-white p-5 shadow-warm-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8A503C] uppercase tracking-wider">Empresas Cadastradas</span>
            <div className="h-9 w-9 rounded-xl bg-[#EBF6EE] flex items-center justify-center text-[#10B981]">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#2B2B2B]">
            {metrics.activeTenants} <span className="text-sm font-medium text-[#777777]">/ {metrics.totalTenants} ativas</span>
          </div>
          <p className="text-xs text-[#777777]">Tenants em operação no sistema</p>
        </div>

        {/* Total Usuários Alocados */}
        <div className="rounded-2xl border border-[#DECDBB] bg-white p-5 shadow-warm-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8A503C] uppercase tracking-wider">Capacidade de Equipes</span>
            <div className="h-9 w-9 rounded-xl bg-[#F0EEFC] flex items-center justify-center text-[#6366F1]">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#2B2B2B]">
            {metrics.totalUsersLimit} <span className="text-xs font-normal text-[#777777]">assentos</span>
          </div>
          <p className="text-xs text-[#777777]">Soma dos limites contratados</p>
        </div>

        {/* Planos Contratados */}
        <div className="rounded-2xl border border-[#DECDBB] bg-white p-5 shadow-warm-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8A503C] uppercase tracking-wider">Distribuição de Planos</span>
            <div className="h-9 w-9 rounded-xl bg-[#FFF9E6] flex items-center justify-center text-[#F59E0B]">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#444444]">
            <span className="bg-[#EBF6EE] text-[#10B981] px-1.5 py-0.5 rounded">Pro: {metrics.planDistribution.pro || 0}</span>
            <span className="bg-[#FFF3EE] text-[#E8622C] px-1.5 py-0.5 rounded">Starter: {metrics.planDistribution.starter || 0}</span>
            <span className="bg-[#F0EEFC] text-[#6366F1] px-1.5 py-0.5 rounded">Ent: {metrics.planDistribution.enterprise || 0}</span>
          </div>
          <p className="text-xs text-[#777777]">Free / Trial: {metrics.planDistribution.free || 0}</p>
        </div>
      </div>

      {/* Empresas Recentes Table Preview */}
      <div className="rounded-2xl border border-[#DECDBB] bg-white p-5 shadow-warm-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#2B2B2B]">Empresas Clientes Recentes</h3>
            <p className="text-xs text-[#666666]">Listagem de organizações ativas na plataforma</p>
          </div>
          <Link href="/super-admin/tenants">
            <Button variant="outline" size="sm" className="border-[#DECDBB] text-[#E8622C] hover:bg-[#FFF3EE]">
              Ver Todas as Empresas <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#DECDBB] text-xs font-bold text-[#8A503C] uppercase">
              <tr>
                <th className="py-3 px-3">Empresa / Documento</th>
                <th className="py-3 px-3">Admin Responsável</th>
                <th className="py-3 px-3">Plano Contratado</th>
                <th className="py-3 px-3">Limite Usuários</th>
                <th className="py-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2E8DE]">
              {tenants.slice(0, 5).map((tenant) => (
                <tr key={tenant.$id} className="hover:bg-[#FAF6F2] transition-colors">
                  <td className="py-3.5 px-3">
                    <div className="font-bold text-[#2B2B2B]">{tenant.name}</div>
                    <div className="text-xs text-[#777777] font-mono">{tenant.document}</div>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="font-medium text-[#444444]">{tenant.ownerName || 'Não informado'}</div>
                    <div className="text-xs text-[#777777]">{tenant.ownerEmail || tenant.email}</div>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-[#FFF3EE] text-[#E8622C] border border-[#F0806B]/20">
                      {tenant.plan || 'Free'}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 font-semibold text-[#444444]">
                    {tenant.maxUsers || 1} colaborador{(tenant.maxUsers || 1) > 1 ? 'es' : ''}
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EBF6EE] text-[#10B981]">
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
