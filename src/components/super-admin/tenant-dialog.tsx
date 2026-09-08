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
  Building2,
  Shield,
  User,
  Mail,
  Phone,
  Lock,
  Sparkles,
  Users,
  Check,
  CheckCircle2,
  RefreshCw,
  Zap,
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

  const handlePlanSelect = (planId: string) => {
    const planConfig = availablePlans.find((p) => p.id === planId) || SAAS_PLANS[planId];
    setFormData((prev) => ({
      ...prev,
      plan: planId,
      maxUsers: planConfig?.limits?.maxUsers === Infinity ? 0 : planConfig?.limits?.maxUsers || 1,
    }));
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let pass = 'Zap@';
    for (let i = 0; i < 6; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, adminPassword: pass }));
  };

  const selectedPlan =
    availablePlans.find((p) => p.id === formData.plan) ||
    SAAS_PLANS[formData.plan] ||
    SAAS_PLANS.pro;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!formData.name || !formData.document || !formData.ownerEmail || !formData.ownerName) {
        throw new Error('Preencha os campos obrigatórios: Nome da Empresa, Documento, Nome do Gestor e E-mail de Login.');
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
      <DialogContent className="w-[96vw] max-w-5xl max-h-[92vh] overflow-y-auto bg-[#FAF7F4] border-[#DECDBB] text-[#2B2B2B] p-6 md:p-8 shadow-2xl rounded-2xl">
        
        {/* Cabeçalho */}
        <DialogHeader className="pb-4 border-b border-[#DECDBB]/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-[#F0806B] to-[#E8622C] flex items-center justify-center text-white shadow-md">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight text-[#2B2B2B]">
                  Cadastrar Nova Empresa (Tenant)
                </DialogTitle>
                <DialogDescription className="text-xs text-[#666666]">
                  Adicione uma nova empresa cliente, selecione o plano contratado e defina os acessos do Administrador.
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-800 font-medium flex items-center gap-2">
            <span>⚠️ {error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 pt-1">
          
          {/* SEÇÃO 1: SELEÇÃO VISUAL DE PLANOS SAAS (4 CARDS) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-[#444] uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-[#E8622C]" />
                1. Escolha o Plano Contratado
              </Label>
              <span className="text-[11px] text-[#888]">Clique para selecionar</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {availablePlans.map((plan) => {
                const isSelected = formData.plan === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => handlePlanSelect(plan.id)}
                    className={`relative cursor-pointer rounded-xl border p-3.5 transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#E8622C] bg-white ring-2 ring-[#E8622C]/20 shadow-sm'
                        : 'border-[#DECDBB] bg-white/70 hover:bg-white hover:border-[#DECDBB]'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2.5 right-2.5 h-4 w-4 rounded-full bg-[#E8622C] text-white flex items-center justify-center">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#2B2B2B]">{plan.name}</span>
                        {plan.id === 'pro' && (
                          <span className="text-[9px] bg-orange-100 text-[#E8622C] px-1.5 py-0.5 rounded-full font-bold">
                            Popular
                          </span>
                        )}
                      </div>
                      <div className="mt-1">
                        <span className="text-base font-extrabold text-[#2B2B2B]">
                          {plan.priceMonthly === 0 ? 'Grátis' : `R$ ${plan.priceMonthly}`}
                        </span>
                        {plan.priceMonthly > 0 && (
                          <span className="text-[10px] text-[#888]">/mês</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-[#666]">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-[#E8622C]" />
                        {plan.limits.maxUsers === Infinity || plan.limits.maxUsers === 0
                          ? 'Ilimitado'
                          : `${plan.limits.maxUsers} usuário(s)`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SEÇÃO 2: DADOS DA EMPRESA E ADMIN (GRID 2 COLUNAS HARMONIOSAS) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Bloco Esquerdo: Dados da Empresa */}
            <div className="rounded-xl border border-[#DECDBB] bg-white p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h4 className="text-xs font-bold text-[#2B2B2B] uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-[#E8622C]" />
                  2. Dados da Empresa
                </h4>

                {/* Tipo de Pessoa Pill Selector */}
                <div className="flex items-center bg-[#FAF7F4] p-0.5 rounded-lg border border-[#DECDBB]">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, personType: 'pj' })}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                      formData.personType === 'pj'
                        ? 'bg-white text-[#E8622C] shadow-xs'
                        : 'text-[#666] hover:text-[#2B2B2B]'
                    }`}
                  >
                    PJ (CNPJ)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, personType: 'pf' })}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                      formData.personType === 'pf'
                        ? 'bg-white text-[#E8622C] shadow-xs'
                        : 'text-[#666] hover:text-[#2B2B2B]'
                    }`}
                  >
                    PF (CPF)
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-semibold text-[#444]">
                    Nome Fantasia / Comercial *
                  </Label>
                  <Input
                    required
                    placeholder="Ex: HidroNorte Soluções Hidráulicas"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-9 bg-[#FAF7F4] border-[#DECDBB] text-xs mt-1"
                  />
                </div>

                {formData.personType === 'pj' && (
                  <div>
                    <Label className="text-xs font-semibold text-[#444]">
                      Razão Social
                    </Label>
                    <Input
                      placeholder="Ex: HidroNorte Manutenções e Serviços LTDA"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="h-9 bg-[#FAF7F4] border-[#DECDBB] text-xs mt-1"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold text-[#444]">
                      {formData.personType === 'pj' ? 'CNPJ *' : 'CPF *'}
                    </Label>
                    <Input
                      required
                      placeholder={formData.personType === 'pj' ? '00.000.000/0001-00' : '000.000.000-00'}
                      value={formData.document}
                      onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                      className="h-9 bg-[#FAF7F4] border-[#DECDBB] text-xs font-mono mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-[#444]">
                      WhatsApp / Telefone
                    </Label>
                    <Input
                      placeholder="(11) 99999-9999"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="h-9 bg-[#FAF7F4] border-[#DECDBB] text-xs mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bloco Direito: Administrador Master & Limites */}
            <div className="rounded-xl border border-[#DECDBB] bg-white p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h4 className="text-xs font-bold text-[#2B2B2B] uppercase tracking-wider flex items-center gap-1.5">
                  <User className="h-4 w-4 text-[#E8622C]" />
                  3. Administrador & Acessos
                </h4>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                  Acesso Master
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-semibold text-[#444]">
                    Nome do Gestor / Admin *
                  </Label>
                  <Input
                    required
                    placeholder="Ex: Carlos Eduardo"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    className="h-9 bg-[#FAF7F4] border-[#DECDBB] text-xs mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold text-[#444]">
                    E-mail de Login *
                  </Label>
                  <Input
                    required
                    type="email"
                    placeholder="carlos@hidronorte.com.br"
                    value={formData.ownerEmail}
                    onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                    className="h-9 bg-[#FAF7F4] border-[#DECDBB] text-xs mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-[#444]">Senha de Acesso</Label>
                      <button
                        type="button"
                        onClick={generatePassword}
                        className="text-[10px] text-[#E8622C] font-semibold hover:underline flex items-center gap-0.5"
                      >
                        <RefreshCw className="h-2.5 w-2.5" /> Gerar
                      </button>
                    </div>
                    <Input
                      type="text"
                      placeholder="ServiceZap@2026"
                      value={formData.adminPassword}
                      onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                      className="h-9 bg-[#FAF7F4] border-[#DECDBB] text-xs font-mono mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-[#444]">Limite de Usuários</Label>
                    <Input
                      type="number"
                      min={1}
                      value={formData.maxUsers}
                      onChange={(e) => setFormData({ ...formData, maxUsers: parseInt(e.target.value) || 1 })}
                      className="h-9 bg-[#FAF7F4] border-[#DECDBB] text-xs mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* RODAPÉ E BOTÕES DE AÇÃO */}
          <div className="rounded-xl bg-white border border-[#DECDBB] p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5 text-xs text-[#555]">
              <div className="h-8 w-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-[#E8622C]">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <span className="font-medium">Plano selecionado: </span>
                <span className="font-bold text-[#2B2B2B]">{selectedPlan?.name}</span>
                <span className="text-[#888]"> • R$ {selectedPlan?.priceMonthly || 0}/mês</span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-9 px-4 border-[#DECDBB] text-[#555] text-xs hover:bg-[#FAF7F4]"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="h-9 px-6 bg-gradient-to-r from-[#F0806B] to-[#E8622C] text-white text-xs font-bold shadow-sm hover:brightness-105"
              >
                {loading ? (
                  <span className="flex items-center gap-1.5">
                    <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Cadastrando Empresa...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Cadastrar Empresa
                  </span>
                )}
              </Button>
            </div>
          </div>

        </form>

      </DialogContent>
    </Dialog>
  );
}
