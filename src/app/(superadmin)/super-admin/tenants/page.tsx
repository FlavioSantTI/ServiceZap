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
  Trash2,
  Users,
  CreditCard,
  RefreshCw,
  MoreVertical,
  Power,
  Zap,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import {
  fetchTenantsAction,
  updateTenantStatusAction,
  updateTenantPlanAction,
  deleteTenantAction,
} from '@/app/actions/super-admin';
import { TenantDocument, TenantStatus } from '@/types/appwrite';
import { TenantDialog } from '@/components/super-admin/tenant-dialog';

export default function SuperAdminTenantsPage() {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [tenants, setTenants] = useState<TenantDocument[]>([]);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modais de Criação / Edição
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTenantToEdit, setSelectedTenantToEdit] = useState<TenantDocument | null>(null);

  // Modal de Confirmação de Exclusão
  const [tenantToDelete, setTenantToDelete] = useState<TenantDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleToggleStatus = async (tenant: TenantDocument) => {
    const isCurrentlyActive = tenant.status === 'active' || tenant.status === 'trialing' || tenant.status === 'trial';
    const newStatus: TenantStatus = isCurrentlyActive ? 'suspended' : 'active';
    
    setActionLoading(tenant.$id);
    try {
      await updateTenantStatusAction(tenant.$id, newStatus);
      setTenants((prev) =>
        prev.map((t) => (t.$id === tenant.$id ? { ...t, status: newStatus } : t))
      );
    } catch (e) {
      console.error('Erro ao alternar status:', e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusChange = async (tenantId: string, newStatus: TenantStatus) => {
    setActionLoading(tenantId);
    try {
      await updateTenantStatusAction(tenantId, newStatus);
      await loadData();
    } catch (e) {
      console.error('Erro ao atualizar status:', e);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePlanChange = async (
    tenantId: string,
    newPlan: 'free' | 'starter' | 'pro' | 'enterprise',
    maxUsers?: number
  ) => {
    setActionLoading(tenantId);
    try {
      await updateTenantPlanAction(tenantId, newPlan, maxUsers);
      await loadData();
    } catch (e) {
      console.error('Erro ao atualizar plano:', e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenEdit = (tenant: TenantDocument) => {
    setSelectedTenantToEdit(tenant);
    setIsDialogOpen(true);
  };

  const handleOpenCreate = () => {
    setSelectedTenantToEdit(null);
    setIsDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!tenantToDelete) return;
    setIsDeleting(true);
    try {
      await deleteTenantAction(tenantToDelete.$id);
      setTenants((prev) => prev.filter((t) => t.$id !== tenantToDelete.$id));
      setTenantToDelete(null);
    } catch (e) {
      console.error('Erro ao excluir tenant:', e);
    } finally {
      setIsDeleting(false);
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
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#2B2B2B] flex items-center gap-2">
            <Building2 className="h-6 w-6 text-[#E8622C]" />
            Empresas & Tenants Cadastrados
          </h1>
          <p className="text-sm text-[#666666]">
            CRUD completo: cadastre, edite dados, ative/desative o acesso e gerencie os planos de cada empresa.
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
            onClick={handleOpenCreate}
            className="bg-gradient-to-r from-[#F0806B] to-[#E8622C] text-white font-bold hover:brightness-105 shadow-sm"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Nova Empresa
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3 rounded-2xl border border-[#DECDBB] bg-white p-4 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#888888]" />
          <Input
            placeholder="Buscar por nome da empresa, CNPJ/CPF ou e-mail do admin..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-[#FAF6F2] border-[#DECDBB] text-xs h-10"
          />
        </div>

        <div className="flex gap-2">
          <Select value={planFilter} onValueChange={(val: string | null) => setPlanFilter(val || 'all')}>
            <SelectTrigger className="w-[160px] bg-[#FAF6F2] border-[#DECDBB] text-xs h-10">
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
            <SelectTrigger className="w-[160px] bg-[#FAF6F2] border-[#DECDBB] text-xs h-10">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="trialing">Trial / Teste</SelectItem>
              <SelectItem value="suspended">Suspenso / Desativado</SelectItem>
              <SelectItem value="canceled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="rounded-2xl border border-[#DECDBB] bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#DECDBB] bg-[#FAF6F2] text-xs font-bold text-[#8A503C] uppercase">
              <tr>
                <th className="py-3.5 px-4">Empresa / Documento</th>
                <th className="py-3.5 px-4">Admin Responsável</th>
                <th className="py-3.5 px-4">Plano</th>
                <th className="py-3.5 px-4">Limite Equipe</th>
                <th className="py-3.5 px-4 text-center">Ativar / Desativar</th>
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
                filteredTenants.map((tenant) => {
                  const isActive = tenant.status === 'active' || tenant.status === 'trialing' || tenant.status === 'trial';
                  const isSuspended = tenant.status === 'suspended';
                  const isCurrentAction = actionLoading === tenant.$id;

                  return (
                    <tr key={tenant.$id} className="hover:bg-[#FAF6F2]/60 transition-colors">
                      
                      {/* Empresa / CNPJ */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-[#2B2B2B] text-sm">{tenant.name}</div>
                        {tenant.companyName && tenant.companyName !== tenant.name && (
                          <div className="text-xs text-[#666666] line-clamp-1">{tenant.companyName}</div>
                        )}
                        <div className="text-xs text-[#888888] font-mono mt-0.5">{tenant.document}</div>
                        {tenant.phone && <div className="text-xs text-[#888888]">{tenant.phone}</div>}
                      </td>

                      {/* Admin Responsável */}
                      <td className="py-4 px-4">
                        <div className="font-semibold text-[#333333]">{tenant.ownerName || 'Admin Master'}</div>
                        <div className="text-xs text-[#666666]">{tenant.ownerEmail || tenant.email}</div>
                      </td>

                      {/* Plano */}
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black uppercase bg-[#FFF3EE] text-[#E8622C] border border-[#F0806B]/20">
                          {tenant.plan || 'Free'}
                        </span>
                      </td>

                      {/* Limite de Equipe */}
                      <td className="py-4 px-4 font-semibold text-[#444444]">
                        <div className="flex items-center gap-1.5">
                          <Users className="h-4 w-4 text-[#8A503C]" />
                          <span>{tenant.maxUsers || 1} colaborador{(tenant.maxUsers || 1) > 1 ? 'es' : ''}</span>
                        </div>
                      </td>

                      {/* Switch Ativar / Desativar */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Switch
                            checked={isActive}
                            disabled={isCurrentAction}
                            onCheckedChange={() => handleToggleStatus(tenant)}
                          />
                          <span className={`text-xs font-bold ${isActive ? 'text-[#10B981]' : isSuspended ? 'text-[#D97706]' : 'text-[#DC2626]'}`}>
                            {isActive ? 'Ativo' : isSuspended ? 'Suspenso' : 'Inativo'}
                          </span>
                        </div>
                      </td>

                      {/* Ações (Editar, Excluir, Dropdown) */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Botão Editar Rápido */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(tenant)}
                            className="h-8 w-8 p-0 text-[#666] hover:text-[#E8622C] hover:bg-orange-50 rounded-lg"
                            title="Editar Dados da Empresa"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>

                          {/* Botão Excluir */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setTenantToDelete(tenant)}
                            className="h-8 w-8 p-0 text-[#888] hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Excluir Empresa"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>

                          {/* Dropdown com mais opções */}
                          <DropdownMenu>
                            <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-[#FAF6F2] text-[#666666] hover:text-[#2B2B2B] transition-colors">
                              <MoreVertical className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52 bg-white border-[#DECDBB]">
                              <DropdownMenuLabel className="text-xs text-[#888888]">Mudar Plano</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handlePlanChange(tenant.$id, 'starter', 2)}>
                                Starter (2 users)
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handlePlanChange(tenant.$id, 'pro', 5)}>
                                Pro (5 users)
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handlePlanChange(tenant.$id, 'enterprise', 15)}>
                                Enterprise (15 users)
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-[#DECDBB]" />
                              <DropdownMenuLabel className="text-xs text-[#888888]">Status Avançado</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(tenant.$id, 'active')}
                                className="text-[#10B981]"
                              >
                                Forçar Status Ativo
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
                                Cancelar Contrato
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Criação / Edição */}
      <TenantDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={loadData}
        tenantToEdit={selectedTenantToEdit}
      />

      {/* Modal de Confirmação de Exclusão / Cancelamento Seguro */}
      <Dialog open={!!tenantToDelete} onOpenChange={(open) => !open && setTenantToDelete(null)}>
        <DialogContent className="max-w-lg bg-white border-[#DECDBB] text-[#2B2B2B] p-6 rounded-2xl shadow-xl">
          <DialogHeader>
            <div className="h-11 w-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-2">
              <Shield className="h-5 w-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-[#2B2B2B]">
              Gerenciar Exclusão / Cancelamento
            </DialogTitle>
            <DialogDescription className="text-xs text-[#666666]">
              Como você deseja proceder com a empresa <strong>{tenantToDelete?.name}</strong> ({tenantToDelete?.document})?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs text-[#555]">
            <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200">
              <div className="font-bold text-emerald-900 flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Opção 1: Cancelar & Arquivar (Recomendado)
              </div>
              <p className="text-[#555]">
                Desativa a empresa e bloqueia os logins dos colaboradores, mas <strong>preserva todas as mensagens do WhatsApp, histórico de faturas e logs de auditoria</strong> intactos para segurança e conformidade legal/fiscal.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-red-50/80 border border-red-200">
              <div className="font-bold text-red-900 flex items-center gap-1.5 mb-1">
                <Trash2 className="h-4 w-4 text-red-600" />
                Opção 2: Excluir Definitivamente
              </div>
              <p className="text-[#555]">
                Remove o registro da empresa do banco de dados.
              </p>
            </div>
          </div>

          <DialogFooter className="pt-3 flex flex-col sm:flex-row items-center justify-end gap-2 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setTenantToDelete(null)}
              className="w-full sm:w-auto border-[#DECDBB] text-[#666] text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={isDeleting}
              onClick={async () => {
                if (!tenantToDelete) return;
                setIsDeleting(true);
                try {
                  await deleteTenantAction(tenantToDelete.$id, 'soft');
                  setTenants((prev) =>
                    prev.map((t) => (t.$id === tenantToDelete.$id ? { ...t, status: 'canceled' } : t))
                  );
                  setTenantToDelete(null);
                } catch (e) {
                  console.error('Erro ao arquivar tenant:', e);
                } finally {
                  setIsDeleting(false);
                }
              }}
              className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
            >
              {isDeleting ? 'Processando...' : 'Arquivar / Cancelar'}
            </Button>
            <Button
              type="button"
              disabled={isDeleting}
              onClick={async () => {
                if (!tenantToDelete) return;
                setIsDeleting(true);
                try {
                  await deleteTenantAction(tenantToDelete.$id, 'hard');
                  setTenants((prev) => prev.filter((t) => t.$id !== tenantToDelete.$id));
                  setTenantToDelete(null);
                } catch (e) {
                  console.error('Erro ao excluir tenant:', e);
                } finally {
                  setIsDeleting(false);
                }
              }}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir Definitivo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
