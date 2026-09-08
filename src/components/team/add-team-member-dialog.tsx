'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserPlus, Shield, Crown, AlertCircle } from 'lucide-react';
import { createTeamMemberAction } from '@/app/actions/team';
import { DEFAULT_ADMIN_PERMISSIONS, DEFAULT_USER_PERMISSIONS, UserRole, UserPermissions } from '@/types/appwrite';

interface AddTeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId?: string;
  onSuccess?: () => void;
}

export function AddTeamMemberDialog({
  open,
  onOpenChange,
  tenantId = 'tenant_01',
  onSuccess,
}: AddTeamMemberDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgradeRequired, setUpgradeRequired] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'user' as UserRole,
  });

  const [permissions, setPermissions] = useState<UserPermissions>(DEFAULT_USER_PERMISSIONS);

  const handleRoleChange = (role: UserRole) => {
    setFormData((prev) => ({ ...prev, role }));
    if (role === 'admin') {
      setPermissions(DEFAULT_ADMIN_PERMISSIONS);
    } else {
      setPermissions(DEFAULT_USER_PERMISSIONS);
    }
  };

  const handleToggle = (key: keyof UserPermissions, value: boolean) => {
    setPermissions((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUpgradeRequired(false);
    setLoading(true);

    try {
      if (!formData.name || !formData.email) {
        throw new Error('Preencha o nome e e-mail do colaborador.');
      }

      const res = await createTeamMemberAction({
        tenantId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password || 'Mudar@2026',
        role: formData.role,
        permissions: formData.role === 'admin' ? DEFAULT_ADMIN_PERMISSIONS : permissions,
      });

      if (!res.success) {
        if (res.upgradeRequired) {
          setUpgradeRequired(true);
        }
        throw new Error(res.error || 'Erro ao adicionar membro.');
      }

      onOpenChange(false);
      if (onSuccess) onSuccess();

      // Reset
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'user',
      });
      setPermissions(DEFAULT_USER_PERMISSIONS);
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar membro.');
    } finally {
      setLoading(false);
    }
  };

  const isAdminRole = formData.role === 'admin';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-[#FAF6F2] border-[#DECDBB] text-[#2B2B2B]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-[#2B2B2B]">
            <UserPlus className="h-5 w-5 text-[#E8622C]" />
            Adicionar Colaborador à Equipe
          </DialogTitle>
          <DialogDescription className="text-sm text-[#666666]">
            Crie o acesso de um novo funcionário ou operador e defina suas permissões no sistema.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3.5 text-sm text-red-700 font-medium space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
            {upgradeRequired && (
              <div className="pt-1">
                <Link href="/dashboard/subscription">
                  <Button size="sm" className="bg-gradient-to-r from-[#F0806B] to-[#E8622C] text-white font-bold text-xs">
                    <Crown className="h-3.5 w-3.5 mr-1" /> Fazer Upgrade de Plano
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Dados Pessoais */}
          <div className="rounded-xl border border-[#DECDBB] bg-white p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#444444]">Nome Completo *</Label>
                <Input
                  required
                  placeholder="Ex: Beatriz Lima"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-[#FAF6F2] border-[#DECDBB]"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#444444]">E-mail de Acesso *</Label>
                <Input
                  required
                  type="email"
                  placeholder="beatriz@empresa.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-[#FAF6F2] border-[#DECDBB]"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#444444]">Telefone / WhatsApp</Label>
                <Input
                  placeholder="(11) 99999-8888"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-[#FAF6F2] border-[#DECDBB]"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#444444]">Cargo / Perfil</Label>
                <Select
                  value={formData.role}
                  onValueChange={(val: UserRole | null) => {
                    if (val) handleRoleChange(val);
                  }}
                >
                  <SelectTrigger className="bg-[#FAF6F2] border-[#DECDBB]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Colaborador / Operador</SelectItem>
                    <SelectItem value="admin">Administrador da Empresa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Permissões Iniciais */}
          {!isAdminRole && (
            <div className="rounded-xl border border-[#DECDBB] bg-white p-4 space-y-2.5">
              <Label className="text-xs font-bold text-[#8A503C] uppercase tracking-wider">
                Permissões Rápidas de Acesso
              </Label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 p-2 rounded-lg bg-[#FAF6F2] cursor-pointer">
                  <Switch
                    checked={permissions.canManageAppointments}
                    onCheckedChange={(val: boolean) => handleToggle('canManageAppointments', val)}
                  />
                  <span>Agenda & Atendimentos</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg bg-[#FAF6F2] cursor-pointer">
                  <Switch
                    checked={permissions.canManageWorkOrders}
                    onCheckedChange={(val: boolean) => handleToggle('canManageWorkOrders', val)}
                  />
                  <span>Orçamentos & O.S.</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg bg-[#FAF6F2] cursor-pointer">
                  <Switch
                    checked={permissions.canManageWhatsApp}
                    onCheckedChange={(val: boolean) => handleToggle('canManageWhatsApp', val)}
                  />
                  <span>WhatsApp & Chat</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg bg-[#FAF6F2] cursor-pointer">
                  <Switch
                    checked={permissions.canManageClients}
                    onCheckedChange={(val: boolean) => handleToggle('canManageClients', val)}
                  />
                  <span>Clientes CRM</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg bg-[#FAF6F2] cursor-pointer">
                  <Switch
                    checked={permissions.canManageInvoices}
                    onCheckedChange={(val: boolean) => handleToggle('canManageInvoices', val)}
                  />
                  <span>Cobranças PIX</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg bg-[#FAF6F2] cursor-pointer">
                  <Switch
                    checked={permissions.canViewReports}
                    onCheckedChange={(val: boolean) => handleToggle('canViewReports', val)}
                  />
                  <span>Relatórios Financeiros</span>
                </label>
              </div>
            </div>
          )}

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
              {loading ? 'Adicionando...' : 'Adicionar Colaborador'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
