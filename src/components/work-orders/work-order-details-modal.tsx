'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { WorkOrderDocument, WorkOrderItem, TenantDocument, WorkOrderStatus } from '@/types/appwrite';
import {
  updateWorkOrderStatusAction,
  convertWorkOrderToInvoiceAction,
} from '@/app/actions/work-orders';
import { fetchTenantProfileAction } from '@/app/actions/tenant';
import {
  generateWorkOrderPdfBlob,
  downloadWorkOrderPdf,
} from '@/lib/services/pdfService';
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
  MessageSquare,
  Download,
  FileCheck,
  Play,
  ArrowRight,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { mockTenant } from '@/lib/mock-data';

interface WorkOrderDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workOrder: Partial<WorkOrderDocument> | null;
  onEditWorkOrder?: (wo: Partial<WorkOrderDocument>) => void;
  onUpdated: () => void;
}

export function WorkOrderDetailsModal({
  open,
  onOpenChange,
  workOrder,
  onEditWorkOrder,
  onUpdated,
}: WorkOrderDetailsModalProps) {
  const router = useRouter();
  const [isLoadingAction, setIsLoadingAction] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [tenant, setTenant] = useState<Partial<TenantDocument>>(mockTenant);

  useEffect(() => {
    async function loadTenant() {
      try {
        const data = await fetchTenantProfileAction();
        if (data && data.name) {
          setTenant(data);
        }
      } catch (err) {
        console.error('Erro ao carregar dados da empresa no modal:', err);
      }
    }

    if (open) {
      loadTenant();
    }
  }, [open]);

  if (!workOrder) return null;

  const isQuote = workOrder.type === 'quote';

  // Parse dos múltiplos itens
  let parsedItems: WorkOrderItem[] = [];
  if (workOrder.itemsJson) {
    try {
      parsedItems = JSON.parse(workOrder.itemsJson);
    } catch {
      parsedItems = [];
    }
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    downloadWorkOrderPdf({ workOrder, tenant });
  };

  const handleSendPdfWhatsApp = async () => {
    setIsGeneratingPdf(true);
    try {
      const pdfBlob = generateWorkOrderPdfBlob({ workOrder, tenant });
      const prefix = isQuote ? 'Orcamento' : 'Ordem_de_Servico';
      const rawNum = workOrder.number?.replace(/[^a-zA-Z0-9_-]/g, '') || '0001';
      const fileName = `${prefix}_${rawNum}.pdf`;

      const rawPhone = workOrder.clientPhone
        ? workOrder.clientPhone.replace(/\D/g, '')
        : '';

      const companyDisplayName = tenant.name || tenant.companyName || 'nossa empresa';
      const validityText = workOrder.dueDate
        ? new Date(workOrder.dueDate).toLocaleDateString('pt-BR')
        : '7 dias';
      const execDateFormatted = workOrder.executionDate
        ? new Date(workOrder.executionDate).toLocaleDateString('pt-BR')
        : null;
      const execDateLine = execDateFormatted
        ? `\n🛠️ *Previsão de Execução:* ${execDateFormatted}`
        : '';

      const caption = isQuote
        ? `Olá ${workOrder.clientName}! 👋🏼\n\nSegue em anexo a proposta de orçamento *${workOrder.number}* da *${companyDisplayName}*.\n\n💰 *Valor Total:* R$ ${workOrder.amount?.toFixed(2)}\n📅 *Prazo de Validade da Proposta:* ${validityText}${execDateLine}\n\nAguardamos sua aprovação!`
        : `Olá ${workOrder.clientName}! 👋🏼\n\nSegue em anexo a Ordem de Serviço *${workOrder.number}* da *${companyDisplayName}*.\n\n💰 *Valor Total:* R$ ${workOrder.amount?.toFixed(2)}\n📅 *Validade da Proposta:* ${validityText}${execDateLine}`;

      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
      const previewUrl = URL.createObjectURL(pdfBlob);

      // Armazena no objeto global de navegação (imediato)
      if (typeof window !== 'undefined') {
        (window as any).__SERVICEZAP_PENDING_ATTACHMENT__ = {
          file,
          type: 'document',
          previewUrl,
          caption,
          phone: rawPhone,
          clientId: workOrder.clientId || '',
        };
      }

      // Converte para Data URL e salva em sessionStorage como fallback
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        try {
          sessionStorage.setItem(
            'servicezap_pending_pdf_attachment',
            JSON.stringify({
              name: fileName,
              type: 'document',
              mimeType: 'application/pdf',
              dataUrl,
              caption,
              phone: rawPhone,
              clientId: workOrder.clientId || '',
            })
          );
        } catch {
          // ignora quota se estourar
        }

        const params = new URLSearchParams();
        if (rawPhone) params.set('phone', rawPhone);
        if (workOrder.clientId) params.set('clientId', workOrder.clientId);
        if (workOrder.clientName) params.set('clientName', workOrder.clientName);
        params.set('attach', 'pdf');

        onOpenChange(false);
        router.push(`/dashboard/whatsapp?${params.toString()}`);
      };
      reader.readAsDataURL(pdfBlob);
    } catch (err) {
      console.error('Erro ao gerar PDF para envio:', err);
      alert('Não foi possível gerar o PDF para a mensageria.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleWhatsAppShare = () => {
    let itemsText = '';
    if (parsedItems.length > 0) {
      itemsText = parsedItems
        .map(
          (it) =>
            `• ${it.quantity} ${it.unit || 'un'} × *${it.serviceName}* (R$ ${(it.unitPrice || 0).toFixed(2)} cada)`
        )
        .join('\n');
    } else {
      itemsText = `• *${workOrder.serviceName}*`;
    }

    const companyDisplayName = tenant.name || tenant.companyName || 'nossa empresa';
    const validityText = workOrder.dueDate
      ? new Date(workOrder.dueDate).toLocaleDateString('pt-BR')
      : '7 dias';
    const execDateFormatted = workOrder.executionDate
      ? new Date(workOrder.executionDate).toLocaleDateString('pt-BR')
      : null;
    const execDateLine = execDateFormatted
      ? `\n🛠️ *Previsão de Execução:* ${execDateFormatted}`
      : '';

    const text = isQuote
      ? `Olá ${workOrder.clientName}! 👋🏼\n\nSegue a proposta de orçamento *${workOrder.number}* da *${companyDisplayName}*:\n\n📋 *Itens & Serviços:*\n${itemsText}\n\n💰 *Valor Total:* R$ ${workOrder.amount?.toFixed(2)}\n📅 *Prazo de Validade da Proposta:* ${validityText}${execDateLine}\n\nAguardamos sua aprovação!`
      : `Olá ${workOrder.clientName}! 👋🏼\n\nSua Ordem de Serviço *${workOrder.number}* da *${companyDisplayName}* foi atualizada.\n\n📋 *Serviços em Execução:*\n${itemsText}\n\n📊 *Status:* ${workOrder.status}\n💰 *Valor Total:* R$ ${workOrder.amount?.toFixed(2)}\n📅 *Validade da Proposta:* ${validityText}${execDateLine}`;

    const rawPhone = workOrder.clientPhone
      ? workOrder.clientPhone.replace(/\D/g, '')
      : '';

    const params = new URLSearchParams();
    if (rawPhone) params.set('phone', rawPhone);
    if (workOrder.clientId) params.set('clientId', workOrder.clientId);
    if (workOrder.clientName) params.set('clientName', workOrder.clientName);
    params.set('text', text);

    onOpenChange(false);
    router.push(`/dashboard/whatsapp?${params.toString()}`);
  };

  const handleApproveQuote = async () => {
    setIsLoadingAction(true);
    try {
      if (workOrder.$id) {
        await updateWorkOrderStatusAction(workOrder.$id, 'approved', 'work_order');
        onUpdated();
      }
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleStartExecution = async () => {
    setIsLoadingAction(true);
    try {
      if (workOrder.$id) {
        await updateWorkOrderStatusAction(workOrder.$id, 'in_execution');
        onUpdated();
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
      }
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleSetStatus = async (status: WorkOrderStatus) => {
    setIsLoadingAction(true);
    try {
      if (workOrder.$id) {
        await updateWorkOrderStatusAction(workOrder.$id, status);
        onUpdated();
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
                <ClipboardList className="w-5 h-5 text-[#E8622C]" />
              )}
              <DialogTitle className="text-xl font-bold text-slate-100">
                {isQuote ? 'Orçamento' : 'Ordem de Serviço'}: {workOrder.number}
              </DialogTitle>
            </div>

            <Badge
              className={
                workOrder.status === 'approved' || workOrder.status === 'completed'
                  ? 'bg-orange-500/20 text-[#E8622C] border-orange-500/30'
                  : workOrder.status === 'in_execution'
                  ? 'bg-amber-600/20 text-amber-400 border-amber-600/30'
                  : workOrder.status === 'billed'
                  ? 'bg-slate-800 text-slate-200 border-slate-700'
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

        {/* Stepper do Ciclo de Vida da O.S. */}
        <div className="bg-neutral-950/80 px-4 py-3 border-b border-neutral-800">
          <div className="flex items-center justify-between text-[11px]">
            {/* 1. Proposta */}
            <div className="flex flex-col items-center gap-1 flex-1">
              <button
                type="button"
                onClick={() => handleSetStatus('quote_sent')}
                disabled={isLoadingAction}
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  workOrder.status === 'quote_sent'
                    ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-500/20 shadow-lg shadow-amber-500/30'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700'
                }`}
              >
                1
              </button>
              <span className={`text-[10px] font-semibold text-center ${workOrder.status === 'quote_sent' ? 'text-amber-400' : 'text-neutral-400'}`}>
                Proposta
              </span>
            </div>

            <div className={`h-0.5 flex-1 mx-1 ${['approved', 'in_execution', 'completed', 'billed'].includes(workOrder.status || '') ? 'bg-[#E8622C]' : 'bg-neutral-800'}`} />

            {/* 2. Aprovada */}
            <div className="flex flex-col items-center gap-1 flex-1">
              <button
                type="button"
                onClick={() => handleSetStatus('approved')}
                disabled={isLoadingAction}
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  workOrder.status === 'approved'
                    ? 'bg-gradient-to-r from-[#F0806B] to-[#E8622C] text-white ring-4 ring-orange-500/20 shadow-lg shadow-orange-500/30'
                    : ['in_execution', 'completed', 'billed'].includes(workOrder.status || '')
                    ? 'bg-orange-500/30 text-orange-400'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700'
                }`}
              >
                2
              </button>
              <span className={`text-[10px] font-semibold text-center ${workOrder.status === 'approved' ? 'text-orange-400' : 'text-neutral-400'}`}>
                Aprovada
              </span>
            </div>

            <div className={`h-0.5 flex-1 mx-1 ${['in_execution', 'completed', 'billed'].includes(workOrder.status || '') ? 'bg-[#E8622C]' : 'bg-neutral-800'}`} />

            {/* 3. Em Execução */}
            <div className="flex flex-col items-center gap-1 flex-1">
              <button
                type="button"
                onClick={() => handleSetStatus('in_execution')}
                disabled={isLoadingAction}
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  workOrder.status === 'in_execution'
                    ? 'bg-orange-600 text-white ring-4 ring-orange-600/20 shadow-lg shadow-orange-600/30'
                    : ['completed', 'billed'].includes(workOrder.status || '')
                    ? 'bg-orange-600/30 text-orange-400'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700'
                }`}
              >
                3
              </button>
              <span className={`text-[10px] font-semibold text-center ${workOrder.status === 'in_execution' ? 'text-orange-400' : 'text-neutral-400'}`}>
                Em Execução
              </span>
            </div>

            <div className={`h-0.5 flex-1 mx-1 ${['completed', 'billed'].includes(workOrder.status || '') ? 'bg-[#F0806B]' : 'bg-neutral-800'}`} />

            {/* 4. Concluída */}
            <div className="flex flex-col items-center gap-1 flex-1">
              <button
                type="button"
                onClick={() => handleSetStatus('completed')}
                disabled={isLoadingAction}
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  workOrder.status === 'completed'
                    ? 'bg-[#F0806B] text-white ring-4 ring-orange-500/20 shadow-lg shadow-orange-500/30'
                    : workOrder.status === 'billed'
                    ? 'bg-orange-500/30 text-orange-400'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700'
                }`}
              >
                4
              </button>
              <span className={`text-[10px] font-semibold text-center ${workOrder.status === 'completed' ? 'text-[#F0806B]' : 'text-neutral-400'}`}>
                Concluída
              </span>
            </div>

            <div className={`h-0.5 flex-1 mx-1 ${workOrder.status === 'billed' ? 'bg-neutral-600' : 'bg-neutral-800'}`} />

            {/* 5. Faturada */}
            <div className="flex flex-col items-center gap-1 flex-1">
              <button
                type="button"
                onClick={handleGenerateInvoice}
                disabled={isLoadingAction}
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  workOrder.status === 'billed'
                    ? 'bg-neutral-700 text-white ring-4 ring-neutral-700/20 shadow-lg shadow-neutral-700/30'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700'
                }`}
              >
                5
              </button>
              <span className={`text-[10px] font-semibold text-center ${workOrder.status === 'billed' ? 'text-neutral-300' : 'text-neutral-400'}`}>
                Faturada
              </span>
            </div>
          </div>
        </div>

        {/* Conteúdo do Documento */}
        <div className="py-4 space-y-5">
          {/* Cabeçalho da Empresa */}
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 flex justify-between items-start">
            <div>
              <h3 className="font-bold text-slate-100 text-base">{tenant.name || 'Minha Empresa'}</h3>
              {tenant.document && <p className="text-xs text-slate-400">CNPJ/CPF: {tenant.document}</p>}
              {(tenant.phone || tenant.email) && (
                <p className="text-xs text-slate-400">
                  Contato: {tenant.phone} {tenant.email ? `| ${tenant.email}` : ''}
                </p>
              )}
            </div>
            <div className="text-right">
              <span className="text-[11px] font-mono text-slate-500">ServiceZap Doc</span>
              <p className="text-xs text-slate-400">Data: {new Date(workOrder.$createdAt || Date.now()).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>

          {/* Dados do Cliente & Prazos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span>Cliente / Tomador</span>
              </div>
              <p className="font-semibold text-slate-200 text-xs">{workOrder.clientName}</p>
              {workOrder.clientPhone && <p className="text-[11px] text-slate-400 font-mono">{workOrder.clientPhone}</p>}
              {workOrder.clientEmail && <p className="text-[11px] text-slate-400">{workOrder.clientEmail}</p>}
            </div>

            <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-amber-400 text-xs font-medium">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Validade da Proposta</span>
                </div>
                <span className="font-bold text-slate-200 text-xs font-mono">
                  {workOrder.dueDate
                    ? new Date(workOrder.dueDate).toLocaleDateString('pt-BR')
                    : '7 dias'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Previsão de Execução</span>
                </div>
                <span className="font-semibold text-slate-300 text-xs font-mono">
                  {workOrder.executionDate
                    ? new Date(workOrder.executionDate).toLocaleDateString('pt-BR')
                    : 'A combinar'}
                </span>
              </div>
            </div>
          </div>

          {/* Itens e Serviços Discriminados */}
          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <div className="bg-slate-950 px-3.5 py-2 border-b border-slate-800 flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Serviços & Itens</span>
              <span>Subtotal</span>
            </div>

            {parsedItems.length > 0 ? (
              <div className="divide-y divide-slate-800/60 bg-slate-900/40">
                {parsedItems.map((it, idx) => (
                  <div key={idx} className="p-3 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-200">{it.serviceName}</p>
                      <p className="text-[11px] text-slate-400">
                        {it.quantity} {it.unit || 'un'} × R$ {(it.unitPrice || 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right font-mono font-bold text-slate-200">
                      R$ {((it.quantity || 1) * (it.unitPrice || 0)).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-slate-900/40 text-xs text-slate-400">
                {workOrder.serviceName || 'Serviço sob medida'}
              </div>
            )}

            {/* Total e Desconto */}
            <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex justify-between items-center">
              <div>
                {workOrder.discount && workOrder.discount > 0 ? (
                  <p className="text-[11px] text-rose-400">
                    Desconto Aplicado: - R$ {workOrder.discount.toFixed(2)}
                  </p>
                ) : null}
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total do Documento:</span>
                <span className="text-base font-extrabold text-[#E8622C] font-mono">
                  R$ {workOrder.amount?.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {workOrder.notes && (
            <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 text-xs space-y-1">
              <span className="font-bold text-slate-400 uppercase text-[10px]">Observações / Laudo:</span>
              <p className="text-slate-300 whitespace-pre-wrap">{workOrder.notes}</p>
            </div>
          )}

          {/* Status e Ações Dinâmicas */}
          <div className="p-4 bg-orange-950/15 border border-orange-800/30 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#E8622C]" />
                <span>Fluxo de Execução & Ações Rápidas</span>
              </span>
              {isLoadingAction && (
                <div className="flex items-center gap-1 text-xs text-[#E8622C]">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Atualizando...</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {/* 1. Se for proposta/orçamento pendente */}
              {isQuote && workOrder.status === 'quote_sent' && (
                <Button
                  onClick={handleApproveQuote}
                  disabled={isLoadingAction}
                  size="sm"
                  className="bg-gradient-to-r from-[#F0806B] to-[#E8622C] hover:opacity-95 text-white font-bold text-xs gap-1.5 rounded-lg shadow-warm-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Aprovar & Iniciar O.S.</span>
                </Button>
              )}

              {/* 2. Se for O.S. aprovada -> Iniciar Execução */}
              {!isQuote && workOrder.status === 'approved' && (
                <Button
                  onClick={handleStartExecution}
                  disabled={isLoadingAction}
                  size="sm"
                  className="bg-gradient-to-r from-[#F0806B] to-[#E8622C] hover:opacity-95 text-white font-bold text-xs gap-1.5 rounded-lg shadow-warm-xs"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Iniciar Execução dos Serviços</span>
                </Button>
              )}

              {/* 3. Se for O.S. em andamento -> Concluir */}
              {!isQuote && workOrder.status === 'in_execution' && (
                <Button
                  onClick={handleCompleteOS}
                  disabled={isLoadingAction}
                  size="sm"
                  className="bg-gradient-to-r from-[#F0806B] to-[#E8622C] hover:opacity-95 text-white font-bold text-xs gap-1.5 rounded-lg shadow-warm-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Marcar O.S. como Concluída</span>
                </Button>
              )}

              {/* 4. Se a O.S. estiver concluída -> Emitir Fatura */}
              {!isQuote && workOrder.status === 'completed' && (
                <Button
                  onClick={handleGenerateInvoice}
                  disabled={isLoadingAction}
                  size="sm"
                  className="bg-[#2B2B2B] hover:bg-slate-800 text-white font-bold text-xs gap-1.5 rounded-lg shadow-warm-xs"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Emitir Cobrança / Fatura PIX</span>
                </Button>
              )}

              {/* 5. Se já foi faturada */}
              {!isQuote && workOrder.status === 'billed' && (
                <Button
                  onClick={() => {
                    onOpenChange(false);
                    router.push('/dashboard/invoices');
                  }}
                  size="sm"
                  className="bg-[#2B2B2B] hover:bg-slate-800 text-white font-semibold text-xs gap-1.5 rounded-lg"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Ver Faturas & Cobranças</span>
                </Button>
              )}

              {onEditWorkOrder && (
                <Button
                  onClick={() => {
                    onOpenChange(false);
                    onEditWorkOrder(workOrder);
                  }}
                  size="sm"
                  variant="outline"
                  className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10 text-xs gap-1.5 rounded-lg"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Editar {isQuote ? 'Orçamento' : 'O.S.'}
                </Button>
              )}

              <Button
                onClick={handleSendPdfWhatsApp}
                disabled={isGeneratingPdf}
                size="sm"
                className="bg-gradient-to-r from-[#F0806B] to-[#E8622C] hover:opacity-95 text-white font-bold text-xs gap-1.5 rounded-lg shadow-warm-xs"
              >
                {isGeneratingPdf ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileCheck className="w-3.5 h-3.5" />
                )}
                <span>Enviar PDF no WhatsApp</span>
              </Button>

              <Button
                onClick={handleWhatsAppShare}
                size="sm"
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs gap-1.5 rounded-lg font-medium"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#E8622C]" />
                <span>Enviar Texto no Chat</span>
              </Button>

              <Button
                onClick={handleDownloadPdf}
                size="sm"
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs gap-1.5 rounded-lg font-medium"
              >
                <Download className="w-3.5 h-3.5 text-[#E8622C]" />
                <span>Baixar PDF</span>
              </Button>

              <Button
                onClick={handlePrint}
                size="sm"
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs gap-1.5 rounded-lg"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir</span>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
