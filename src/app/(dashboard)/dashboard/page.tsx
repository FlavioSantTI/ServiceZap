'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MetricCards } from '@/components/dashboard/metric-cards';
import { WhatsAppStatusCard } from '@/components/dashboard/whatsapp-status-card';
import { InvoiceTable } from '@/components/invoices/invoice-table';
import { PixModal } from '@/components/invoices/pix-modal';
import { ServiceReceiptModal } from '@/components/invoices/service-receipt-modal';
import { InvoiceDocument, InvoiceStatus } from '@/types/appwrite';
import {
  fetchInvoicesAction,
  updateInvoiceStatusAction,
  deleteInvoiceAction,
} from '@/app/actions/invoices';

export default function DashboardPage() {
  const [invoices, setInvoices] = useState<Partial<InvoiceDocument>[]>([]);
  const [selectedPixInvoice, setSelectedPixInvoice] = useState<Partial<InvoiceDocument> | null>(null);
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [selectedReceiptInvoice, setSelectedReceiptInvoice] = useState<Partial<InvoiceDocument> | null>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  const loadInvoices = useCallback(async () => {
    try {
      const data = await fetchInvoicesAction();
      setInvoices(data);
    } catch (err) {
      console.error('Erro ao carregar faturas:', err);
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
      }
    } catch (err) {
      console.error('Erro ao alterar status:', err);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm('Deseja excluir esta cobrança?')) return;
    try {
      const res = await deleteInvoiceAction(invoiceId);
      if (res.success) {
        await loadInvoices();
      }
    } catch (err) {
      console.error('Erro ao excluir fatura:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Painel de Controle
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Visão geral do faturamento, cobranças PIX, emissão de NF-e e mensagens WhatsApp.
        </p>
      </div>

      {/* Módulo 2: Metrics Cards (Preenchimento Dinâmico) */}
      <MetricCards invoices={invoices} />

      {/* WhatsApp Status Card */}
      <WhatsAppStatusCard />

      {/* Módulo 3: Faturas & Tabela de Cobranças */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Faturas & Cobranças Recentes
            </h2>
            <p className="text-xs text-slate-500">
              Gerencie suas cobranças, acompanhe pagamentos PIX e emissão de notas fiscais.
            </p>
          </div>
        </div>

        <InvoiceTable
          invoices={invoices}
          onSelectPix={handleSelectPix}
          onSelectReceipt={handleSelectReceipt}
          onStatusChange={handleStatusChange}
          onDeleteInvoice={handleDeleteInvoice}
        />
      </div>

      {/* Modal PIX Copia e Cola / QR Code */}
      <PixModal
        invoice={selectedPixInvoice}
        open={pixModalOpen}
        onOpenChange={setPixModalOpen}
      />

      {/* Modal Recibo de Serviço */}
      <ServiceReceiptModal
        invoice={selectedReceiptInvoice}
        open={receiptModalOpen}
        onOpenChange={setReceiptModalOpen}
      />
    </div>
  );
}
