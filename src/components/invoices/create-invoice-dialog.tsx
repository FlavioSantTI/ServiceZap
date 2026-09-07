import React, { useState, useEffect } from 'react';
import { Plus, DollarSign, Calendar, FileText, Send, CheckCircle2, Briefcase, User } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InvoiceDocument, ServiceDocument, ClientDocument } from '@/types/appwrite';
import { createInvoiceAction } from '@/app/actions/invoices';
import { fetchServicesAction } from '@/app/actions/services';
import { fetchClientsAction } from '@/app/actions/clients';

interface CreateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvoiceCreated?: (newInvoice: Partial<InvoiceDocument>) => void;
}

export function CreateInvoiceDialog({
  open,
  onOpenChange,
  onInvoiceCreated,
}: CreateInvoiceDialogProps) {
  const [services, setServices] = useState<Partial<ServiceDocument>[]>([]);
  const [clients, setClients] = useState<Partial<ClientDocument>[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [clientName, setClientName] = useState('');
  const [document, setDocument] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [issueNfe, setIssueNfe] = useState(true);
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadSelectOptions() {
      try {
        const [servList, cliList] = await Promise.all([
          fetchServicesAction(),
          fetchClientsAction(),
        ]);
        setServices(servList.filter((s) => s.active !== false));
        setClients(cliList);
      } catch (err) {
        console.error('Erro ao carregar opções de serviços e clientes:', err);
      }
    }

    if (open) {
      loadSelectOptions();
    }
  }, [open]);

  const handleServiceSelect = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    const found = services.find((s) => s.$id === serviceId);
    if (found) {
      setAmount(found.price ? found.price.toString() : '');
      setDescription(found.description || found.name || '');
    }
  };

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    const found = clients.find((c) => c.$id === clientId);
    if (found) {
      setClientName(found.name || '');
      setDocument(found.document || '');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await createInvoiceAction({
        clientName: clientName || 'Cliente Exemplo',
        amount: parseFloat(amount) || 150.0,
        dueDate: dueDate || new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
        description: description || 'Cobrança Gerada no ServiceZap',
        issueNfe,
      });

      if (res.success && res.data) {
        if (onInvoiceCreated) {
          onInvoiceCreated(res.data);
        }
      } else {
        alert(`Erro ao criar fatura no Appwrite: ${res.error}`);
      }
    } catch (err: any) {
      console.error('Erro ao gerar fatura:', err);
    } finally {
      setLoading(false);
      onOpenChange(false);
      // Reset form
      setClientName('');
      setDocument('');
      setAmount('');
      setDueDate('');
      setDescription('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Emitir Nova Cobrança
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                Gere cobrança PIX com envio automático pelo WhatsApp e integração Focus NF-e.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Seleção de Serviço Aprovado */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Selecionar Serviço Cadastrado / Aprovado
            </Label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
              <select
                value={selectedServiceId}
                onChange={(e) => handleServiceSelect(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              >
                <option value="">-- Escolha um serviço (Preenche preço e descrição) --</option>
                {services.map((srv) => (
                  <option key={srv.$id} value={srv.$id}>
                    {srv.name} — R$ {srv.price?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({srv.category})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Seleção de Cliente ou Digitação Manual */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Nome do Cliente
              </Label>
              {clients.length > 0 ? (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
                  <select
                    value={selectedClientId}
                    onChange={(e) => handleClientSelect(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 mb-1.5"
                  >
                    <option value="">-- Selecionar Cliente Cadastrado --</option>
                    {clients.map((cli) => (
                      <option key={cli.$id} value={cli.$id}>
                        {cli.name} ({cli.document || 'Sem doc'})
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              <Input
                required
                placeholder="Ou digite o Nome do Cliente..."
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                CPF / CNPJ
              </Label>
              <Input
                placeholder="000.000.000-00"
                value={document}
                onChange={(e) => setDocument(e.target.value)}
                className="h-9 text-xs rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Valor (R$)
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  required
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Data de Vencimento
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  required
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-xl"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Descrição do Serviço / Produto
            </Label>
            <Input
              placeholder="Ex: Mensalidade Plano Saúde & Estética"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-9 text-xs rounded-xl"
            />
          </div>

          {/* Automações integradas */}
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3.5 space-y-2 border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Automações Ativas
            </span>

            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={issueNfe}
                onChange={(e) => setIssueNfe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <FileText className="h-4 w-4 text-blue-500" />
              <span>Emitir Nota Fiscal (Focus NFe) automaticamente na confirmação</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={sendWhatsApp}
                onChange={(e) => setSendWhatsApp(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <Send className="h-4 w-4 text-emerald-500" />
              <span>Enviar QR Code PIX imediatamente via WhatsApp (Evolution API)</span>
            </label>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 text-xs rounded-xl"
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={loading}
              className="h-9 text-xs gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20"
            >
              {loading ? (
                <span>Gerando Cobrança...</span>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Gerar Cobrança PIX</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
