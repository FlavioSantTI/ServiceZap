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
import { Switch } from '@/components/ui/switch';
import { Crown, Sparkles, CheckCircle2, ShieldCheck, Plus, Trash2 } from 'lucide-react';
import { saveSaasPlanAction } from '@/app/actions/super-admin';
import { PlanDefinition } from '@/lib/constants/plans';

interface PlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: PlanDefinition | null;
  onSuccess?: () => void;
}

export function PlanDialog({ open, onOpenChange, plan, onSuccess }: PlanDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    badge: '',
    description: '',
    popular: false,
    priceMonthly: 99.9,
    priceYearly: 990.0,
    maxUsers: 5,
    maxAppointmentsPerMonth: 0, // 0 = ilimitado
    maxWorkOrdersPerMonth: 0,
    maxClients: 2000,
    maxWhatsAppInstances: 1,
    hasNfe: true,
    hasWhatsAppBroadcast: true,
    hasAuditLogs: true,
    hasCustomPdfBranding: true,
    hasMultipleAttendants: true,
    hasFinancialReports: true,
    hasApiAccess: false,
    featureList: [
      'Controle de Equipe e Colaboradores',
      'Emissão de Nota Fiscal Automática',
      'Trilha de Auditoria Completa',
    ],
  });

  const [newBullet, setNewBullet] = useState('');

  useEffect(() => {
    if (plan) {
      setFormData({
        id: plan.id,
        name: plan.name,
        badge: plan.badge || '',
        description: plan.description,
        popular: !!plan.popular,
        priceMonthly: plan.priceMonthly,
        priceYearly: plan.priceYearly,
        maxUsers: plan.limits.maxUsers === Infinity ? 0 : plan.limits.maxUsers,
        maxAppointmentsPerMonth: plan.limits.maxAppointmentsPerMonth === Infinity ? 0 : plan.limits.maxAppointmentsPerMonth,
        maxWorkOrdersPerMonth: plan.limits.maxWorkOrdersPerMonth === Infinity ? 0 : plan.limits.maxWorkOrdersPerMonth,
        maxClients: plan.limits.maxClients === Infinity ? 0 : plan.limits.maxClients,
        maxWhatsAppInstances: plan.limits.maxWhatsAppInstances || 1,
        hasNfe: !!plan.features.hasNfe,
        hasWhatsAppBroadcast: !!plan.features.hasWhatsAppBroadcast,
        hasAuditLogs: !!plan.features.hasAuditLogs,
        hasCustomPdfBranding: !!plan.features.hasCustomPdfBranding,
        hasMultipleAttendants: !!plan.features.hasMultipleAttendants,
        hasFinancialReports: !!plan.features.hasFinancialReports,
        hasApiAccess: !!plan.features.hasApiAccess,
        featureList: plan.featureList || [],
      });
    } else {
      setFormData({
        id: '',
        name: '',
        badge: '',
        description: '',
        popular: false,
        priceMonthly: 49.9,
        priceYearly: 490.0,
        maxUsers: 3,
        maxAppointmentsPerMonth: 0,
        maxWorkOrdersPerMonth: 0,
        maxClients: 500,
        maxWhatsAppInstances: 1,
        hasNfe: false,
        hasWhatsAppBroadcast: false,
        hasAuditLogs: false,
        hasCustomPdfBranding: true,
        hasMultipleAttendants: false,
        hasFinancialReports: true,
        hasApiAccess: false,
        featureList: [
          'Agendamentos & O.S. Ilimitados',
          'Cobrança PIX com QR Code dinâmico',
          'Lembretes automáticos no WhatsApp',
        ],
      });
    }
  }, [plan, open]);

  const handleAddBullet = () => {
    if (newBullet.trim()) {
      setFormData((prev) => ({
        ...prev,
        featureList: [...prev.featureList, newBullet.trim()],
      }));
      setNewBullet('');
    }
  };

  const handleRemoveBullet = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      featureList: prev.featureList.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!formData.name || !formData.description) {
        throw new Error('Preencha os campos obrigatórios: Nome e Descrição.');
      }

      const planId = formData.id
        ? formData.id.toLowerCase().trim().replace(/\s+/g, '_')
        : formData.name.toLowerCase().trim().replace(/\s+/g, '_');

      const payload = {
        id: planId,
        name: formData.name,
        badge: formData.badge,
        description: formData.description,
        popular: formData.popular,
        priceMonthly: Number(formData.priceMonthly),
        priceYearly: Number(formData.priceYearly),
        limits: {
          maxUsers: formData.maxUsers === 0 ? Infinity : Number(formData.maxUsers),
          maxAppointmentsPerMonth: formData.maxAppointmentsPerMonth === 0 ? Infinity : Number(formData.maxAppointmentsPerMonth),
          maxWorkOrdersPerMonth: formData.maxWorkOrdersPerMonth === 0 ? Infinity : Number(formData.maxWorkOrdersPerMonth),
          maxClients: formData.maxClients === 0 ? Infinity : Number(formData.maxClients),
          maxWhatsAppInstances: Number(formData.maxWhatsAppInstances) || 1,
        },
        features: {
          hasNfe: formData.hasNfe,
          hasWhatsAppBroadcast: formData.hasWhatsAppBroadcast,
          hasAuditLogs: formData.hasAuditLogs,
          hasCustomPdfBranding: formData.hasCustomPdfBranding,
          hasMultipleAttendants: formData.hasMultipleAttendants,
          hasFinancialReports: formData.hasFinancialReports,
          hasApiAccess: formData.hasApiAccess,
        },
        featureList: formData.featureList,
      };

      const res = await saveSaasPlanAction(payload);
      if (!res.success) {
        throw new Error(res.error || 'Erro ao salvar plano.');
      }

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar plano');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#FAF6F2] border-[#DECDBB] text-[#2B2B2B] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-[#2B2B2B]">
            <Crown className="h-5 w-5 text-[#E8622C]" />
            {plan ? `Editar Plano: ${plan.name}` : 'Cadastrar Novo Plano SaaS'}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#666666]">
            Configure preços, limites de assentos e funcionalidades habilitadas para este plano.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Dados Gerais & Preços */}
          <div className="rounded-xl border border-[#DECDBB] bg-white p-4 space-y-3">
            <h4 className="text-xs font-bold text-[#E8622C] uppercase tracking-wider flex items-center gap-1.5">
              <Crown className="h-4 w-4" /> 1. Identificação e Preços
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#444444]">Nome do Plano *</Label>
                <Input
                  required
                  placeholder="Ex: Pro Empresa / Solo"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-[#FAF6F2] border-[#DECDBB]"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#444444]">Badge em Destaque (Opcional)</Label>
                <Input
                  placeholder="Ex: Mais Popular / 14 Dias Grátis"
                  value={formData.badge}
                  onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                  className="bg-[#FAF6F2] border-[#DECDBB]"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <Label className="text-xs font-semibold text-[#444444]">Descrição Comercial *</Label>
                <Input
                  required
                  placeholder="Ex: Ideal para empresas e clínicas com equipe e emissão de notas."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-[#FAF6F2] border-[#DECDBB]"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#444444]">Preço Mensal (R$)</Label>
                <Input
                  type="number"
                  step="0.10"
                  min="0"
                  value={formData.priceMonthly}
                  onChange={(e) => setFormData({ ...formData, priceMonthly: parseFloat(e.target.value) || 0 })}
                  className="bg-[#FAF6F2] border-[#DECDBB]"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#444444]">Preço Anual (R$ Total)</Label>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  value={formData.priceYearly}
                  onChange={(e) => setFormData({ ...formData, priceYearly: parseFloat(e.target.value) || 0 })}
                  className="bg-[#FAF6F2] border-[#DECDBB]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 md:col-span-2">
                <Switch
                  checked={formData.popular}
                  onCheckedChange={(val: boolean) => setFormData({ ...formData, popular: val })}
                />
                <span className="text-xs font-semibold text-[#2B2B2B]">
                  Destacar este plano como &quot;Mais Escolhido / Mais Popular&quot; na tabela pública
                </span>
              </div>
            </div>
          </div>

          {/* Limites Numéricos */}
          <div className="rounded-xl border border-[#DECDBB] bg-white p-4 space-y-3">
            <h4 className="text-xs font-bold text-[#E8622C] uppercase tracking-wider">
              2. Limites do Plano (Defina 0 para Ilimitado)
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#444444]">Máx Colaboradores</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.maxUsers}
                  onChange={(e) => setFormData({ ...formData, maxUsers: parseInt(e.target.value) || 0 })}
                  className="bg-[#FAF6F2] border-[#DECDBB]"
                />
                <span className="text-[10px] text-[#777777]">0 = Ilimitado</span>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#444444]">Máx Clientes CRM</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.maxClients}
                  onChange={(e) => setFormData({ ...formData, maxClients: parseInt(e.target.value) || 0 })}
                  className="bg-[#FAF6F2] border-[#DECDBB]"
                />
                <span className="text-[10px] text-[#777777]">0 = Ilimitado</span>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#444444]">Máx Linhas WhatsApp</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.maxWhatsAppInstances}
                  onChange={(e) => setFormData({ ...formData, maxWhatsAppInstances: parseInt(e.target.value) || 1 })}
                  className="bg-[#FAF6F2] border-[#DECDBB]"
                />
              </div>
            </div>
          </div>

          {/* Módulos Habilitados (Features) */}
          <div className="rounded-xl border border-[#DECDBB] bg-white p-4 space-y-3">
            <h4 className="text-xs font-bold text-[#E8622C] uppercase tracking-wider">
              3. Módulos & Recursos Habilitados
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <label className="flex items-center gap-2 p-2 rounded-lg bg-[#FAF6F2] cursor-pointer">
                <Switch
                  checked={formData.hasNfe}
                  onCheckedChange={(val: boolean) => setFormData({ ...formData, hasNfe: val })}
                />
                <span>Emissão de Nota Fiscal (Focus NFe)</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-[#FAF6F2] cursor-pointer">
                <Switch
                  checked={formData.hasWhatsAppBroadcast}
                  onCheckedChange={(val: boolean) => setFormData({ ...formData, hasWhatsAppBroadcast: val })}
                />
                <span>Disparo em Lote no WhatsApp</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-[#FAF6F2] cursor-pointer">
                <Switch
                  checked={formData.hasAuditLogs}
                  onCheckedChange={(val: boolean) => setFormData({ ...formData, hasAuditLogs: val })}
                />
                <span>Trilha de Auditoria de Ações</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-[#FAF6F2] cursor-pointer">
                <Switch
                  checked={formData.hasFinancialReports}
                  onCheckedChange={(val: boolean) => setFormData({ ...formData, hasFinancialReports: val })}
                />
                <span>Relatórios Financeiros & DRE</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-[#FAF6F2] cursor-pointer">
                <Switch
                  checked={formData.hasCustomPdfBranding}
                  onCheckedChange={(val: boolean) => setFormData({ ...formData, hasCustomPdfBranding: val })}
                />
                <span>PDFs com Logo Customizada</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-[#FAF6F2] cursor-pointer">
                <Switch
                  checked={formData.hasApiAccess}
                  onCheckedChange={(val: boolean) => setFormData({ ...formData, hasApiAccess: val })}
                />
                <span>Acesso a Webhooks & API</span>
              </label>
            </div>
          </div>

          {/* Lista de Benefícios (Bullets) */}
          <div className="rounded-xl border border-[#DECDBB] bg-white p-4 space-y-2.5">
            <h4 className="text-xs font-bold text-[#E8622C] uppercase tracking-wider">
              4. Benefícios Visíveis nos Cards
            </h4>

            <div className="flex gap-2">
              <Input
                placeholder="Adicionar novo benefício..."
                value={newBullet}
                onChange={(e) => setNewBullet(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddBullet();
                  }
                }}
                className="bg-[#FAF6F2] border-[#DECDBB] text-xs"
              />
              <Button
                type="button"
                onClick={handleAddBullet}
                variant="outline"
                size="sm"
                className="border-[#DECDBB] text-[#E8622C]"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto pt-1">
              {formData.featureList.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-1.5 rounded-lg bg-[#FAF6F2] text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#10B981] shrink-0" />
                    <span>{item}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveBullet(idx)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
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
              {loading ? 'Salvando...' : 'Salvar Plano'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
