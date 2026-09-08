'use client';

import { useState, useEffect } from 'react';
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
import { DatePicker } from '@/components/ui/date-picker';
import { ClientDocument, ServiceDocument, WorkOrderType, WorkOrderItem, WorkOrderDocument } from '@/types/appwrite';
import { createWorkOrderAction, updateWorkOrderAction } from '@/app/actions/work-orders';
import { FileText, ClipboardList, Loader2, Sparkles, Plus, Trash2, Calculator, CheckCircle2, Calendar, Clock } from 'lucide-react';

interface CreateWorkOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Partial<ClientDocument>[];
  services: Partial<ServiceDocument>[];
  workOrderToEdit?: Partial<WorkOrderDocument> | null;
  onWorkOrderCreated: () => void;
}

interface FormItem {
  id: string;
  serviceId: string;
  serviceName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

export function CreateWorkOrderDialog({
  open,
  onOpenChange,
  clients,
  services,
  workOrderToEdit,
  onWorkOrderCreated,
}: CreateWorkOrderDialogProps) {
  const [type, setType] = useState<WorkOrderType>('quote');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  
  // Lista de múltiplos serviços / itens
  const [items, setItems] = useState<FormItem[]>([
    {
      id: 'item_1',
      serviceId: '',
      serviceName: '',
      quantity: 1,
      unit: 'un',
      unitPrice: 0,
    },
  ]);

  const [discount, setDiscount] = useState<string>('0');
  const [dueDate, setDueDate] = useState<string>('');
  const [executionDate, setExecutionDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Popula o formulário se estiver em modo de edição ou inicializa limpo
  useEffect(() => {
    if (open) {
      if (workOrderToEdit) {
        setType(workOrderToEdit.type || 'quote');
        setSelectedClientId(workOrderToEdit.clientId || '');
        setDiscount(workOrderToEdit.discount ? workOrderToEdit.discount.toString() : '0');
        setDueDate(workOrderToEdit.dueDate || '');
        setExecutionDate(workOrderToEdit.executionDate || '');
        setNotes(workOrderToEdit.notes || '');

        let parsedItems: FormItem[] = [];
        if (workOrderToEdit.itemsJson) {
          try {
            const raw = JSON.parse(workOrderToEdit.itemsJson);
            if (Array.isArray(raw) && raw.length > 0) {
              parsedItems = raw.map((it: WorkOrderItem, idx: number) => ({
                id: `edit_item_${idx}_${Date.now()}`,
                serviceId: it.serviceId || 'custom',
                serviceName: it.serviceName || '',
                quantity: it.quantity || 1,
                unit: it.unit || 'un',
                unitPrice: it.unitPrice || 0,
              }));
            }
          } catch {
            parsedItems = [];
          }
        }

        if (parsedItems.length === 0 && workOrderToEdit.serviceName) {
          parsedItems = [
            {
              id: `edit_item_${Date.now()}`,
              serviceId: workOrderToEdit.serviceId || 'custom',
              serviceName: workOrderToEdit.serviceName,
              quantity: 1,
              unit: 'un',
              unitPrice: workOrderToEdit.amount || 0,
            },
          ];
        }

        setItems(
          parsedItems.length > 0
            ? parsedItems
            : [
                {
                  id: `item_${Date.now()}`,
                  serviceId: services[0]?.$id || 'custom',
                  serviceName: services[0]?.name || '',
                  quantity: 1,
                  unit: services[0]?.unit || 'un',
                  unitPrice: services[0]?.price || 0,
                },
              ]
        );
      } else {
        // Novo Registro
        setType('quote');
        setSelectedClientId(clients[0]?.$id || '');
        const defaultSrv = services[0];
        setItems([
          {
            id: `item_${Date.now()}`,
            serviceId: defaultSrv ? defaultSrv.$id || '' : 'custom',
            serviceName: defaultSrv ? defaultSrv.name || '' : '',
            quantity: 1,
            unit: defaultSrv ? defaultSrv.unit || 'un' : 'un',
            unitPrice: defaultSrv ? defaultSrv.price || 0 : 0,
          },
        ]);
        setDiscount('0');
        // Validade padrão: +7 dias
        setDueDate(new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]);
        setExecutionDate('');
        setNotes('');
      }
      setErrorMsg(null);
    }
  }, [open, workOrderToEdit, services, clients]);

  const handleAddItem = () => {
    const defaultSrv = services[0];
    setItems((prev) => [
      ...prev,
      {
        id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        serviceId: defaultSrv ? defaultSrv.$id || '' : 'custom',
        serviceName: defaultSrv ? defaultSrv.name || '' : '',
        quantity: 1,
        unit: defaultSrv ? defaultSrv.unit || 'un' : 'un',
        unitPrice: defaultSrv ? defaultSrv.price || 0 : 0,
      },
    ]);
  };

  const handleRemoveItem = (idToRemove: string) => {
    if (items.length <= 1) {
      alert('É necessário ter ao menos 1 serviço ou item no orçamento/OS.');
      return;
    }
    setItems((prev) => prev.filter((it) => it.id !== idToRemove));
  };

  const handleItemServiceChange = (itemId: string, serviceId: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        if (serviceId === 'custom') {
          return { ...it, serviceId: 'custom', serviceName: '', unit: 'un', unitPrice: 0 };
        }
        const found = services.find((s) => s.$id === serviceId);
        if (found) {
          return {
            ...it,
            serviceId: found.$id || '',
            serviceName: found.name || '',
            unit: found.unit || 'un',
            unitPrice: found.price || 0,
          };
        }
        return it;
      })
    );
  };

  const handleItemNameChange = (itemId: string, name: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, serviceName: name } : it))
    );
  };

  const handleItemQuantityChange = (itemId: string, qtyStr: string) => {
    const qty = parseInt(qtyStr, 10);
    setItems((prev) =>
      prev.map((it) =>
        it.id === itemId ? { ...it, quantity: isNaN(qty) || qty < 1 ? 1 : qty } : it
      )
    );
  };

  const handleItemUnitChange = (itemId: string, unitStr: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, unit: unitStr } : it))
    );
  };

  const handleItemPriceChange = (itemId: string, priceStr: string) => {
    const price = parseFloat(priceStr);
    setItems((prev) =>
      prev.map((it) =>
        it.id === itemId ? { ...it, unitPrice: isNaN(price) || price < 0 ? 0 : price } : it
      )
    );
  };

  // Cálculos de Totais
  const subtotal = items.reduce(
    (acc, it) => acc + (it.quantity || 1) * (it.unitPrice || 0),
    0
  );
  const parsedDiscount = parseFloat(discount) || 0;
  const totalAmount = Math.max(0, subtotal - parsedDiscount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const client = clients.find((c) => c.$id === selectedClientId);
    if (!client && !selectedClientId) {
      setErrorMsg('Por favor, selecione um cliente.');
      return;
    }

    // Valida itens
    for (let i = 0; i < items.length; i++) {
      if (!items[i].serviceName.trim()) {
        setErrorMsg(`Por favor, preencha o nome do serviço no item #${i + 1}.`);
        return;
      }
    }

    if (totalAmount <= 0 && subtotal <= 0) {
      setErrorMsg('O valor total dos serviços deve ser maior que zero.');
      return;
    }

    setIsSubmitting(true);

    const workOrderItems: WorkOrderItem[] = items.map((it) => ({
      serviceId: it.serviceId !== 'custom' ? it.serviceId : undefined,
      serviceName: it.serviceName.trim(),
      quantity: it.quantity,
      unit: it.unit || 'un',
      unitPrice: it.unitPrice,
      totalPrice: it.quantity * it.unitPrice,
    }));

    // Nome resumido
    const primaryServiceName =
      workOrderItems.length === 1
        ? workOrderItems[0].serviceName
        : `${workOrderItems[0].serviceName} (+${workOrderItems.length - 1} serviços)`;

    try {
      if (workOrderToEdit?.$id) {
        // Modo Edição
        const res = await updateWorkOrderAction(workOrderToEdit.$id, {
          type,
          clientId: client?.$id || selectedClientId,
          clientName: client?.name || workOrderToEdit.clientName || 'Cliente',
          clientPhone: client?.phone || workOrderToEdit.clientPhone,
          clientEmail: client?.email || workOrderToEdit.clientEmail,
          serviceId: workOrderItems[0].serviceId,
          serviceName: primaryServiceName,
          items: workOrderItems,
          itemsJson: JSON.stringify(workOrderItems),
          amount: totalAmount,
          discount: parsedDiscount,
          dueDate: dueDate || undefined,
          executionDate: executionDate || undefined,
          notes,
        });

        if (res.success) {
          onWorkOrderCreated();
          onOpenChange(false);
        } else {
          setErrorMsg(res.error || 'Erro ao atualizar item.');
        }
      } else {
        // Modo Criação
        const res = await createWorkOrderAction({
          type,
          clientId: client?.$id || 'cli_01',
          clientName: client?.name || selectedClientId || 'Cliente Avulso',
          clientPhone: client?.phone,
          clientEmail: client?.email,
          serviceId: workOrderItems[0].serviceId,
          serviceName: primaryServiceName,
          items: workOrderItems,
          itemsJson: JSON.stringify(workOrderItems),
          amount: totalAmount,
          discount: parsedDiscount,
          dueDate: dueDate || new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
          executionDate: executionDate || undefined,
          notes,
        });

        if (res.success) {
          onWorkOrderCreated();
          onOpenChange(false);
        } else {
          setErrorMsg(res.error || 'Erro ao criar item.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocorreu um erro ao processar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditing = !!workOrderToEdit?.$id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] bg-slate-900 text-slate-100 border-slate-800 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-[#E8622C] font-semibold text-sm mb-1">
            <Sparkles className="w-4 h-4" />
            <span>{isEditing ? 'Edição de Registro Comercial' : 'Novo Registro Comercial'}</span>
          </div>
          <DialogTitle className="text-xl text-slate-100">
            {isEditing
              ? `${type === 'quote' ? 'Editar Orçamento' : 'Editar Ordem de Serviço'}: ${workOrderToEdit?.number || ''}`
              : type === 'quote'
              ? 'Criar Novo Orçamento'
              : 'Criar Nova Ordem de Serviço (O.S.)'}
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-xs">
            Inclua múltiplos serviços, ajuste quantidades e valores para compor propostas e ordens de execução completas.
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Alternador Orçamento vs O.S. */}
          <div className="grid grid-cols-2 gap-3 p-1 bg-slate-950/60 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setType('quote')}
              className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-bold transition-all ${
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
              className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-bold transition-all ${
                type === 'work_order'
                  ? 'bg-gradient-to-r from-[#F0806B] to-[#E8622C] text-white shadow-warm-xs font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>Ordem de Serviço (O.S.)</span>
            </button>
          </div>

          {/* Seleção do Cliente */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-200">Cliente *</Label>
            <select
              required
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-800 text-slate-100 rounded-xl h-9 px-3 text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="">Selecione um cliente cadastrado...</option>
              {clients.map((cli) => (
                <option key={cli.$id} value={cli.$id || ''} className="bg-slate-900 text-slate-100">
                  {cli.name} {cli.phone ? `(${cli.phone})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Seção de Múltiplos Serviços / Itens */}
          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-[#E8622C]" />
                <span>Serviços & Itens Incluídos ({items.length})</span>
              </span>
              <Button
                type="button"
                onClick={handleAddItem}
                size="sm"
                className="h-7 px-2.5 text-xs gap-1.5 bg-gradient-to-r from-[#F0806B] to-[#E8622C] hover:opacity-95 text-white font-bold rounded-lg shadow-warm-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Adicionar Outro Serviço</span>
              </Button>
            </div>

            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {items.map((item, index) => {
                const itemTotal = (item.quantity || 1) * (item.unitPrice || 0);

                return (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2.5 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">
                        Serviço #{index + 1}
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-slate-500 hover:text-red-400 transition-colors p-1"
                          title="Remover serviço"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                      {/* Seletor do Catálogo */}
                      <div className="sm:col-span-4 space-y-1">
                        <Label className="text-[11px] text-slate-400">Serviço do Catálogo</Label>
                        <select
                          value={item.serviceId}
                          onChange={(e) => handleItemServiceChange(item.id, e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700/80 text-slate-100 rounded-lg h-8 px-2 text-xs focus:outline-none focus:border-indigo-500"
                        >
                          <option value="custom">✍️ Digitar Customizado</option>
                          {services.map((srv) => (
                            <option key={srv.$id} value={srv.$id || ''} className="bg-slate-900 text-slate-100">
                              {srv.name} (R$ {srv.price?.toFixed(2)}/{srv.unit || 'un'})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Nome do Serviço */}
                      <div className="sm:col-span-3 space-y-1">
                        <Label className="text-[11px] text-slate-400">Descrição / Nome</Label>
                        <Input
                          required
                          placeholder="Nome do serviço"
                          value={item.serviceName}
                          onChange={(e) => handleItemNameChange(item.id, e.target.value)}
                          className="bg-slate-900 border-slate-700/80 text-slate-100 h-8 text-xs rounded-lg"
                        />
                      </div>

                      {/* Quantidade */}
                      <div className="sm:col-span-1 space-y-1">
                        <Label className="text-[11px] text-slate-400">Qtd.</Label>
                        <Input
                          required
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemQuantityChange(item.id, e.target.value)}
                          className="bg-slate-900 border-slate-700/80 text-slate-100 h-8 text-xs rounded-lg text-center px-1"
                        />
                      </div>

                      {/* Unidade de Medida */}
                      <div className="sm:col-span-2 space-y-1">
                        <Label className="text-[11px] text-slate-400">Unidade</Label>
                        <select
                          value={item.unit || 'un'}
                          onChange={(e) => handleItemUnitChange(item.id, e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700/80 text-slate-100 rounded-lg h-8 px-1.5 text-xs focus:outline-none focus:border-indigo-500"
                        >
                          <option value="un">un (unidade)</option>
                          <option value="hora">hora (hr)</option>
                          <option value="kg">kg (quilo)</option>
                          <option value="metro">metro (m)</option>
                          <option value="m²">m² (metro²)</option>
                          <option value="diária">diária</option>
                          <option value="sessão">sessão</option>
                          <option value="serviço">serviço</option>
                          {item.unit && !['un', 'hora', 'kg', 'metro', 'm²', 'diária', 'sessão', 'serviço'].includes(item.unit) && (
                            <option value={item.unit}>{item.unit}</option>
                          )}
                        </select>
                      </div>

                      {/* Valor Unitário */}
                      <div className="sm:col-span-2 space-y-1">
                        <Label className="text-[11px] text-slate-400">Unitário (R$)</Label>
                        <Input
                          required
                          type="number"
                          step="0.01"
                          value={item.unitPrice || ''}
                          onChange={(e) => handleItemPriceChange(item.id, e.target.value)}
                          className="bg-slate-900 border-slate-700/80 text-slate-100 h-8 text-xs rounded-lg font-mono font-bold text-right"
                        />
                      </div>
                    </div>

                    <div className="text-right text-[11px] text-slate-400 font-mono">
                      Subtotal: <span className="font-bold text-slate-200">R$ {itemTotal.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Resumo Financeiro & Desconto */}
            <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Subtotal dos Serviços ({items.length} {items.length === 1 ? 'item' : 'itens'}):</span>
                <span className="font-mono font-bold text-slate-200">R$ {subtotal.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Desconto Especial (R$):</span>
                <div className="w-28">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="bg-slate-900 border-slate-700/80 text-slate-100 h-7 text-xs rounded-lg text-right font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-200 uppercase">VALOR TOTAL DO ORÇAMENTO:</span>
                <span className="text-base font-extrabold text-[#E8622C] font-mono">
                  R$ {totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Prazos: Validade da Proposta & Previsão de Execução */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            {/* 1. Validade da Proposta Comercial */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Validade da Proposta *</span>
              </Label>
              <DatePicker
                required
                value={dueDate}
                onChange={(val) => setDueDate(val)}
                placeholder="DD/MM/AAAA"
                presets={[
                  { label: '+7 dias', daysOffset: 7 },
                  { label: '+15 dias', daysOffset: 15 },
                  { label: '+30 dias', daysOffset: 30 },
                ]}
                showShortcuts
              />
            </div>

            {/* 2. Previsão de Execução / Entrega */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Previsão de Execução / Entrega</span>
              </Label>
              <DatePicker
                value={executionDate}
                onChange={(val) => setExecutionDate(val)}
                placeholder="DD/MM/AAAA"
                presets={[
                  { label: 'Hoje', daysOffset: 0 },
                  { label: 'Amanhã', daysOffset: 1 },
                  { label: '+7 dias', daysOffset: 7 },
                ]}
                showShortcuts
              />
            </div>
          </div>

          {/* Observações / Laudo Técnico */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-200">Observações / Especificações Técnicas</Label>
            <textarea
              placeholder="Detalhes adicionais, condições de pagamento ou laudo técnico..."
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-800 text-slate-100 rounded-xl p-2.5 text-xs min-h-[70px] focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Ações */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800/80">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 text-xs rounded-xl border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-9 text-xs rounded-xl font-bold bg-gradient-to-r from-[#F0806B] to-[#E8622C] hover:opacity-95 text-white shadow-warm-xs disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : isEditing ? (
                'Salvar Alterações'
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
