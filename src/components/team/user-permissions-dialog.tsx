'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  UserPermissions,
  UserRole,
  UserDocument,
  DEFAULT_ADMIN_PERMISSIONS,
  DEFAULT_USER_PERMISSIONS,
} from '@/types/appwrite';
import {
  ShieldCheck,
  Calendar,
  ClipboardList,
  Receipt,
  MessageSquare,
  Briefcase,
  Users,
  FileCheck2,
  BarChart3,
  UserCheck,
} from 'lucide-react';
import { updateTeamMemberPermissionsAction } from '@/app/actions/team';

interface UserPermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserDocument | null;
  onSuccess?: () => void;
}

export function UserPermissionsDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: UserPermissionsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<UserRole>('user');
  const [permissions, setPermissions] = useState<UserPermissions>(DEFAULT_USER_PERMISSIONS);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setRole(user.role || 'user');
      setPermissions(user.permissions || DEFAULT_USER_PERMISSIONS);
    }
  }, [user]);

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole === 'admin' || newRole === 'owner') {
      setPermissions(DEFAULT_ADMIN_PERMISSIONS);
    }
  };

  const handleToggle = (key: keyof UserPermissions, value: boolean) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError(null);
    setLoading(true);

    try {
      const res = await updateTeamMemberPermissionsAction(
        user.$id,
        user.tenantId || 'tenant_01',
        permissions,
        role
      );

      if (!res.success) {
        throw new Error(res.error || 'Erro ao salvar permissões');
      }

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar permissões');
    } finally {
      setLoading(false);
    }
  };

  const isAdminRole = role === 'admin' || role === 'owner';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-[#FAF6F2] border-[#DECDBB] text-[#2B2B2B]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-[#2B2B2B]">
            <ShieldCheck className="h-5 w-5 text-[#E8622C]" />
            Permissões de Acesso — {user?.name}
          </DialogTitle>
          <DialogDescription className="text-sm text-[#666666]">
            Defina o perfil de acesso e quais módulos este colaborador pode visualizar ou operar dentro da empresa.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Role do Colaborador */}
          <div className="rounded-xl border border-[#DECDBB] bg-white p-4 space-y-2">
            <Label className="text-xs font-bold text-[#8A503C] uppercase tracking-wider">
              Cargo / Tipo de Acesso
            </Label>
            <Select
              value={role}
              onValueChange={(val: UserRole | null) => {
                if (val) handleRoleChange(val);
              }}
            >
              <SelectTrigger className="bg-[#FAF6F2] border-[#DECDBB]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Colaborador / Operador (Permissões Personalizadas)</SelectItem>
                <SelectItem value="admin">Administrador da Empresa (Acesso Total)</SelectItem>
              </SelectContent>
            </Select>
            {isAdminRole && (
              <p className="text-xs text-[#10B981] font-medium flex items-center gap-1 mt-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                Como Administrador, este usuário possui acesso total a todos os módulos e configurações.
              </p>
            )}
          </div>

          {/* Matriz Granular de Módulos */}
          <div className="rounded-xl border border-[#DECDBB] bg-white p-4 space-y-3">
            <h4 className="text-xs font-bold text-[#8A503C] uppercase tracking-wider">
              Módulos Habilitados
            </h4>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1 divide-y divide-[#F2E8DE]">
              {/* Agenda */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-[#FFF3EE] flex items-center justify-center text-[#E8622C]">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#2B2B2B]">Agenda & Atendimentos</div>
                    <div className="text-xs text-[#777777]">Criar e gerenciar compromissos</div>
                  </div>
                </div>
                <Switch
                  checked={isAdminRole || permissions.canManageAppointments}
                  disabled={isAdminRole}
                  onCheckedChange={(val: boolean) => handleToggle('canManageAppointments', val)}
                />
              </div>

              {/* Orçamentos e OS */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-[#FFF3EE] flex items-center justify-center text-[#E8622C]">
                    <ClipboardList className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#2B2B2B]">Orçamentos & Ordens de Serviço</div>
                    <div className="text-xs text-[#777777]">Emitir propostas, aprovações e PDFs de OS</div>
                  </div>
                </div>
                <Switch
                  checked={isAdminRole || permissions.canManageWorkOrders}
                  disabled={isAdminRole}
                  onCheckedChange={(val: boolean) => handleToggle('canManageWorkOrders', val)}
                />
              </div>

              {/* Faturas e Cobranças */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-[#EBF6EE] flex items-center justify-center text-[#10B981]">
                    <Receipt className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#2B2B2B]">Faturas & Cobranças PIX</div>
                    <div className="text-xs text-[#777777]">Gerar links de pagamento e gerenciar recebíveis</div>
                  </div>
                </div>
                <Switch
                  checked={isAdminRole || permissions.canManageInvoices}
                  disabled={isAdminRole}
                  onCheckedChange={(val: boolean) => handleToggle('canManageInvoices', val)}
                />
              </div>

              {/* WhatsApp */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-[#EBF6EE] flex items-center justify-center text-[#10B981]">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#2B2B2B]">WhatsApp (Evolution API)</div>
                    <div className="text-xs text-[#777777]">Conversar com clientes no chat e enviar mensagens</div>
                  </div>
                </div>
                <Switch
                  checked={isAdminRole || permissions.canManageWhatsApp}
                  disabled={isAdminRole}
                  onCheckedChange={(val: boolean) => handleToggle('canManageWhatsApp', val)}
                />
              </div>

              {/* Catálogo de Serviços */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-[#F0EEFC] flex items-center justify-center text-[#6366F1]">
                    <Briefcase className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#2B2B2B]">Catálogo de Serviços & Preços</div>
                    <div className="text-xs text-[#777777]">Cadastrar serviços, valores e categorias</div>
                  </div>
                </div>
                <Switch
                  checked={isAdminRole || permissions.canManageServices}
                  disabled={isAdminRole}
                  onCheckedChange={(val: boolean) => handleToggle('canManageServices', val)}
                />
              </div>

              {/* Clientes */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-[#F0EEFC] flex items-center justify-center text-[#6366F1]">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#2B2B2B]">Clientes & CRM</div>
                    <div className="text-xs text-[#777777]">Cadastrar e editar dados dos clientes</div>
                  </div>
                </div>
                <Switch
                  checked={isAdminRole || permissions.canManageClients}
                  disabled={isAdminRole}
                  onCheckedChange={(val: boolean) => handleToggle('canManageClients', val)}
                />
              </div>

              {/* Fiscal / NF-e */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-[#FFF9E6] flex items-center justify-center text-[#F59E0B]">
                    <FileCheck2 className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#2B2B2B]">Emissão Fiscal & NF-e</div>
                    <div className="text-xs text-[#777777]">Autorizar e consultar notas fiscais eletrônicas</div>
                  </div>
                </div>
                <Switch
                  checked={isAdminRole || permissions.canManageFiscal}
                  disabled={isAdminRole}
                  onCheckedChange={(val: boolean) => handleToggle('canManageFiscal', val)}
                />
              </div>

              {/* Relatórios */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-[#FFF3EE] flex items-center justify-center text-[#E8622C]">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#2B2B2B]">Relatórios & Faturamento</div>
                    <div className="text-xs text-[#777777]">Visualizar gráficos de receita, DRE e LTV</div>
                  </div>
                </div>
                <Switch
                  checked={isAdminRole || permissions.canViewReports}
                  disabled={isAdminRole}
                  onCheckedChange={(val: boolean) => handleToggle('canViewReports', val)}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-[#DECDBB] text-[#555555]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-[#F0806B] to-[#E8622C] text-white font-bold hover:brightness-105"
            >
              {loading ? 'Salvando...' : 'Salvar Permissões'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
