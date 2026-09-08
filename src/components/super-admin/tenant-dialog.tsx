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
  Briefcase,
  Layers,
  KeyRound,
  FileCheck,
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

  const selectedPlan = availablePlans.find((p) => p.id === formData.plan) || SAAS_PLANS[formData.plan] || SAAS_PLANS.free;

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
      <DialogContent className="w-[95vw] sm:max-w-4xl md:max-w-5xl max-h-[90vh] overflow-y-auto bg-[#FAF7F4] border-[#E0D2C3] text-[#242424] p-6 md:p-8 shadow-2xl rounded-2xl">
        
        {/* Header Elegante */}
        <DialogHeader className="pb-4 border-b border-[#E0D2C3]">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#F0806B] to-[#E8622C] flex items-center justify-center text-white shadow-md">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl md:text-2xl font-bold tracking-tight text-[#2B2B2B]">
                Cadastrar Nova Empresa / Tenant
              </DialogTitle>
              <DialogDescription className="text-xs md:text-sm text-[#737373] mt-0.5">
                Configure os dados corporativos, parametrize os limites do plano e crie o usuário Administrador Master.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <div className="rounded-xl bg-red-50/90 border border-red-200 p-3 text-xs md:text-sm text-red-800 font-medium flex items-center gap-2.5 animate-in fade-in-50">
            <span className="p-1 rounded-full bg-red-100 text-red-600 font-bold">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          
          {/* Grid Principal Amplo de 2 Colunas */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Coluna Esquerda: Dados Corporativos (7 de 12 colunas) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="rounded-2xl border border-[#E0D2C3] bg-white p-5 md:p-6 space-y-4 shadow-xs">
                
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2 text-[#E8622C]">
                    <Building2 className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#2B2B2B]">
                      1. Informações da Empresa
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/50">
                    Campos com * são obrigatórios
                  </span>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <Label className="text-xs font-semibold text-[#404040]">
                      Nome Comercial / Nome Fantasia *
                    </Label>
                    <Input
                      required
                      placeholder="Ex: Clínica Alpha Saúde & Estética"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="h-10 bg-[#FAF7F4] border-[#E0D2C3] text-sm mt-1 focus-visible:ring-[#E8622C]"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-[#404040]">
                      Razão Social (Opcional se PJ)
                    </Label>
                    <Input
                      placeholder="Ex: Alpha Serviços Médicos e Odontológicos LTDA"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="h-10 bg-[#FAF7F4] border-[#E0D2C3] text-sm mt-1 focus-visible:ring-[#E8622C]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <Label className="text-xs font-semibold text-[#404040]">Tipo de Pessoa</Label>
                      <Select
                        value={formData.personType}
                        onValueChange={(val: 'pf' | 'pj' | null) => {
                          if (val) setFormData({ ...formData, personType: val });
                        }}
                      >
                        <SelectTrigger className="h-10 bg-[#FAF7F4] border-[#E0D2C3] text-sm mt-1 focus:ring-[#E8622C]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pj">Pessoa Jurídica (PJ / CNPJ)</SelectItem>
                          <SelectItem value="pf">Pessoa Física (Autônomo / CPF)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold text-[#404040]">
                        {formData.personType === 'pj' ? 'CNPJ da Empresa *' : 'CPF do Titular *'}
                      </Label>
                      <Input
                        required
                        placeholder={formData.personType === 'pj' ? '00.000.000/0001-00' : '000.000.000-00'}
                        value={formData.document}
                        onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                        className="h-10 bg-[#FAF7F4] border-[#E0D2C3] text-sm font-mono mt-1 focus-visible:ring-[#E8622C]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <Label className="text-xs font-semibold text-[#404040]">
                        WhatsApp Comercial / Telefone
                      </Label>
                      <Input
                        placeholder="(11) 98765-4321"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="h-10 bg-[#FAF7F4] border-[#E0D2C3] text-sm mt-1 focus-visible:ring-[#E8622C]"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-semibold text-[#404040]">
                        E-mail de Contato Comercial
                      </Label>
                      <Input
                        type="email"
                        placeholder="contato@empresa.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="h-10 bg-[#FAF7F4] border-[#E0D2C3] text-sm mt-1 focus-visible:ring-[#E8622C]"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Coluna Direita: Admin & Plano (5 de 12 colunas) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              
              {/* Card Admin Master */}
              <div className="rounded-2xl border border-[#E0D2C3] bg-white p-5 space-y-3.5 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2 text-[#E8622C]">
                    <User className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#2B2B2B]">
                      2. Administrador da Conta
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Acesso Master
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-xs font-semibold text-[#404040]">Nome do Gestor *</Label>
                    <Input
                      required
                      placeholder="Ex: Carlos Eduardo Silva"
                      value={formData.ownerName}
                      onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                      className="h-9 bg-[#FAF7F4] border-[#E0D2C3] text-xs mt-1 focus-visible:ring-[#E8622C]"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-[#404040]">E-mail de Login *</Label>
                    <Input
                      required
                      type="email"
                      placeholder="carlos.admin@empresa.com"
                      value={formData.ownerEmail}
                      onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                      className="h-9 bg-[#FAF7F4] border-[#E0D2C3] text-xs mt-1 focus-visible:ring-[#E8622C]"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-[#404040]">Senha de Acesso Provisória</Label>
                    <Input
                      type="text"
                      placeholder="Padrão: ServiceZap@2026"
                      value={formData.adminPassword}
                      onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                      className="h-9 bg-[#FAF7F4] border-[#E0D2C3] text-xs font-mono mt-1 focus-visible:ring-[#E8622C]"
                    />
                  </div>
                </div>
              </div>

              {/* Card Plano SaaS Contratado */}
              <div className="rounded-2xl border border-[#E0D2C3] bg-white p-5 space-y-3.5 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2 text-[#E8622C]">
                    <Shield className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#2B2B2B]">
                      3. Plano SaaS & Limites
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase text-[#E8622C] bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                    {selectedPlan?.name}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold text-[#404040]">Plano</Label>
                    <Select
                      value={formData.plan}
                      onValueChange={(val: string | null) => {
                        if (val) handlePlanChange(val);
                      }}
                    >
                      <SelectTrigger className="h-9 bg-[#FAF7F4] border-[#E0D2C3] text-xs mt-1 focus:ring-[#E8622C]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePlans.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} — R$ {p.priceMonthly}/mês
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-[#404040]">Usuários</Label>
                    <Input
                      type="number"
                      min={1}
                      value={formData.maxUsers}
                      onChange={(e) => setFormData({ ...formData, maxUsers: parseInt(e.target.value) || 1 })}
                      className="h-9 bg-[#FAF7F4] border-[#E0D2C3] text-xs mt-1 focus-visible:ring-[#E8622C]"
                    />
                  </div>
                </div>

                {/* Resumo Dinâmico do Plano */}
                <div className="rounded-xl bg-gradient-to-r from-orange-50/80 to-amber-50/80 border border-orange-200/60 p-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-[#404040]">
                    <Sparkles className="h-4 w-4 text-[#E8622C] shrink-0" />
                    <span className="font-medium text-[11px]">
                      {selectedPlan?.limits?.maxAppointmentsPerMonth 
                        ? `${selectedPlan.limits.maxAppointmentsPerMonth} atendimentos/mês` 
                        : 'Atendimentos ilimitados'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-[#E8622C]">
                      R$ {selectedPlan?.priceMonthly || 0}
                    </span>
                    <span className="text-[10px] text-[#737373]">/mês</span>
                  </div>
                </div>

              </div>

            </div>

          </div>

          {/* Footer com Ações */}
          <DialogFooter className="pt-4 border-t border-[#E0D2C3] flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-10 px-5 border-[#DECDBB] text-[#555555] text-xs font-medium hover:bg-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-10 px-6 bg-gradient-to-r from-[#F0806B] to-[#E8622C] text-white text-xs md:text-sm font-bold shadow-md hover:brightness-105 active:scale-[0.98] transition-all"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Cadastrando Empresa...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
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
