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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-[#2B2B2B] via-[#38322E] to-[#2B2B2B] p-6 text-white shadow-warm-md border border-[#443C37]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-6 items-center px-2 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-[#E8622C] text-white">
              Assinatura & Planos
            </span>
            <span className="text-xs text-[#DECDBB]">Escalabilidade do seu Negócio</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Crown className="h-6 w-6 text-[#F0806B]" />
            Planos ServiceZap
          </h1>
          <p className="text-sm text-[#C8B8A6]">
            Escolha o plano ideal para a sua estrutura, libere novos módulos e aumente o limite de colaboradores da sua equipe.
          </p>
        </div>

        {/* Current Plan Badge */}
        <div className="rounded-xl border border-[#5C5046] bg-[#3E342D]/80 p-3.5 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-[#E8622C] flex items-center justify-center text-white font-bold">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#DECDBB]">Seu Plano Atual</div>
            <div className="text-base font-black text-white capitalize">{currentPlanId} Empresa</div>
          </div>
        </div>
      </div>

      {/* Cycle Toggle */}
      <div className="flex flex-col items-center justify-center space-y-2">
        <div className="inline-flex items-center rounded-xl bg-white p-1 border border-[#DECDBB] shadow-warm-xs">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={cn(
              'rounded-lg px-4 py-1.5 text-xs font-bold transition-all',
              billingCycle === 'monthly'
                ? 'bg-gradient-to-r from-[#F0806B] to-[#E8622C] text-white shadow-xs'
                : 'text-[#555555] hover:text-[#2B2B2B]'
            )}
          >
            Cobrança Mensal
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold transition-all',
              billingCycle === 'yearly'
                ? 'bg-gradient-to-r from-[#F0806B] to-[#E8622C] text-white shadow-xs'
                : 'text-[#555555] hover:text-[#2B2B2B]'
            )}
          >
            <span>Cobrança Anual</span>
            <span className="rounded-full bg-[#10B981] px-2 py-0.5 text-[10px] font-extrabold text-white">
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
                'relative flex flex-col rounded-2xl border bg-white p-6 shadow-warm-xs transition-all duration-300 hover:shadow-warm-md',
                isPopular
                  ? 'border-[#E8622C] ring-2 ring-[#E8622C]/30'
                  : 'border-[#DECDBB]',
                isCurrent && 'bg-[#FFFDFB]'
              )}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#F0806B] to-[#E8622C] px-3 py-0.5 text-[11px] font-black uppercase tracking-wider text-white shadow-warm-xs">
                  Mais Escolhido
                </div>
              )}

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-[#2B2B2B]">{plan.name}</h3>
                  {plan.badge && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-[#FFF3EE] text-[#E8622C] px-2 py-0.5 rounded-md">
                      {plan.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#666666] min-h-[36px]">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="mb-6 pb-6 border-b border-[#F2E8DE]">
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-bold text-[#777777]">R$</span>
                  <span className="text-3xl font-black text-[#2B2B2B]">
                    {price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs font-medium text-[#777777]">/mês</span>
                </div>
                {billingCycle === 'yearly' && plan.priceYearly > 0 && (
                  <div className="text-[11px] text-[#10B981] font-semibold mt-1">
                    Faturado anualmente R$ {plan.priceYearly.toFixed(2)}
                  </div>
                )}
              </div>

              {/* Features List */}
              <div className="flex-1 space-y-2.5 mb-6">
                <div className="text-xs font-bold text-[#8A503C] uppercase tracking-wider mb-2">
                  Incluso no Plano:
                </div>
                {plan.featureList.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-[#444444]">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#10B981] mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <div>
                {isCurrent ? (
                  <Button
                    disabled
                    className="w-full bg-[#FAF6F2] text-[#888888] border border-[#DECDBB] font-bold text-xs"
                  >
                    Plano Ativo
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleSelectUpgrade(plan)}
                    className={cn(
                      'w-full font-bold text-xs transition-all shadow-xs',
                      isPopular
                        ? 'bg-gradient-to-r from-[#F0806B] to-[#E8622C] text-white hover:brightness-105'
                        : 'bg-white border border-[#DECDBB] text-[#2B2B2B] hover:bg-[#FAF6F2]'
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
        <DialogContent className="max-w-md bg-[#FAF6F2] border-[#DECDBB] text-[#2B2B2B]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-[#2B2B2B]">
              <Sparkles className="h-5 w-5 text-[#E8622C]" />
              Upgrade para o Plano {selectedPlanForUpgrade?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#666666]">
              Aprovação instantânea de novos recursos e liberação imediata de limites para sua empresa.
            </DialogDescription>
          </DialogHeader>

          {selectedPlanForUpgrade && (
            <div className="space-y-4 py-2">
              <div className="rounded-xl border border-[#DECDBB] bg-white p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#8A503C] uppercase">Valor do Investimento</span>
                  <span className="text-xl font-black text-[#2B2B2B]">
                    R${' '}
                    {(billingCycle === 'yearly'
                      ? selectedPlanForUpgrade.priceYearly
                      : selectedPlanForUpgrade.priceMonthly
                    ).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="text-xs text-[#777777]">
                  Ciclo: {billingCycle === 'yearly' ? 'Anual (2 meses grátis)' : 'Mensal'}
                </div>
              </div>

              <div className="rounded-xl border border-[#DECDBB] bg-[#FFF3EE] p-4 text-xs text-[#8A503C] space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-[#E8622C]">
                  <QrCode className="h-4 w-4" /> Pagamento com Liberação Instantânea via PIX / Asaas
                </div>
                <p className="text-[#666666]">
                  Após a confirmação, seu limite de colaboradores será atualizado automaticamente para{' '}
                  <strong className="text-[#2B2B2B]">{selectedPlanForUpgrade.limits.maxUsers} assentos</strong> e todos os novos módulos serão habilitados.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsUpgradeModalOpen(false)}
              className="border-[#DECDBB] text-[#555555]"
            >
              Voltar
            </Button>
            <Button
              onClick={() => {
                alert('Solicitação de upgrade registrada com sucesso! Nossa equipe ou gateway gerou o link de pagamento.');
                setIsUpgradeModalOpen(false);
              }}
              className="bg-gradient-to-r from-[#F0806B] to-[#E8622C] text-white font-bold hover:brightness-105"
            >
              Confirmar Upgrade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
