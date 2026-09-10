'use client';

import React, { useEffect, useState } from 'react';
import {
  Crown,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Sparkles,
  Users,
  MessageSquare,
  FileCheck2,
  RefreshCw,
  Shield,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchSaasPlansAction, deleteSaasPlanAction } from '@/app/actions/super-admin';
import { PlanDefinition } from '@/lib/constants/plans';
import { PlanDialog } from '@/components/super-admin/plan-dialog';
import { cn } from '@/lib/utils';

export default function SuperAdminPlansPage() {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<PlanDefinition[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PlanDefinition | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const data = await fetchSaasPlansAction();
      setPlans(data);
    } catch (e) {
      console.error('Erro ao carregar planos:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleEdit = (plan: PlanDefinition) => {
    setSelectedPlan(plan);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedPlan(null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (plan: PlanDefinition) => {
    if (confirm(`Deseja realmente excluir o plano ${plan.name}?`)) {
      try {
        await deleteSaasPlanAction(plan.id);
        await loadPlans();
      } catch (e) {
        console.error('Erro ao excluir plano:', e);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Crown className="h-6 w-6 text-primary" />
            Catálogo & Precificação de Planos SaaS
          </h1>
          <p className="text-xs text-muted-foreground">
            Cadastre novos degraus de planos, defina valores mensais/anuais, limites numéricos e recursos liberados.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadPlans}
            disabled={loading}
            className="border-border text-foreground hover:bg-muted font-semibold rounded-xl cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button
            onClick={handleCreate}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-warm-xs rounded-xl cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Novo Plano
          </Button>
        </div>
      </div>

      {/* Grid de Planos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-16 text-sm text-muted-foreground">
            Carregando planos cadastrados...
          </div>
        ) : plans.length === 0 ? (
          <div className="col-span-full text-center py-16 text-sm text-muted-foreground">
            Nenhum plano cadastrado. Clique em &quot;Novo Plano&quot; para iniciar.
          </div>
        ) : (
          plans.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                'relative flex flex-col rounded-2xl border bg-card p-6 shadow-warm-xs transition-all duration-200 hover:shadow-warm-sm',
                plan.popular ? 'border-primary ring-2 ring-primary/20' : 'border-border'
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary-foreground shadow-warm-xs">
                  Mais Popular
                </div>
              )}

              {/* Title & Badge */}
              <div className="space-y-1 mb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-foreground">{plan.name}</h3>
                  {plan.badge && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/15 text-primary px-2 py-0.5 rounded-md border border-primary/20">
                      {plan.badge}
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-mono text-muted-foreground">ID: {plan.id}</div>
                <p className="text-xs text-muted-foreground min-h-[36px] mt-1">{plan.description}</p>
              </div>

              {/* Pricing */}
              <div className="mb-4 pb-4 border-b border-border">
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-bold text-muted-foreground">R$</span>
                  <span className="text-3xl font-black text-foreground">
                    {Number(plan.priceMonthly).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">/mês</span>
                </div>
                {plan.priceYearly > 0 && (
                  <div className="text-[11px] text-emerald-700 font-semibold mt-1">
                    Anual: R$ {Number(plan.priceYearly).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                )}
              </div>

              {/* Limits Highlights */}
              <div className="rounded-xl bg-muted/50 p-3 mb-4 space-y-1.5 text-xs border border-border">
                <div className="flex items-center justify-between text-foreground">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Users className="h-3.5 w-3.5 text-primary" /> Colaboradores:
                  </span>
                  <span className="font-bold">
                    {plan.limits?.maxUsers === Infinity || plan.limits?.maxUsers === 0 ? 'Ilimitado' : `${plan.limits?.maxUsers} users`}
                  </span>
                </div>

                <div className="flex items-center justify-between text-foreground">
                  <span className="flex items-center gap-1.5 font-medium">
                    <MessageSquare className="h-3.5 w-3.5 text-emerald-600" /> Linhas WhatsApp:
                  </span>
                  <span className="font-bold">{plan.limits?.maxWhatsAppInstances || 1}</span>
                </div>

                <div className="flex items-center justify-between text-foreground">
                  <span className="flex items-center gap-1.5 font-medium">
                    <FileCheck2 className="h-3.5 w-3.5 text-amber-600" /> NF-e Automática:
                  </span>
                  <span className="font-bold">
                    {plan.features?.hasNfe ? 'Sim' : 'Não'}
                  </span>
                </div>
              </div>

              {/* Bullets */}
              <div className="flex-1 space-y-1.5 mb-6">
                {(plan.featureList || []).slice(0, 4).map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 mt-0.5" />
                    <span className="truncate">{feat}</span>
                  </div>
                ))}
              </div>

              {/* Actions Buttons */}
              <div className="flex gap-2 pt-2 border-t border-border">
                <Button
                  onClick={() => handleEdit(plan)}
                  variant="outline"
                  size="sm"
                  className="flex-1 border-border text-foreground hover:text-primary hover:bg-primary/10 text-xs font-bold rounded-xl cursor-pointer"
                >
                  <Edit2 className="h-3.5 w-3.5 mr-1" /> Editar
                </Button>
                <Button
                  onClick={() => handleDelete(plan)}
                  variant="outline"
                  size="sm"
                  className="border-border text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 text-xs rounded-xl cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <PlanDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        plan={selectedPlan}
        onSuccess={loadPlans}
      />
    </div>
  );
}
