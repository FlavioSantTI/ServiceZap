'use client';

import React, { useState } from 'react';
import {
  MoreHorizontal,
  FileText,
  ClipboardList,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Zap,
  Eye,
  Trash2,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { WorkOrderDocument } from '@/types/appwrite';
import {
  updateWorkOrderStatusAction,
  convertWorkOrderToInvoiceAction,
  deleteWorkOrderAction,
} from '@/app/actions/work-orders';

interface WorkOrdersTableProps {
  workOrders: Partial<WorkOrderDocument>[];
  onSelectWorkOrder: (wo: Partial<WorkOrderDocument>) => void;
  onEditWorkOrder: (wo: Partial<WorkOrderDocument>) => void;
  onRefresh: () => void;
}

export function WorkOrdersTable({
  workOrders,
  onSelectWorkOrder,
  onEditWorkOrder,
  onRefresh,
}: WorkOrdersTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'quote' | 'work_order'>('all');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filteredWorkOrders = workOrders.filter((wo) => {
    const matchesSearch =
      wo.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wo.serviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wo.number?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'all' || wo.type === typeFilter;

    return matchesSearch && matchesType;
  });

  const handleStatusUpdate = async (id: string, status: any) => {
    setLoadingId(id);
    try {
      await updateWorkOrderStatusAction(id, status);
      onRefresh();
    } finally {
      setLoadingId(null);
    }
  };

  const handleApproveQuote = async (id: string) => {
    setLoadingId(id);
    try {
      await updateWorkOrderStatusAction(id, 'approved', 'work_order');
      onRefresh();
    } finally {
      setLoadingId(null);
    }
  };

  const handleConvertToInvoice = async (wo: Partial<WorkOrderDocument>) => {
    if (!wo.$id) return;
    setLoadingId(wo.$id);
    try {
      await convertWorkOrderToInvoiceAction(wo.$id, {
        clientName: wo.clientName || 'Cliente',
        amount: wo.amount || 0,
        serviceName: wo.serviceName || 'Serviço Prestado',
      });
      onRefresh();
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este registro?')) return;
    setLoadingId(id);
    try {
      await deleteWorkOrderAction(id);
      onRefresh();
    } finally {
      setLoadingId(null);
    }
  };

  const getStatusBadge = (status?: string, type?: string) => {
    switch (status) {
      case 'quote_sent':
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 gap-1.5 font-semibold px-2.5 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            <span>Proposta Enviada</span>
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="bg-orange-500/15 text-[#E8622C] dark:text-[#F0806B] border-orange-500/30 gap-1.5 font-semibold px-2.5 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#E8622C]" />
            <span>Aprovada</span>
          </Badge>
        );
      case 'in_execution':
        return (
          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1.5 font-semibold px-2.5 py-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            <span>Em Execução</span>
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 gap-1.5 font-semibold px-2.5 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Concluída</span>
          </Badge>
        );
      case 'billed':
        return (
          <Badge className="bg-neutral-800 text-neutral-200 border-neutral-700 gap-1.5 font-semibold px-2.5 py-1">
            <Zap className="h-3 w-3 text-orange-400 fill-orange-400" />
            <span>Faturada / Cobrança</span>
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 gap-1.5 font-semibold px-2.5 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            <span>Recusada</span>
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Table Filters & Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código, cliente ou serviço..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl bg-card border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 bg-muted p-1 rounded-xl border border-border text-xs">
            <Filter className="h-3.5 w-3.5 text-muted-foreground ml-2" />
            {(['all', 'quote', 'work_order'] as const).map((tp) => (
              <button
                key={tp}
                onClick={() => setTypeFilter(tp)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  typeFilter === tp
                    ? 'bg-card text-foreground shadow-sm font-bold border border-border/50'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tp === 'all'
                  ? 'Todos'
                  : tp === 'quote'
                  ? 'Orçamentos'
                  : 'Ordens de Serviço'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/60">
            <TableRow className="border-border">
              <TableHead className="text-xs font-bold text-foreground">Código / Tipo</TableHead>
              <TableHead className="text-xs font-bold text-foreground">Cliente</TableHead>
              <TableHead className="text-xs font-bold text-foreground">Serviço</TableHead>
              <TableHead className="text-xs font-bold text-foreground">Valor Total</TableHead>
              <TableHead className="text-xs font-bold text-foreground">Status</TableHead>
              <TableHead className="text-right text-xs font-bold text-foreground">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredWorkOrders.length === 0 ? (
              <TableRow className="border-border">
                <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                  Nenhum registro encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredWorkOrders.map((wo) => {
                const isQuote = wo.type === 'quote';

                return (
                  <TableRow
                    key={wo.$id}
                    onClick={() => onSelectWorkOrder(wo)}
                    className="border-border hover:bg-muted/40 transition-colors cursor-pointer"
                  >
                    <TableCell className="font-medium text-xs text-foreground">
                      <div className="flex items-center gap-2">
                        {isQuote ? (
                          <div className="p-1 rounded-md bg-amber-500/10 text-amber-600">
                            <FileText className="h-3.5 w-3.5" />
                          </div>
                        ) : (
                          <div className="p-1 rounded-md bg-primary/10 text-primary">
                            <ClipboardList className="h-3.5 w-3.5" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-foreground">{wo.number}</p>
                          <p className="text-xs text-muted-foreground font-medium">
                            {isQuote ? 'Orçamento' : 'Ordem de Serviço'}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-xs font-semibold text-foreground">
                      <div>
                        <p>{wo.clientName}</p>
                        {wo.clientPhone && (
                          <p className="text-xs text-muted-foreground font-normal">{wo.clientPhone}</p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {wo.serviceName}
                    </TableCell>

                    <TableCell className="text-xs font-bold text-foreground">
                      R$ {wo.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>

                    <TableCell>{getStatusBadge(wo.status, wo.type)}</TableCell>

                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="h-8 w-8 p-0 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="text-xs bg-card border-border text-foreground">
                          <DropdownMenuItem onClick={() => onSelectWorkOrder(wo)}>
                            <Eye className="mr-2 h-3.5 w-3.5 text-slate-500" />
                            Ver Detalhes
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => onEditWorkOrder(wo)} className="text-amber-500 font-medium">
                            <FileText className="mr-2 h-3.5 w-3.5" />
                            Editar {isQuote ? 'Orçamento' : 'O.S.'}
                          </DropdownMenuItem>

                          {/* Ações de Transição de Status recomendadas */}
                          {isQuote && wo.status === 'quote_sent' && (
                            <DropdownMenuItem
                              onClick={() => wo.$id && handleApproveQuote(wo.$id)}
                              className="text-[#E8622C] font-semibold"
                            >
                              <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                              Aprovar & Iniciar O.S.
                            </DropdownMenuItem>
                          )}

                          {!isQuote && wo.status === 'approved' && (
                            <DropdownMenuItem
                              onClick={() => wo.$id && handleStatusUpdate(wo.$id, 'in_execution')}
                              className="text-amber-500 font-semibold"
                            >
                              <Clock className="mr-2 h-3.5 w-3.5" />
                              Iniciar Execução
                            </DropdownMenuItem>
                          )}

                          {!isQuote && wo.status === 'in_execution' && (
                            <DropdownMenuItem
                              onClick={() => wo.$id && handleStatusUpdate(wo.$id, 'completed')}
                              className="text-[#E8622C] font-semibold"
                            >
                              <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                              Marcar como Concluída
                            </DropdownMenuItem>
                          )}

                          {!isQuote && wo.status === 'completed' && (
                            <DropdownMenuItem
                              onClick={() => handleConvertToInvoice(wo)}
                              className="text-[#E8622C] font-bold"
                            >
                              <Zap className="mr-2 h-3.5 w-3.5 fill-current" />
                              Emitir Fatura / Cobrança PIX
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />

                          {/* Alteração direta de status */}
                          <div className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                            Mudar Status
                          </div>

                          {wo.status !== 'approved' && (
                            <DropdownMenuItem onClick={() => wo.$id && handleStatusUpdate(wo.$id, 'approved')}>
                              <span className="w-2 h-2 rounded-full bg-[#E8622C] mr-2" />
                              Aprovada
                            </DropdownMenuItem>
                          )}

                          {wo.status !== 'in_execution' && (
                            <DropdownMenuItem onClick={() => wo.$id && handleStatusUpdate(wo.$id, 'in_execution')}>
                              <span className="w-2 h-2 rounded-full bg-amber-500 mr-2" />
                              Em Execução
                            </DropdownMenuItem>
                          )}

                          {wo.status !== 'completed' && (
                            <DropdownMenuItem onClick={() => wo.$id && handleStatusUpdate(wo.$id, 'completed')}>
                              <span className="w-2 h-2 rounded-full bg-[#2B2B2B] mr-2" />
                              Concluída
                            </DropdownMenuItem>
                          )}

                          {wo.status !== 'rejected' && (
                            <DropdownMenuItem onClick={() => wo.$id && handleStatusUpdate(wo.$id, 'rejected')} className="text-rose-400">
                              <span className="w-2 h-2 rounded-full bg-rose-500 mr-2" />
                              Recusada
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => wo.$id && handleDelete(wo.$id)}
                            className="text-rose-600 font-semibold"
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

