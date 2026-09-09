'use client';

import React from 'react';
import { DollarSign, Clock, AlertTriangle, FileCheck2, ArrowUpRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { InvoiceDocument } from '@/types/appwrite';

interface MetricCardsProps {
  invoices?: Partial<InvoiceDocument>[];
}

export function MetricCards({ invoices = [] }: MetricCardsProps) {
  const paidInvoices = invoices.filter((inv) => inv.status === 'paid');
  const pendingInvoices = invoices.filter((inv) => inv.status === 'pending');
  const overdueInvoices = invoices.filter((inv) => inv.status === 'overdue');
  const nfeAuthorized = invoices.filter((inv) => inv.nfeStatus === 'authorized');

  const totalPaid = paidInvoices.reduce((acc, inv) => acc + (inv.amount || 0), 0);
  const totalPending = pendingInvoices.reduce((acc, inv) => acc + (inv.amount || 0), 0);
  const totalOverdue = overdueInvoices.reduce((acc, inv) => acc + (inv.amount || 0), 0);
  const totalNfeIssued = nfeAuthorized.length;

  const metrics = [
    {
      title: 'Receita Confirmada (Paga)',
      value: `R$ ${totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      change: `${paidInvoices.length} faturas recebidas`,
      icon: DollarSign,
      iconBg: 'bg-orange-500/15 text-[#E8622C] border-orange-500/25',
    },
    {
      title: 'A Receber (Valor em Aberto)',
      value: `R$ ${totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      change: `${pendingInvoices.length} faturas abertas`,
      icon: Clock,
      iconBg: 'bg-amber-500/15 text-amber-600 border-amber-500/25',
    },
    {
      title: 'Cobranças Vencidas',
      value: `R$ ${totalOverdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      change: overdueInvoices.length > 0 ? `${overdueInvoices.length} em atraso` : 'Nenhum atraso',
      icon: AlertTriangle,
      iconBg: 'bg-red-500/15 text-red-600 border-red-500/25',
    },
    {
      title: 'NF-e Emitidas (Focus)',
      value: `${totalNfeIssued} Notas`,
      change: '100% integradas',
      icon: FileCheck2,
      iconBg: 'bg-[#F0806B]/20 text-[#E8622C] border-[#F0806B]/30',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((item, index) => {
        const Icon = item.icon;
        return (
          <Card key={index} className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm hover:shadow-warm-sm transition-all duration-200">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                  {item.title}
                </span>
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${item.iconBg}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-3">
                <h3 className="text-2xl font-extrabold text-[#2B2B2B] dark:text-[#FAF6F2] tracking-tight">
                  {item.value}
                </h3>
                <div className="mt-1 flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                  <ArrowUpRight className="h-3.5 w-3.5 text-[#E8622C]" />
                  <span>{item.change}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
