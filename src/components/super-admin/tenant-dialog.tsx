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
import {
  Building2,
  Shield,
  User,
  Mail,
  Phone,
  Lock,
  Sparkles,
  CreditCard,
  Users,
  CheckCircle2,
} from 'lucide-react';
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

  const selectedPlanConfig = availablePlans.find((p) => p.id === formData.plan) || SAAS_PLANS[formData.plan] || SAAS_PLANS.free;

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
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto bg-[#FAF6F2] border-[#DECDBB] text-[#2B2B2B] p-5 md:p-6">
        <DialogHeader className="pb-2 border-b border-[#DECDBB]/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-orange-100 text-[#E8622C]">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg md:text-xl font-bold text-[#2B2B2B]">
                  Cadastrar Nova Empresa (Tenant)
                </DialogTitle>
                <DialogDescription className="text-xs text-[#666666]">
                  Adicione um cliente à plataforma, configure o plano contratado e crie as credenciais do Administrador.
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-2.5 text-xs text-red-700 font-medium flex items-center gap-2">
            <span className="font-bold">⚠️ Erro:</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Grid Principal de 2 Colunas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Coluna 1: Dados da Empresa / Estabelecimento */}
            <div className="rounded-xl border border-[#DECDBB] bg-white p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                <h4 className="text-xs font-bold text-[#E8622C] uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" /> 1. Dados da Empresa
                </h4>
                <span className="text-[10px] text-gray-400 font-medium">* Obrigatórios</span>
              </div>

              <div className="space-y-2.5">
                <div>
                  <Label className="text-xs font-semibold text-[#444444]">Nome Fantasia / Comercial *</Label>
                  <Input
                    required
                    placeholder="Ex: Clínica Alpha / Mecânica Silva"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-9 bg-[#FAF6F2] border-[#DECDBB] text-xs mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold text-[#444444]">Razão Social (se PJ)</Label>
                  <Input
                    placeholder="Ex: Alpha Serviços Médicos LTDA"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="h-9 bg-[#FAF6F2] border-[#DECDBB] text-xs mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs font-semibold text-[#444444]">Tipo de Pessoa</Label>
                    <Select
                      value={formData.personType}
                      onValueChange={(val: 'pf' | 'pj' | null) => {
                        if (val) setFormData({ ...formData, personType: val });
                      }}
                    >
                      <SelectTrigger className="h-9 bg-[#FAF6F2] border-[#DECDBB] text-xs mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pj">PJ (Empresa)</SelectItem>
                        <SelectItem value="pf">PF (Autônomo)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-[#444444]">
                      {formData.personType === 'pj' ? 'CNPJ *' : 'CPF *'}
                    </Label>
                    <Input
                      required
                      placeholder={formData.personType === 'pj' ? '00.000.000/0001-00' : '000.000.000-00'}
                      value={formData.document}
                      onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                      className="h-9 bg-[#FAF6F2] border-[#DECDBB] text-xs mt-1 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-[#444444]">WhatsApp / Telefone de Atendimento</Label>
                  <Input
                    placeholder="(11) 99999-9999"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="h-9 bg-[#FAF6F2] border-[#DECDBB] text-xs mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Coluna 2: Administrador + Plano SaaS */}
            <div className="space-y-4">
              
              {/* Card Admin */}
              <div className="rounded-xl border border-[#DECDBB] bg-white p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                  <h4 className="text-xs font-bold text-[#E8622C] uppercase tracking-wider flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" /> 2. Administrador da Conta
                  </h4>
                  <span className="text-[10px] text-gray-400 font-medium">Acesso Master</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="sm:col-span-2">
                    <Label className="text-xs font-semibold text-[#444444]">Nome do Responsável *</Label>
                    <Input
                      required
                      placeholder="Ex: Carlos Eduardo"
                      value={formData.ownerName}
                      onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                      className="h-9 bg-[#FAF6F2] border-[#DECDBB] text-xs mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-[#444444]">E-mail de Login *</Label>
                    <Input
                      required
                      type="email"
                      placeholder="admin@empresa.com"
                      value={formData.ownerEmail}
                      onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                      className="h-9 bg-[#FAF6F2] border-[#DECDBB] text-xs mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-[#444444]">Senha Provisória</Label>
                    <Input
                      type="text"
                      placeholder="ServiceZap@2026"
                      value={formData.adminPassword}
                      onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                      className="h-9 bg-[#FAF6F2] border-[#DECDBB] text-xs mt-1 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Card Plano e Limite */}
              <div className="rounded-xl border border-[#DECDBB] bg-white p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                  <h4 className="text-xs font-bold text-[#E8622C] uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5" /> 3. Plano & Limite SaaS
                  </h4>
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
                    {selectedPlanConfig?.name || 'Pro'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <Label className="text-xs font-semibold text-[#444444]">Plano Contratado *</Label>
                    <Select
                      value={formData.plan}
                      onValueChange={(val: string | null) => {
                        if (val) handlePlanChange(val);
                      }}
                    >
                      <SelectTrigger className="h-9 bg-[#FAF6F2] border-[#DECDBB] text-xs mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePlans.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} (R$ {p.priceMonthly}/mês)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-[#444444]">Limite de Usuários</Label>
                    <Input
                      type="number"
                      min={1}
                      value={formData.maxUsers}
                      onChange={(e) => setFormData({ ...formData, maxUsers: parseInt(e.target.value) || 1 })}
                      className="h-9 bg-[#FAF6F2] border-[#DECDBB] text-xs mt-1"
                    />
                  </div>
                </div>

                {/* Resumo do Plano */}
                <div className="rounded-lg bg-orange-50/60 border border-orange-100 p-2 text-[11px] text-[#555] flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-[#E8622C]" />
                    <span>
                      {selectedPlanConfig?.limits?.maxAppointmentsPerMonth ? `${selectedPlanConfig.limits.maxAppointmentsPerMonth} atendimentos/mês` : 'Atendimentos ilimitados'}
                    </span>
                  </div>
                  <span className="font-bold text-[#E8622C]">R$ {selectedPlanConfig?.priceMonthly || 0}/mês</span>
                </div>
              </div>

            </div>
          </div>

          <DialogFooter className="pt-2 border-t border-[#DECDBB]/60 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 px-4 border-[#DECDBB] text-[#555555] text-xs hover:bg-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-9 px-5 bg-gradient-to-r from-[#F0806B] to-[#E8622C] text-white text-xs font-bold hover:brightness-105 shadow-sm"
            >
              {loading ? (
                <span className="flex items-center gap-1.5">
                  <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Cadastrando...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Cadastrar Empresa
                </span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
