'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ClientDocument, ServiceDocument, WorkOrderType } from '@/types/appwrite';
import { createWorkOrderAction } from '@/app/actions/work-orders';
import { FileText, ClipboardList, Loader2, Sparkles } from 'lucide-react';

interface CreateWorkOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Partial<ClientDocument>[];
  services: Partial<ServiceDocument>[];
  onWorkOrderCreated: () => void;
}

export function CreateWorkOrderDialog({
  open,
  onOpenChange,
  clients,
  services,
  onWorkOrderCreated,
}: CreateWorkOrderDialogProps) {
  const [type, setType] = useState<WorkOrderType>('quote');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [customServiceName, setCustomServiceName] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleServiceSelect = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    if (serviceId === 'custom') {
      return;
    }
    const foundService = services.find((s) => s.$id === serviceId);
    if (foundService) {
      setCustomServiceName(foundService.name || '');
      setAmount(foundService.price ? foundService.price.toString() : '');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const client = clients.find((c) => c.$id === selectedClientId);
    if (!client && !selectedClientId) {
      setErrorMsg('Por favor, selecione um cliente.');
      return;
    }

    const finalServiceName =
      selectedServiceId === 'custom'
        ? customServiceName
        : services.find((s) => s.$id === selectedServiceId)?.name || customServiceName;

    if (!finalServiceName) {
      setErrorMsg('Por favor, informe ou selecione um serviço.');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Por favor, informe um valor válido.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await createWorkOrderAction({
        type,
        clientId: client?.$id || 'cli_01',
        clientName: client?.name || selectedClientId || 'Cliente Avulso',
        clientPhone: client?.phone,
        clientEmail: client?.email,
        serviceId: selectedServiceId !== 'custom' ? selectedServiceId : undefined,
        serviceName: finalServiceName,
        amount: parsedAmount,
        dueDate: dueDate || new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
        notes,
      });

      if (res.success) {
        onWorkOrderCreated();
        onOpenChange(false);
        // Reset form
        setSelectedClientId('');
        setSelectedServiceId('');
        setCustomServiceName('');
        setAmount('');
        setDueDate('');
        setNotes('');
      } else {
        setErrorMsg(res.error || 'Erro ao criar item.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocorreu um erro ao processar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] bg-slate-900 text-slate-100 border-slate-800">
        <DialogHeader>
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Novo Registro Comercial</span>
          </div>
          <DialogTitle className="text-xl text-slate-100">
            {type === 'quote' ? 'Criar Novo Orçamento' : 'Criar Nova Ordem de Serviço (O.S.)'}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Preencha os dados do cliente e serviços prestados para gerar a proposta ou ordem de execução.
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Alternador Orçamento vs O.S. */}
          <div className="grid grid-cols-2 gap-3 p-1 bg-slate-950/60 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setType('quote')}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                type === 'quote'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Orçamento / Proposta</span>
            </button>

            <button
              type="button"
              onClick={() => setType('work_order')}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                type === 'work_order'
                  ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>Ordem de Serviço (O.S.)</span>
            </button>
          </div>

          {/* Seleção do Cliente */}
          <div className="space-y-2">
            <Label className="text-slate-200">Cliente *</Label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-800 text-slate-100 rounded-lg h-10 px-3 text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="">Selecione um cliente cadastrado...</option>
              {clients.map((cli) => (
                <option key={cli.$id} value={cli.$id || ''} className="bg-slate-900 text-slate-100">
                  {cli.name} {cli.document ? `(${cli.document})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Seleção ou digitação de Serviço */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-200">Serviço do Catálogo</Label>
              <select
                value={selectedServiceId}
                onChange={(e) => handleServiceSelect(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 text-slate-100 rounded-lg h-10 px-3 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="">Escolha do catálogo...</option>
                <option value="custom" className="bg-slate-900 text-slate-100">✍️ Digitar Serviço Customizado</option>
                {services.map((srv) => (
                  <option key={srv.$id} value={srv.$id || ''} className="bg-slate-900 text-slate-100">
                    {srv.name} (R$ {srv.price?.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-200">Valor (R$) *</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-slate-950/50 border-slate-800 text-slate-100 h-10"
                required
              />
            </div>
          </div>

          {(selectedServiceId === 'custom' || !selectedServiceId) && (
            <div className="space-y-2">
              <Label className="text-slate-200">Descrição do Serviço / Item *</Label>
              <Input
                type="text"
                placeholder="Ex: Instalação e Configuração de Câmeras de Segurança..."
                value={customServiceName}
                onChange={(e) => setCustomServiceName(e.target.value)}
                className="bg-slate-950/50 border-slate-800 text-slate-100 h-10"
              />
            </div>
          )}

          {/* Data de Vencimento/Execução */}
          <div className="space-y-2">
            <Label className="text-slate-200">
              {type === 'quote' ? 'Validade da Proposta' : 'Data Prevista de Execução'}
            </Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="bg-slate-950/50 border-slate-800 text-slate-100 h-10"
            />
          </div>

          {/* Observações / Laudo Técnico */}
          <div className="space-y-2">
            <Label className="text-slate-200">Observações / Especificações Técnicas</Label>
            <textarea
              placeholder="Detalhes adicionais, garantia, condições de pagamento ou laudo técnico..."
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-800 text-slate-100 rounded-lg p-3 text-sm min-h-[90px] focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Ações */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/80">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={
                type === 'quote'
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white font-semibold'
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : type === 'quote' ? (
                'Gerar Orçamento'
              ) : (
                'Criar Ordem de Serviço'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
