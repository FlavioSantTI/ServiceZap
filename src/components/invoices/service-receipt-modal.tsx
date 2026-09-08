'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Printer,
  Send,
  Mail,
  CheckCircle2,
  Building2,
  User,
  Calendar,
  FileText,
  DollarSign,
  ShieldCheck,
  X,
  MessageSquare,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InvoiceDocument, TenantDocument } from '@/types/appwrite';
import { fetchTenantProfileAction } from '@/app/actions/tenant';
import { mockTenant } from '@/lib/mock-data';

interface ServiceReceiptModalProps {
  invoice: Partial<InvoiceDocument> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ServiceReceiptModal({
  invoice,
  open,
  onOpenChange,
}: ServiceReceiptModalProps) {
  const router = useRouter();
  const [tenant, setTenant] = useState<Partial<TenantDocument>>(mockTenant);
  const [emailSent, setEmailSent] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    async function loadTenant() {
      try {
        const data = await fetchTenantProfileAction();
        if (data && data.name) {
          setTenant(data);
        }
      } catch (err) {
        console.error('Erro ao carregar tenant no Recibo:', err);
      }
    }
    if (open) {
      loadTenant();
      setEmailSent(false);
    }
  }, [open]);

  if (!invoice) return null;

  const isPaid = invoice.status === 'paid';
  const receiptNumber = invoice.$id || `REC-${Math.floor(Math.random() * 90000 + 10000)}`;
  const formattedDate = invoice.dueDate
    ? new Date(invoice.dueDate).toLocaleDateString('pt-BR')
    : new Date().toLocaleDateString('pt-BR');
  const formattedAmount = (invoice.amount || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
  });

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = () => {
    const text =
      `🧾 *RECIBO DE PRESTAÇÃO DE SERVIÇO*\n\n` +
      `*Nº do Recibo:* ${receiptNumber}\n` +
      `*Prestador:* ${tenant.name || tenant.companyName || 'Empresa Prestadora'}\n` +
      `*Cliente:* ${invoice.clientName}\n` +
      `*Valor:* R$ ${formattedAmount}\n` +
      `*Status:* ${isPaid ? 'PAGO / QUITADO' : 'PENDENTE'}\n` +
      `*Descrição:* ${invoice.description || 'Prestação de Serviço'}\n\n` +
      `Obrigado pela preferência!`;

    const params = new URLSearchParams();
    if (invoice.clientName) params.set('clientName', invoice.clientName);
    params.set('text', text);

    onOpenChange(false);
    router.push(`/dashboard/whatsapp?${params.toString()}`);
  };

  const handleSendEmail = () => {
    setSendingEmail(true);
    setTimeout(() => {
      setSendingEmail(false);
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 4000);
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-h-[95vh] overflow-y-auto print:p-0 print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Header - Escondido na impressão */}
        <DialogHeader className="print:hidden pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#E8622C]" />
                <span>Recibo de Prestação de Serviço</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Documento de quitação simplificado para autônomos e clientes.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Toolbar de Ações - Escondido na Impressão */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 print:hidden text-xs">
          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrint}
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 rounded-lg border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold"
            >
              <Printer className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
              <span>Imprimir / PDF</span>
            </Button>

            <Button
              onClick={handleSendWhatsApp}
              size="sm"
              className="h-8 gap-1.5 bg-gradient-to-r from-[#F0806B] to-[#E8622C] hover:opacity-95 text-white rounded-xl text-xs font-bold shadow-sm shadow-orange-500/20"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Enviar WhatsApp</span>
            </Button>

            <Button
              onClick={handleSendEmail}
              disabled={sendingEmail}
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 rounded-xl border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-semibold"
            >
              <Mail className="h-3.5 w-3.5 text-[#E8622C]" />
              <span>{sendingEmail ? 'Enviando...' : 'Enviar por E-mail'}</span>
            </Button>
          </div>

          {emailSent && (
            <span className="text-xs text-[#E8622C] font-bold flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              E-mail enviado!
            </span>
          )}
        </div>

        {/* CORPO DO RECIBO (Imprimível em A4) */}
        <div className="p-6 bg-white text-[#2B2B2B] rounded-2xl border border-neutral-200 shadow-warm-sm space-y-6 print:border-none print:shadow-none print:p-0 print:w-full">
          {/* Topo do Recibo */}
          <div className="flex items-start justify-between border-b pb-4 border-neutral-200">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-[#2B2B2B] uppercase">
                {tenant.name || 'PRESTADOR DE SERVIÇOS'}
              </h2>
              {tenant.companyName && (
                <p className="text-xs text-neutral-500 font-medium">{tenant.companyName}</p>
              )}
              <p className="text-xs text-neutral-600 mt-1 font-mono">
                CNPJ/CPF: {tenant.document || '00.000.000/0001-00'}
              </p>
              {tenant.email && <p className="text-xs text-neutral-500">E-mail: {tenant.email}</p>}
              {tenant.phone && <p className="text-xs text-neutral-500">Tel/WhatsApp: {tenant.phone}</p>}
            </div>

            <div className="text-right space-y-1">
              <div className="inline-block bg-[#FAF6F2] text-[#2B2B2B] px-3 py-1 rounded-xl border border-neutral-200">
                <p className="text-[10px] text-neutral-500 uppercase font-bold">RECIBO Nº</p>
                <p className="text-sm font-extrabold font-mono">{receiptNumber}</p>
              </div>
              <div>
                {isPaid ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-orange-100 text-orange-800 border border-orange-300 uppercase tracking-wide">
                    ✓ QUITADO / PAGO
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300 uppercase tracking-wide">
                    PENDENTE
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Dados da Transação */}
          <div className="grid grid-cols-2 gap-4 bg-[#FAF6F2] p-4 rounded-xl border border-neutral-200">
            <div>
              <p className="text-[10px] font-bold uppercase text-neutral-400">Tomador / Cliente</p>
              <p className="text-sm font-extrabold text-[#2B2B2B] mt-0.5">{invoice.clientName}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase text-neutral-400">Valor do Recibo</p>
              <p className="text-xl font-black text-[#E8622C] mt-0.5">
                R$ {formattedAmount}
              </p>
            </div>
          </div>

          {/* Declaração Formal de Quitação */}
          <div className="space-y-3 text-xs leading-relaxed text-neutral-700 bg-white p-4 rounded-xl border border-neutral-200">
            <p>
              Recebi(emos) de <strong className="text-[#2B2B2B]">{invoice.clientName}</strong> a quantia de{' '}
              <strong className="text-[#E8622C]">R$ {formattedAmount}</strong> referente ao pagamento da prestação do(s) seguinte(s) serviço(s):
            </p>
            <div className="p-3 bg-[#FAF6F2] rounded-xl border border-neutral-200 font-medium text-[#2B2B2B]">
              {invoice.description || 'Serviços prestados conforme acerto comercial.'}
            </div>
            <p className="text-[11px] text-neutral-500 italic">
              {isPaid
                ? 'Para clareza e como prova de haver recebido a importância mencionada, firmo o presente recibo dando plena e geral quitação.'
                : 'Este recibo servirá como comprovante definitivo de quitação assim que o pagamento for compensado.'}
            </p>
          </div>

          {/* Rodapé e Assinatura */}
          <div className="pt-6 border-t border-slate-200 flex items-end justify-between text-xs">
            <div>
              <p className="text-slate-500 font-medium">Data de Emissão / Vencimento:</p>
              <p className="font-bold text-slate-800">{formattedDate}</p>
            </div>

            <div className="text-center w-64 border-t border-slate-400 pt-2 mt-8">
              <p className="font-bold text-slate-900">{tenant.name || 'Assinatura do Prestador'}</p>
              <p className="text-[10px] text-slate-500 uppercase">Prestador de Serviço</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
