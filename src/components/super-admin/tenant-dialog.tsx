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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, Shield, User, Mail, Phone, FileText, CheckCircle2, Lock } from 'lucide-react';
import { fetchSaasPlansAction, createTenantAction } from '@/app/actions/super-admin';
import { SAAS_PLANS, PlanDefinition } from '@/lib/constants/plans';

interface TenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function TenantDialog({ open, onOpenChange, onSuccess }: TenantDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availablePlans, setAvailablePlans] = useState<PlanDefinition[]>(Object.values(SAAS_PLANS));

  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    personType: 'pj' as 'pf' | 'pj',
    document: '',
    email: '',
    phone: '',
    plan: 'pro' as string,
    maxUsers: 5,
    ownerName: '',
    ownerEmail: '',
    adminPassword: '',
  });

  useEffect(() => {
    if (open) {
      fetchSaasPlansAction().then((plans) => {
        if (plans && plans.length > 0) {
          setAvailablePlans(plans);
        }
      });
    }
  }, [open]);

  const handlePlanChange = (planId: string) => {
    const planConfig = availablePlans.find((p) => p.id === planId) || SAAS_PLANS[planId];
    setFormData((prev) => ({
      ...prev,
      plan: planId,
      maxUsers: planConfig?.limits?.maxUsers === Infinity ? 0 : planConfig?.limits?.maxUsers || 1,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!formData.name || !formData.document || !formData.ownerEmail || !formData.ownerName) {
        throw new Error('Preencha os campos obrigatórios: Nome da Empresa, Documento, Nome do Admin e E-mail do Admin.');
      }

      const res = await createTenantAction({
        name: formData.name,
        companyName: formData.companyName || formData.name,
        personType: formData.personType,
        document: formData.document,
        email: formData.email || formData.ownerEmail,
        phone: formData.phone,
        plan: formData.plan,
        maxUsers: formData.maxUsers,
        ownerName: formData.ownerName,
        ownerEmail: formData.ownerEmail,
        adminPassword: formData.adminPassword || 'ServiceZap@2026',
      });

      if (!res.success) {
        throw new Error(res.error || 'Erro ao cadastrar tenant');
      }

      onOpenChange(false);
      if (onSuccess) onSuccess();
      // Limpa formulário
      setFormData({
        name: '',
        companyName: '',
        personType: 'pj',
        document: '',
        email: '',
        phone: '',
        plan: 'pro',
        maxUsers: 5,
        ownerName: '',
        ownerEmail: '',
        adminPassword: '',
      });
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#FAF6F2] border-[#DECDBB] text-[#2B2B2B]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-[#2B2B2B]">
            <Building2 className="h-5 w-5 text-[#E8622C]" />
            Cadastrar Nova Empresa (Tenant)
          </DialogTitle>
          <DialogDescription className="text-sm text-[#666666]">
            Configure uma nova empresa cliente no ServiceZap, defina o plano contratado e crie o usuário Administrador responsável.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Sessão 1: Dados da Empresa */}
          <div className="rounded-xl border border-[#DECDBB] bg-white p-4 space-y-3">
            <h4 className="text-xs font-bold text-[#E8622C] uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="h-4 w-4" /> 1. Dados da Empresa / Autônomo
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#444444]">Nome Fantasia / Comercial *</Label>
                <Input
                  required
                  placeholder="Ex: Clínica Alpha / Mecânica Silva"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-[#FAF6F2] border-[#DECDBB]"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#444444]">Razão Social (se PJ)</Label>
                <Input
                  placeholder="Ex: Alpha Serviços Médicos LTDA"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="bg-[#FAF6F2] border-[#DECDBB]"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#444444]">Tipo</Label>
                <Select
                  value={formData.personType}
                  onValueChange={(val: 'pf' | 'pj' | null) => {
                    if (val) setFormData({ ...formData, personType: val });
                  }}
                >
                  <SelectTrigger className="bg-[#FAF6F2] border-[#DECDBB]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pj">Pessoa Jurídica (PJ / CNPJ)</SelectItem>
                    <SelectItem value="pf">Pessoa Física / Autônomo (PF / CPF)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#444444]">CPF ou CNPJ *</Label>
                <Input
                  required
                  placeholder="00.000.000/0001-00"
                  value={formData.document}
                  onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                  className="bg-[#FAF6F2] border-[#DECDBB]"
                />
              </div>
            </div>
          </div>

          {/* Sessão 2: Plano e Limite */}
          <div className="rounded-xl border border-[#DECDBB] bg-white p-4 space-y-3">
            <h4 className="text-xs font-bold text-[#E8622C] uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="h-4 w-4" /> 2. Plano SaaS & Limite de Usuários
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#444444]">Plano Contratado *</Label>
                <Select
                  value={formData.plan}
                  onValueChange={(val: string | null) => {
                    if (val) handlePlanChange(val);
                  }}
                >
                  <SelectTrigger className="bg-[#FAF6F2] border-[#DECDBB]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePlans.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.limits?.maxUsers === Infinity || p.limits?.maxUsers === 0 ? 'Ilimitado' : `${p.limits?.maxUsers} users`} - R$ {p.priceMonthly}/mês)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#444444]">Limite de Colaboradores</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.maxUsers}
                  onChange={(e) => setFormData({ ...formData, maxUsers: parseInt(e.target.value) || 1 })}
                  className="bg-[#FAF6F2] border-[#DECDBB]"
                />
              </div>
            </div>
          </div>

          {/* Sessão 3: Administrador Inicial da Empresa */}
          <div className="rounded-xl border border-[#DECDBB] bg-white p-4 space-y-3">
            <h4 className="text-xs font-bold text-[#E8622C] uppercase tracking-wider flex items-center gap-1.5">
              <User className="h-4 w-4" /> 3. Administrador Inicial da Empresa
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#444444]">Nome do Responsável *</Label>
                <Input
                  required
                  placeholder="Ex: Carlos Eduardo"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  className="bg-[#FAF6F2] border-[#DECDBB]"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#444444]">E-mail de Login do Admin *</Label>
                <Input
                  required
                  type="email"
                  placeholder="admin@empresa.com"
                  value={formData.ownerEmail}
                  onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                  className="bg-[#FAF6F2] border-[#DECDBB]"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#444444]">WhatsApp / Telefone</Label>
                <Input
                  placeholder="(11) 99999-9999"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-[#FAF6F2] border-[#DECDBB]"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#444444]">Senha de Acesso Provisória</Label>
                <Input
                  type="text"
                  placeholder="Padrão: ServiceZap@2026"
                  value={formData.adminPassword}
                  onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                  className="bg-[#FAF6F2] border-[#DECDBB]"
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
              {loading ? 'Cadastrando...' : 'Cadastrar Empresa'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
