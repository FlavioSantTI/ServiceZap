'use client';

import React, { useEffect, useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Shield,
  Edit2,
  Users,
  CreditCard,
  RefreshCw,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  fetchTenantsAction,
  updateTenantStatusAction,
  updateTenantPlanAction,
} from '@/app/actions/super-admin';
import { TenantDocument, TenantStatus } from '@/types/appwrite';
import { TenantDialog } from '@/components/super-admin/tenant-dialog';

export default function SuperAdminTenantsPage() {
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<TenantDocument[]>([]);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await fetchTenantsAction();
      setTenants(list);
    } catch (e) {
      console.error('Erro ao buscar tenants:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (tenantId: string, newStatus: TenantStatus) => {
    try {
      await updateTenantStatusAction(tenantId, newStatus);
      await loadData();
    } catch (e) {
      console.error('Erro ao atualizar status:', e);
    }
  };

  const handlePlanChange = async (
    tenantId: string,
    newPlan: 'free' | 'starter' | 'pro' | 'enterprise',
    maxUsers?: number
  ) => {
    try {
      await updateTenantPlanAction(tenantId, newPlan, maxUsers);
      await loadData();
    } catch (e) {
      console.error('Erro ao atualizar plano:', e);
    }
  };

  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch =
      tenant.name.toLowerCase().includes(search.toLowerCase()) ||
      tenant.document.toLowerCase().includes(search.toLowerCase()) ||
      (tenant.ownerEmail && tenant.ownerEmail.toLowerCase().includes(search.toLowerCase())) ||
      (tenant.ownerName && tenant.ownerName.toLowerCase().includes(search.toLowerCase()));

    const matchesPlan = planFilter === 'all' || tenant.plan === planFilter;
    const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;

    return matchesSearch && matchesPlan && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#2B2B2B] flex items-center gap-2">
            <Building2 className="h-6 w-6 text-[#E8622C]" />
            Empresas & Tenants Cadastrados
          </h1>
          <p className="text-sm text-[#666666]">
            Gerencie o ciclo de vida, permissões e upgrades das empresas clientes do ServiceZap.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="border-[#DECDBB] text-[#666666] hover:bg-[#FFF3EE]"
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-gradient-to-r from-[#F0806B] to-[#E8622C] text-white font-bold hover:brightness-105 shadow-warm-sm"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Cadastrar Empresa
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3 rounded-2xl border border-[#DECDBB] bg-white p-4 shadow-warm-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#888888]" />
          <Input
            placeholder="Buscar por nome da empresa, CNPJ/CPF ou e-mail do admin..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-[#FAF6F2] border-[#DECDBB]"
          />
        </div>

        <div className="flex gap-2">
          <Select value={planFilter} onValueChange={(val: string | null) => setPlanFilter(val || 'all')}>
            <SelectTrigger className="w-[150px] bg-[#FAF6F2] border-[#DECDBB]">
              <SelectValue placeholder="Plano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Planos</SelectItem>
              <SelectItem value="free">Grátis / Teste</SelectItem>
              <SelectItem value="starter">Starter</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(val: string | null) => setStatusFilter(val || 'all')}>
            <SelectTrigger className="w-[150px] bg-[#FAF6F2] border-[#DECDBB]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="trialing">Trial / Teste</SelectItem>
              <SelectItem value="suspended">Suspenso</SelectItem>
              <SelectItem value="canceled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="rounded-2xl border border-[#DECDBB] bg-white shadow-warm-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#DECDBB] bg-[#FAF6F2] text-xs font-bold text-[#8A503C] uppercase">
              <tr>
                <th className="py-3.5 px-4">Empresa / CNPJ</th>
                <th className="py-3.5 px-4">Admin Responsável</th>
                <th className="py-3.5 px-4">Plano Atual</th>
                <th className="py-3.5 px-4">Limite Equipe</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2E8DE]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-sm text-[#777777]">
                    Carregando empresas...
                  </td>
                </tr>
              ) : filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-sm text-[#777777]">
                    Nenhuma empresa encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredTenants.map((tenant) => (
                  <tr key={tenant.$id} className="hover:bg-[#FAF6F2] transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-bold text-[#2B2B2B]">{tenant.name}</div>
                      <div className="text-xs text-[#777777] font-mono">{tenant.document}</div>
                      {tenant.phone && <div className="text-xs text-[#888888]">{tenant.phone}</div>}
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-semibold text-[#333333]">{tenant.ownerName || 'Admin Principal'}</div>
                      <div className="text-xs text-[#666666]">{tenant.ownerEmail || tenant.email}</div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black uppercase bg-[#FFF3EE] text-[#E8622C] border border-[#F0806B]/20 shadow-xs">
                        {tenant.plan || 'Free'}
                      </span>
                    </td>

                    <td className="py-4 px-4 font-semibold text-[#444444]">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-[#8A503C]" />
                        <span>{tenant.maxUsers || 1} colaborador{(tenant.maxUsers || 1) > 1 ? 'es' : ''}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      {tenant.status === 'active' || tenant.status === 'trialing' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#EBF6EE] text-[#10B981]">
                          <CheckCircle2 className="h-3 w-3" />
                          Ativo
                        </span>
                      ) : tenant.status === 'suspended' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FFF9E6] text-[#D97706]">
                          <AlertTriangle className="h-3 w-3" />
                          Suspenso
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FEE2E2] text-[#DC2626]">
                          <XCircle className="h-3 w-3" />
                          Cancelado
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-[#FAF6F2] text-[#666666] hover:text-[#2B2B2B] transition-colors">
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-white border-[#DECDBB]">
                          <DropdownMenuLabel className="text-xs text-[#888888]">Alterar Plano</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handlePlanChange(tenant.$id, 'starter', 2)}>
                            Mudar para Starter (2 users)
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePlanChange(tenant.$id, 'pro', 5)}>
                            Mudar para Pro (5 users)
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePlanChange(tenant.$id, 'enterprise', 15)}>
                            Mudar para Enterprise (15 users)
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-[#DECDBB]" />
                          <DropdownMenuLabel className="text-xs text-[#888888]">Status do Tenant</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(tenant.$id, 'active')}
                            className="text-[#10B981]"
                          >
                            Ativar Empresa
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(tenant.$id, 'suspended')}
                            className="text-[#D97706]"
                          >
                            Suspender Acesso
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(tenant.$id, 'canceled')}
                            className="text-[#DC2626]"
                          >
                            Cancelar Empresa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
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
