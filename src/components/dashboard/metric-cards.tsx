'use client';

import React from 'react';
import { DollarSign, Clock, AlertTriangle, FileCheck2, ArrowUpRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { mockInvoices } from '@/lib/mock-data';

export function MetricCards() {
  const totalPaid = mockInvoices
    .filter((inv) => inv.status === 'paid')
    .reduce((acc, inv) => acc + (inv.amount || 0), 0);

  const totalPending = mockInvoices
    .filter((inv) => inv.status === 'pending')
    .reduce((acc, inv) => acc + (inv.amount || 0), 0);

  const totalOverdue = mockInvoices
    .filter((inv) => inv.status === 'overdue')
    .reduce((acc, inv) => acc + (inv.amount || 0), 0);

  const totalNfeIssued = mockInvoices.filter((inv) => inv.nfeStatus === 'authorized').length;

  const metrics = [
    {
      title: 'Receita Confirmada',
      value: `R$ ${totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      change: '+14% este mês',
      icon: DollarSign,
      iconBg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    },
    {
      title: 'A Receber (Pendente)',
      value: `R$ ${totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      change: `${mockInvoices.filter((inv) => inv.status === 'pending').length} faturas abertas`,
      icon: Clock,
      iconBg: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    },
    {
      title: 'Cobranças Atrasadas',
      value: `R$ ${totalOverdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      change: 'Requer atenção',
      icon: AlertTriangle,
      iconBg: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    },
    {
      title: 'NF-e Emitidas (Focus)',
      value: `${totalNfeIssued} Notas`,
      change: '100% integradas',
      icon: FileCheck2,
      iconBg: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((item, index) => {
        const Icon = item.icon;
        return (
          <Card key={index} className="border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {item.title}
                </span>
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${item.iconBg}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-3">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  {item.value}
                </h3>
                <div className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                  <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
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
