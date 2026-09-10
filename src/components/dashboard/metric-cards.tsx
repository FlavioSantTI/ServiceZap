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
      iconBg: 'bg-primary/15 text-primary border-primary/25',
    },
    {
      title: 'A Receber (Valor em Aberto)',
      value: `R$ ${totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      change: `${pendingInvoices.length} faturas abertas`,
      icon: Clock,
      iconBg: 'bg-muted text-foreground border-border',
    },
    {
      title: 'Cobranças Vencidas',
      value: `R$ ${totalOverdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      change: overdueInvoices.length > 0 ? `${overdueInvoices.length} em atraso` : 'Nenhum atraso',
      icon: AlertTriangle,
      iconBg: 'bg-rose-500/15 text-rose-700 border-rose-500/25',
    },
    {
      title: 'NF-e Emitidas (Focus)',
      value: `${totalNfeIssued} Notas`,
      change: '100% integradas',
      icon: FileCheck2,
      iconBg: 'bg-primary/15 text-primary border-primary/25',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((item, index) => {
        const Icon = item.icon;
        return (
          <Card 
            key={index} 
            className="rounded-2xl border border-border bg-card shadow-warm-xs hover:shadow-warm-sm transition-all duration-200 cursor-pointer group"
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {item.title}
                </span>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-transform duration-200 group-hover:scale-105 ${item.iconBg}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-3">
                <h3 className="text-2xl font-black text-foreground tracking-tight">
                  {item.value}
                </h3>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <ArrowUpRight className="h-3.5 w-3.5 text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  <span className="font-semibold">{item.change}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
