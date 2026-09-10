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
      const profile = await fetchTenantProfileAction();
      const activeTenantId = profile?.$id || (profile as any)?.tenantId || 'tenant_01';
      const teamList = await fetchTeamMembersAction(activeTenantId);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl bg-card p-6 shadow-warm-xs border border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-6 items-center px-2 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-primary/10 text-primary border border-primary/20">
              Gestão de Colaboradores
            </span>
            <span className="text-xs text-muted-foreground">Autonomia do Administrador</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Users2 className="h-6 w-6 text-primary" />
            Equipe &amp; Permissões Granulares
          </h1>
          <p className="text-sm text-muted-foreground">
            Adicione funcionários, técnicos ou recepcionistas e defina exatamente quais módulos cada um tem autorização para acessar.
          </p>
        </div>

        {/* Capacity / Plan Badge */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="rounded-xl border border-border bg-muted/50 px-4 py-2.5 flex items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                Assentos de Usuários
              </div>
              <div className="text-base font-black text-foreground">
                {occupiedSeats} de {maxUsers} utilizados
              </div>
            </div>
            <Link href="/dashboard/subscription">
              <Button size="sm" variant="outline" className="text-xs border-border text-primary hover:bg-muted">
                <Crown className="h-3.5 w-3.5 mr-1" /> Upgrade
              </Button>
            </Link>
          </div>

          <Button
            onClick={() => setIsAddOpen(true)}
            className="bg-primary text-primary-foreground font-bold hover:bg-primary/90 shadow-warm-sm"
          >
            <UserPlus className="h-4 w-4 mr-1.5" />
            Adicionar Membro
          </Button>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-3 rounded-2xl border border-border bg-card p-4 shadow-warm-xs justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, e-mail ou WhatsApp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          disabled={loading}
          className="border-border text-foreground hover:bg-muted self-start sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Team Members Table */}
      <div className="rounded-2xl border border-border bg-card shadow-warm-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/60 text-xs font-bold text-foreground uppercase">
              <tr>
                <th className="py-3.5 px-4">Colaborador / Contato</th>
                <th className="py-3.5 px-4">Perfil / Cargo</th>
                <th className="py-3.5 px-4">Módulos Liberados</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Permissões</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-sm text-muted-foreground">
                    Carregando membros da equipe...
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-sm text-muted-foreground">
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
                    <tr key={member.$id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-bold text-foreground flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center font-black text-xs text-primary">
                            {member.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div>{member.name}</div>
                            <div className="text-xs text-muted-foreground font-normal">{member.email}</div>
                          </div>
                        </div>
                        {member.phone && <div className="text-xs text-muted-foreground pl-10">{member.phone}</div>}
                      </td>

                      <td className="py-4 px-4">
                        {member.role === 'owner' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black uppercase bg-primary/15 text-primary border border-primary/30">
                            <Crown className="h-3 w-3" /> Dono / Proprietário
                          </span>
                        ) : member.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-muted text-foreground border border-border">
                            <ShieldCheck className="h-3 w-3 text-primary" /> Administrador
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-muted/60 text-muted-foreground border border-border">
                            Colaborador
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-foreground">
                            {isOwnerOrAdmin ? 'Todos (8/8)' : `${activeModulesCount} de 8 liberados`}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        {member.active !== false ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/15 text-primary">
                            <CheckCircle2 className="h-3 w-3" /> Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
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
                            className="border-border text-foreground hover:text-primary hover:bg-muted text-xs font-semibold"
                          >
                            <Key className="h-3.5 w-3.5 mr-1 text-primary" />
                            Permissões
                          </Button>

                          {member.role !== 'owner' && (
                            <DropdownMenu>
                              <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                                <MoreVertical className="h-4 w-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44 bg-card border-border text-foreground">
                                <DropdownMenuItem onClick={() => handleToggleStatus(member)} className="hover:bg-muted cursor-pointer">
                                  {member.active !== false ? 'Desativar Acesso' : 'Reativar Acesso'}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-border" />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteMember(member)}
                                  className="text-rose-600 focus:text-rose-700 hover:bg-muted cursor-pointer"
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
