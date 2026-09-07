'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Receipt, DollarSign, Clock, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { InvoiceTable } from '@/components/invoices/invoice-table';
import { PixModal } from '@/components/invoices/pix-modal';
import { CreateInvoiceDialog } from '@/components/invoices/create-invoice-dialog';
import { ServiceReceiptModal } from '@/components/invoices/service-receipt-modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { InvoiceDocument, InvoiceStatus } from '@/types/appwrite';
import {
  fetchInvoicesAction,
  updateInvoiceStatusAction,
  deleteInvoiceAction,
} from '@/app/actions/invoices';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Partial<InvoiceDocument>[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPixInvoice, setSelectedPixInvoice] = useState<Partial<InvoiceDocument> | null>(null);
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [selectedReceiptInvoice, setSelectedReceiptInvoice] = useState<Partial<InvoiceDocument> | null>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchInvoicesAction();
      setInvoices(data);
    } catch (err) {
      console.error('Erro ao carregar faturas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const handleSelectPix = (invoice: Partial<InvoiceDocument>) => {
    setSelectedPixInvoice(invoice);
    setPixModalOpen(true);
  };

  const handleSelectReceipt = (invoice: Partial<InvoiceDocument>) => {
    setSelectedReceiptInvoice(invoice);
    setReceiptModalOpen(true);
  };

  const handleStatusChange = async (invoiceId: string, status: InvoiceStatus) => {
    try {
      const res = await updateInvoiceStatusAction(invoiceId, status);
      if (res.success) {
        await loadInvoices();
      } else {
        alert(`Erro ao atualizar status: ${res.error}`);
      }
    } catch (err: any) {
      console.error('Erro ao atualizar status da fatura:', err);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    const confirmed = window.confirm('Tem certeza que deseja cancelar/excluir esta cobrança?');
    if (!confirmed) return;

    try {
      const res = await deleteInvoiceAction(invoiceId);
      if (res.success) {
        await loadInvoices();
      } else {
        alert(`Erro ao excluir fatura: ${res.error}`);
      }
    } catch (err: any) {
      console.error('Erro ao excluir fatura:', err);
    }
  };

  // Cálculo de Métricas Financeiras
  const totalAmount = invoices.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const paidAmount = invoices
    .filter((inv) => inv.status === 'paid')
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const pendingAmount = invoices
    .filter((inv) => inv.status === 'pending')
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const overdueAmount = invoices
    .filter((inv) => inv.status === 'overdue')
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Title Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Faturas & Gestão de Cobranças
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Controle os recebimentos PIX, acompanhe cobranças pendentes e gerencie emissão de Notas Fiscais.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={loadInvoices}
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 text-xs rounded-xl"
            title="Atualizar lista"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </Button>

          <Button
            onClick={() => setCreateInvoiceOpen(true)}
            size="sm"
            className="h-9 gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Cobrança</span>
          </Button>
        </div>
      </div>

      {/* Cards de Métricas Financeiras */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Faturado</p>
              <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <Receipt className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Recebido (Pago)</p>
              <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                R$ {paidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">A Receber (Pendente)</p>
              <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                R$ {pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Vencido</p>
              <p className="text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
                R$ {overdueAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Component */}
      <InvoiceTable
        invoices={invoices}
        onSelectPix={handleSelectPix}
        onSelectReceipt={handleSelectReceipt}
        onStatusChange={handleStatusChange}
        onDeleteInvoice={handleDeleteInvoice}
      />

      {/* Modal PIX QR Code */}
      <PixModal
        invoice={selectedPixInvoice}
        open={pixModalOpen}
        onOpenChange={setPixModalOpen}
      />

      {/* Modal Recibo de Serviço (PDF/Print/WhatsApp/E-mail) */}
      <ServiceReceiptModal
        invoice={selectedReceiptInvoice}
        open={receiptModalOpen}
        onOpenChange={setReceiptModalOpen}
      />

      {/* Modal Nova Cobrança */}
      <CreateInvoiceDialog
        open={createInvoiceOpen}
        onOpenChange={setCreateInvoiceOpen}
        onInvoiceCreated={loadInvoices}
      />
    </div>
  );
}
