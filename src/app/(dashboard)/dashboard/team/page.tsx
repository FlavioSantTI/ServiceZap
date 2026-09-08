'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users2,
  UserPlus,
  ShieldCheck,
  Shield,
  Key,
  CheckCircle2,
  AlertTriangle,
  Crown,
  Settings2,
  Trash2,
  RefreshCw,
  Search,
  MoreVertical,
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
import {
  fetchTeamMembersAction,
  updateTeamMemberStatusAction,
  deleteTeamMemberAction,
} from '@/app/actions/team';
import { fetchTenantProfileAction } from '@/app/actions/tenant';
import { UserDocument } from '@/types/appwrite';
import { UserPermissionsDialog } from '@/components/team/user-permissions-dialog';
import { AddTeamMemberDialog } from '@/components/team/add-team-member-dialog';

export default function TeamManagementPage() {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<UserDocument[]>([]);
  const [tenantProfile, setTenantProfile] = useState<any>(null);
  const [search, setSearch] = useState('');

  // Modals state
  const [selectedUserForPerms, setSelectedUserForPerms] = useState<UserDocument | null>(null);
  const [isPermsOpen, setIsPermsOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [teamList, profile] = await Promise.all([
        fetchTeamMembersAction('tenant_01'),
        fetchTenantProfileAction(),
      ]);
      setMembers(teamList);
      setTenantProfile(profile);
    } catch (e) {
      console.error('Erro ao buscar dados da equipe:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenPermissions = (user: UserDocument) => {
    setSelectedUserForPerms(user);
    setIsPermsOpen(true);
  };

  const handleToggleStatus = async (user: UserDocument) => {
    try {
      await updateTeamMemberStatusAction(user.$id, user.tenantId || 'tenant_01', !user.active);
      await loadData();
    } catch (e) {
      console.error('Erro ao alterar status:', e);
    }
  };

  const handleDeleteMember = async (user: UserDocument) => {
    if (confirm(`Deseja realmente remover o colaborador ${user.name}?`)) {
      try {
        await deleteTeamMemberAction(user.$id, user.tenantId || 'tenant_01', user.name);
        await loadData();
      } catch (e) {
        console.error('Erro ao excluir colaborador:', e);
      }
    }
  };

  const maxUsers = tenantProfile?.maxUsers || (tenantProfile?.plan === 'enterprise' ? 15 : tenantProfile?.plan === 'pro' ? 5 : tenantProfile?.plan === 'starter' ? 2 : 1);
  const occupiedSeats = members.length;
  const isLimitReached = occupiedSeats >= maxUsers;

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      (m.phone && m.phone.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl bg-white p-6 shadow-warm-xs border border-[#DECDBB]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-6 items-center px-2 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-[#FFF3EE] text-[#E8622C] border border-[#F0806B]/20">
              Gestão de Colaboradores
            </span>
            <span className="text-xs text-[#777777]">Autonomia do Administrador</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#2B2B2B] flex items-center gap-2">
            <Users2 className="h-6 w-6 text-[#E8622C]" />
            Equipe & Permissões Granulares
          </h1>
          <p className="text-sm text-[#666666]">
            Adicione funcionários, técnicos ou recepcionistas e defina exatamente quais módulos cada um tem autorização para acessar.
          </p>
        </div>

        {/* Capacity / Plan Badge */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="rounded-xl border border-[#DECDBB] bg-[#FAF6F2] px-4 py-2.5 flex items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-bold text-[#8A503C] uppercase tracking-wider">
                Assentos de Usuários
              </div>
              <div className="text-base font-black text-[#2B2B2B]">
                {occupiedSeats} de {maxUsers} utilizados
              </div>
            </div>
            <Link href="/dashboard/subscription">
              <Button size="sm" variant="outline" className="text-xs border-[#DECDBB] text-[#E8622C] hover:bg-[#FFF3EE]">
                <Crown className="h-3.5 w-3.5 mr-1" /> Upgrade
              </Button>
            </Link>
          </div>

          <Button
            onClick={() => setIsAddOpen(true)}
            className="bg-gradient-to-r from-[#F0806B] to-[#E8622C] text-white font-bold hover:brightness-105 shadow-warm-sm"
          >
            <UserPlus className="h-4 w-4 mr-1.5" />
            Adicionar Membro
          </Button>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-3 rounded-2xl border border-[#DECDBB] bg-white p-4 shadow-warm-xs justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#888888]" />
          <Input
            placeholder="Buscar por nome, e-mail ou WhatsApp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-[#FAF6F2] border-[#DECDBB]"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          disabled={loading}
          className="border-[#DECDBB] text-[#666666] hover:bg-[#FFF3EE] self-start sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Team Members Table */}
      <div className="rounded-2xl border border-[#DECDBB] bg-white shadow-warm-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#DECDBB] bg-[#FAF6F2] text-xs font-bold text-[#8A503C] uppercase">
              <tr>
                <th className="py-3.5 px-4">Colaborador / Contato</th>
                <th className="py-3.5 px-4">Perfil / Cargo</th>
                <th className="py-3.5 px-4">Módulos Liberados</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Permissões</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2E8DE]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-sm text-[#777777]">
                    Carregando membros da equipe...
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-sm text-[#777777]">
                    Nenhum colaborador encontrado.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const isOwnerOrAdmin = member.role === 'owner' || member.role === 'admin';
                  const activeModulesCount = isOwnerOrAdmin
                    ? 8
                    : Object.values(member.permissions || {}).filter(Boolean).length;

                  return (
                    <tr key={member.$id} className="hover:bg-[#FAF6F2] transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-bold text-[#2B2B2B] flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-[#FFF3EE] border border-[#F0806B]/30 flex items-center justify-center font-black text-xs text-[#E8622C]">
                            {member.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div>{member.name}</div>
                            <div className="text-xs text-[#777777] font-normal">{member.email}</div>
                          </div>
                        </div>
                        {member.phone && <div className="text-xs text-[#888888] pl-10">{member.phone}</div>}
                      </td>

                      <td className="py-4 px-4">
                        {member.role === 'owner' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black uppercase bg-[#FFF3EE] text-[#E8622C] border border-[#F0806B]/30">
                            <Crown className="h-3 w-3" /> Dono / Proprietário
                          </span>
                        ) : member.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-[#EBF6EE] text-[#10B981] border border-[#10B981]/20">
                            <ShieldCheck className="h-3 w-3" /> Administrador
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#FAF6F2] text-[#555555] border border-[#DECDBB]">
                            Colaborador
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#2B2B2B]">
                            {isOwnerOrAdmin ? 'Todos (8/8)' : `${activeModulesCount} de 8 liberados`}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        {member.active !== false ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EBF6EE] text-[#10B981]">
                            <CheckCircle2 className="h-3 w-3" /> Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFF9E6] text-[#D97706]">
                            <AlertTriangle className="h-3 w-3" /> Inativo
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenPermissions(member)}
                            className="border-[#DECDBB] text-[#444444] hover:text-[#E8622C] hover:bg-[#FFF3EE] text-xs font-semibold"
                          >
                            <Key className="h-3.5 w-3.5 mr-1 text-[#E8622C]" />
                            Permissões
                          </Button>

                          {member.role !== 'owner' && (
                            <DropdownMenu>
                              <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-[#FAF6F2] text-[#777777] hover:text-[#2B2B2B] transition-colors">
                                <MoreVertical className="h-4 w-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44 bg-white border-[#DECDBB]">
                                <DropdownMenuItem onClick={() => handleToggleStatus(member)}>
                                  {member.active !== false ? 'Desativar Acesso' : 'Reativar Acesso'}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-[#DECDBB]" />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteMember(member)}
                                  className="text-red-600 focus:text-red-700"
                                >
                                  Remover da Equipe
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
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

      {/* Permissions Dialog */}
      <UserPermissionsDialog
        open={isPermsOpen}
        onOpenChange={setIsPermsOpen}
        user={selectedUserForPerms}
        onSuccess={loadData}
      />

      {/* Add Member Dialog */}
      <AddTeamMemberDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        tenantId={tenantProfile?.$id || 'tenant_01'}
        onSuccess={loadData}
      />
    </div>
  );
}
