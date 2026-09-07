'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { WorkOrderDocument } from '@/types/appwrite';
import {
  updateWorkOrderStatusAction,
  convertWorkOrderToInvoiceAction,
} from '@/app/actions/work-orders';
import {
  FileText,
  ClipboardList,
  Printer,
  Share2,
  CheckCircle2,
  Zap,
  Loader2,
  Calendar,
  User,
  DollarSign,
  Clock,
  Send,
} from 'lucide-react';
import { mockTenant } from '@/lib/mock-data';

interface WorkOrderDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workOrder: Partial<WorkOrderDocument> | null;
  onUpdated: () => void;
}

export function WorkOrderDetailsModal({
  open,
  onOpenChange,
  workOrder,
  onUpdated,
}: WorkOrderDetailsModalProps) {
  const [isLoadingAction, setIsLoadingAction] = useState<boolean>(false);

  if (!workOrder) return null;

  const isQuote = workOrder.type === 'quote';

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const text = isQuote
      ? `Olá ${workOrder.clientName}! 👋🏼\n\nSegue a proposta de orçamento *${workOrder.number}* da *${mockTenant.name}*:\n\n📌 *Serviço:* ${workOrder.serviceName}\n💰 *Valor Total:* R$ ${workOrder.amount?.toFixed(2)}\n📅 *Validade:* ${workOrder.dueDate || '7 dias'}\n\nAguardamos sua aprovação!`
      : `Olá ${workOrder.clientName}! 👋🏼\n\nSua Ordem de Serviço *${workOrder.number}* da *${mockTenant.name}* foi atualizada.\n\n📌 *Serviço:* ${workOrder.serviceName}\n📊 *Status:* ${workOrder.status}\n💰 *Valor:* R$ ${workOrder.amount?.toFixed(2)}`;

    const encodedText = encodeURIComponent(text);
    const rawPhone = workOrder.clientPhone
      ? workOrder.clientPhone.replace(/\D/g, '')
      : '';
    const whatsappUrl = rawPhone
      ? `https://wa.me/55${rawPhone}?text=${encodedText}`
      : `https://wa.me/?text=${encodedText}`;

    window.open(whatsappUrl, '_blank');
  };

  const handleApproveQuote = async () => {
    setIsLoadingAction(true);
    try {
      if (workOrder.$id) {
        await updateWorkOrderStatusAction(workOrder.$id, 'approved', 'work_order');
        onUpdated();
        onOpenChange(false);
      }
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleCompleteOS = async () => {
    setIsLoadingAction(true);
    try {
      if (workOrder.$id) {
        await updateWorkOrderStatusAction(workOrder.$id, 'completed');
        onUpdated();
      }
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleGenerateInvoice = async () => {
    if (!workOrder.$id) return;
    setIsLoadingAction(true);
    try {
      const res = await convertWorkOrderToInvoiceAction(workOrder.$id, {
        clientName: workOrder.clientName || 'Cliente',
        amount: workOrder.amount || 0,
        serviceName: workOrder.serviceName || 'Serviço Prestado',
      });

      if (res.success) {
        onUpdated();
        onOpenChange(false);
      }
    } finally {
      setIsLoadingAction(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] bg-slate-900 text-slate-100 border-slate-800 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-slate-800/80 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isQuote ? (
                <FileText className="w-5 h-5 text-amber-400" />
              ) : (
                <ClipboardList className="w-5 h-5 text-indigo-400" />
              )}
              <DialogTitle className="text-xl font-bold text-slate-100">
                {isQuote ? 'Orçamento' : 'Ordem de Serviço'}: {workOrder.number}
              </DialogTitle>
            </div>

            <Badge
              className={
                workOrder.status === 'approved' || workOrder.status === 'completed'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : workOrder.status === 'in_execution'
                  ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                  : workOrder.status === 'billed'
                  ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              }
            >
              {workOrder.status === 'quote_sent' && 'Proposta Enviada'}
              {workOrder.status === 'approved' && 'Aprovado'}
              {workOrder.status === 'in_execution' && 'Em Execução'}
              {workOrder.status === 'completed' && 'Concluído'}
              {workOrder.status === 'billed' && 'Faturado & Cobrado'}
              {workOrder.status === 'rejected' && 'Recusado'}
            </Badge>
          </div>
        </DialogHeader>

        {/* Conteúdo do Documento */}
        <div className="py-4 space-y-6">
          {/* Cabeçalho da Empresa */}
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 flex justify-between items-start">
            <div>
              <h3 className="font-bold text-slate-100 text-lg">{mockTenant.name}</h3>
              <p className="text-xs text-slate-400">CNPJ/CPF: {mockTenant.document}</p>
              <p className="text-xs text-slate-400">Contato: {mockTenant.phone} | {mockTenant.email}</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono text-slate-500">ServiceZap Doc</span>
              <p className="text-xs text-slate-400">Data: {new Date(workOrder.$createdAt || Date.now()).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>

          {/* Dados do Cliente */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span>Cliente / Tomador</span>
              </div>
              <p className="font-semibold text-slate-200">{workOrder.clientName}</p>
              {workOrder.clientPhone && <p className="text-xs text-slate-400">{workOrder.clientPhone}</p>}
              {workOrder.clientEmail && <p className="text-xs text-slate-400">{workOrder.clientEmail}</p>}
            </div>

            <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>{isQuote ? 'Validade da Proposta' : 'Data Prevista'}</span>
              </div>
              <p className="font-semibold text-slate-200">
                {workOrder.dueDate
                  ? new Date(workOrder.dueDate).toLocaleDateString('pt-BR')
                  : 'A combinar'}
              </p>
              <p className="text-xs text-slate-400">Moeda: BRL (R$)</p>
            </div>
          </div>

          {/* Item / Serviço */}
          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex justify-between text-xs font-semibold text-slate-400">
              <span>DESCRIÇÃO DO SERVIÇO / PRODUTO</span>
              <span>VALOR</span>
            </div>
            <div className="p-4 flex justify-between items-center bg-slate-900/40">
              <div>
                <p className="font-medium text-slate-200">{workOrder.serviceName}</p>
                {workOrder.notes && (
                  <p className="text-xs text-slate-400 mt-1 max-w-md">{workOrder.notes}</p>
                )}
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-100 text-lg">
                  R$ {workOrder.amount?.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Status e Ações Dinâmicas */}
          <div className="p-4 bg-indigo-950/20 border border-indigo-800/40 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-indigo-300">Ações Rápidas de Workflow</span>
              {isLoadingAction && <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />}
            </div>

            <div className="flex flex-wrap gap-2">
              {/* Se for orçamento pendente */}
              {isQuote && workOrder.status === 'quote_sent' && (
                <Button
                  onClick={handleApproveQuote}
                  disabled={isLoadingAction}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Aprovar & Converter em O.S.
                </Button>
              )}

              {/* Se for O.S. em andamento */}
              {!isQuote && workOrder.status === 'in_execution' && (
                <Button
                  onClick={handleCompleteOS}
                  disabled={isLoadingAction}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Marcar Serviço como Concluído
                </Button>
              )}

              {/* Se a O.S. estiver concluída mas ainda não faturada */}
              {!isQuote && workOrder.status === 'completed' && (
                <Button
                  onClick={handleGenerateInvoice}
                  disabled={isLoadingAction}
                  size="sm"
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-xs gap-1.5 shadow-md hover:opacity-95"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  Converter em Cobrança PIX
                </Button>
              )}

              {/* Se já foi faturada */}
              {workOrder.status === 'billed' && (
                <div className="flex items-center gap-2 text-xs text-purple-400 font-semibold bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/20">
                  <CheckCircle2 className="w-4 h-4 text-purple-400" />
                  Fatura & Cobrança PIX Gerada com Sucesso!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rodapé de Ações de Compartilhamento/Impressão */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white gap-1.5 text-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir / PDF
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleWhatsAppShare}
              className="border-emerald-700/50 bg-emerald-950/30 text-emerald-400 hover:bg-emerald-900/40 gap-1.5 text-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              Enviar via WhatsApp
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-slate-400 hover:text-slate-200 text-xs"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
