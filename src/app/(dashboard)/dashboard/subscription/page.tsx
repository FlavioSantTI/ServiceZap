'use client';

import React, { useEffect, useState } from 'react';
import {
  Crown,
  CheckCircle2,
  Zap,
  ShieldCheck,
  CreditCard,
  QrCode,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Clock,
  PhoneCall,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SAAS_PLANS, PlanDefinition } from '@/lib/constants/plans';
import { fetchTenantProfileAction } from '@/app/actions/tenant';
import { fetchSaasPlansAction } from '@/app/actions/super-admin';
import { cn } from '@/lib/utils';

export default function SubscriptionPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [tenantProfile, setTenantProfile] = useState<any>(null);
  const [plansList, setPlansList] = useState<PlanDefinition[]>(Object.values(SAAS_PLANS));
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState<PlanDefinition | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchTenantProfileAction(),
      fetchSaasPlansAction(),
    ]).then(([profile, plans]) => {
      if (profile) setTenantProfile(profile);
      if (plans && plans.length > 0) setPlansList(plans);
    });
  }, []);

  const currentPlanId = tenantProfile?.plan || 'pro';

  const handleSelectUpgrade = (plan: PlanDefinition) => {
    setSelectedPlanForUpgrade(plan);
    setIsUpgradeModalOpen(true);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl bg-card p-6 text-foreground shadow-warm-md border border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-6 items-center px-2 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-primary text-primary-foreground">
              Assinatura &amp; Planos
            </span>
            <span className="text-xs text-muted-foreground">Escalabilidade do seu Negócio</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Crown className="h-6 w-6 text-primary" />
            Planos ServiceZap
          </h1>
          <p className="text-sm text-muted-foreground">
            Escolha o plano ideal para a sua estrutura, libere novos módulos e aumente o limite de colaboradores da sua equipe.
          </p>
        </div>

        {/* Current Plan Badge */}
        <div className="rounded-xl border border-border bg-muted/60 p-3.5 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Seu Plano Atual</div>
            <div className="text-base font-black text-foreground capitalize">{currentPlanId} Empresa</div>
          </div>
        </div>
      </div>

      {/* Cycle Toggle */}
      <div className="flex flex-col items-center justify-center space-y-2">
        <div className="inline-flex items-center rounded-xl bg-muted p-1 border border-border shadow-warm-xs">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={cn(
              'rounded-lg px-4 py-1.5 text-xs font-bold transition-all',
              billingCycle === 'monthly'
                ? 'bg-card text-foreground shadow-xs border border-border/50'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Cobrança Mensal
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold transition-all',
              billingCycle === 'yearly'
                ? 'bg-card text-foreground shadow-xs border border-border/50'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <span>Cobrança Anual</span>
            <span className="rounded-full bg-primary/20 text-primary px-2 py-0.5 text-[10px] font-extrabold">
              2 Meses Grátis
            </span>
          </button>
        </div>
      </div>

      {/* Plans Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plansList.map((plan) => {
          const isCurrent = plan.id === currentPlanId;
          const isPopular = plan.popular;
          const price = billingCycle === 'yearly' ? plan.priceYearly / 12 : plan.priceMonthly;

          return (
            <div
              key={plan.id}
              className={cn(
                'relative flex flex-col rounded-2xl border bg-card p-6 shadow-warm-xs transition-all duration-300 hover:shadow-warm-md',
                isPopular
                  ? 'border-primary ring-2 ring-primary/30'
                  : 'border-border',
                isCurrent && 'bg-card/90'
              )}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[11px] font-black uppercase tracking-wider text-primary-foreground shadow-warm-xs">
                  Mais Escolhido
                </div>
              )}

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-foreground">{plan.name}</h3>
                  {plan.badge && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                      {plan.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground min-h-[36px]">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="mb-6 pb-6 border-b border-border">
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-bold text-muted-foreground">R$</span>
                  <span className="text-3xl font-black text-foreground">
                    {price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">/mês</span>
                </div>
                {billingCycle === 'yearly' && plan.priceYearly > 0 && (
                  <div className="text-[11px] text-primary font-semibold mt-1">
                    Faturado anualmente R$ {plan.priceYearly.toFixed(2)}
                  </div>
                )}
              </div>

              {/* Features List */}
              <div className="flex-1 space-y-2.5 mb-6">
                <div className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                  Incluso no Plano:
                </div>
                {plan.featureList.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <div>
                {isCurrent ? (
                  <Button
                    disabled
                    className="w-full bg-muted text-muted-foreground border border-border font-bold text-xs"
                  >
                    Plano Ativo
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleSelectUpgrade(plan)}
                    className={cn(
                      'w-full font-bold text-xs transition-all shadow-xs',
                      isPopular
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'bg-card border border-border text-foreground hover:bg-muted'
                    )}
                  >
                    {plan.priceMonthly > (SAAS_PLANS[currentPlanId]?.priceMonthly || 0)
                      ? 'Fazer Upgrade'
                      : 'Selecionar Plano'}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Upgrade Checkout Dialog */}
      <Dialog open={isUpgradeModalOpen} onOpenChange={setIsUpgradeModalOpen}>
        <DialogContent className="max-w-md bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
              <Sparkles className="h-5 w-5 text-primary" />
              Upgrade para o Plano {selectedPlanForUpgrade?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Aprovação instantânea de novos recursos e liberação imediata de limites para sua empresa.
            </DialogDescription>
          </DialogHeader>

          {selectedPlanForUpgrade && (
            <div className="space-y-4 py-2">
              <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground uppercase">Valor do Investimento</span>
                  <span className="text-xl font-black text-foreground">
                    R${' '}
                    {(billingCycle === 'yearly'
                      ? selectedPlanForUpgrade.priceYearly
                      : selectedPlanForUpgrade.priceMonthly
                    ).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Ciclo: {billingCycle === 'yearly' ? 'Anual (2 meses grátis)' : 'Mensal'}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-muted/50 p-4 text-xs text-foreground space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-primary">
                  <QrCode className="h-4 w-4" /> Pagamento com Liberação Instantânea via PIX / Asaas
                </div>
                <p className="text-muted-foreground">
                  Após a confirmação, seu limite de colaboradores será atualizado automaticamente para{' '}
                  <strong className="text-foreground">{selectedPlanForUpgrade.limits.maxUsers} assentos</strong> e todos os novos módulos serão habilitados.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsUpgradeModalOpen(false)}
              className="border-border text-muted-foreground hover:text-foreground"
            >
              Voltar
            </Button>
            <Button
              onClick={() => {
                alert('Solicitação de upgrade registrada com sucesso! Nossa equipe ou gateway gerou o link de pagamento.');
                setIsUpgradeModalOpen(false);
              }}
              className="bg-primary text-primary-foreground font-bold hover:bg-primary/90"
            >
              Confirmar Upgrade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
