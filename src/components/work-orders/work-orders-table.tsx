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
  onRefresh: () => void;
}

export function WorkOrdersTable({
  workOrders,
  onSelectWorkOrder,
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
      case 'approved':
      case 'completed':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>{status === 'approved' ? 'Aprovado' : 'Concluído'}</span>
          </Badge>
        );
      case 'in_execution':
        return (
          <Badge className="bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 gap-1">
            <Clock className="h-3 w-3" />
            <span>Em Execução</span>
          </Badge>
        );
      case 'billed':
        return (
          <Badge className="bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30 gap-1">
            <Zap className="h-3 w-3" />
            <span>Faturado (PIX)</span>
          </Badge>
        );
      case 'quote_sent':
        return (
          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1">
            <FileText className="h-3 w-3" />
            <span>Proposta Enviada</span>
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Table Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por código, cliente ou serviço..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <Filter className="h-3.5 w-3.5 text-slate-400 ml-2" />
            {(['all', 'quote', 'work_order'] as const).map((tp) => (
              <button
                key={tp}
                onClick={() => setTypeFilter(tp)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  typeFilter === tp
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
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
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/80 dark:bg-slate-950/60">
            <TableRow>
              <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">Código / Tipo</TableHead>
              <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">Cliente</TableHead>
              <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">Serviço</TableHead>
              <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">Valor Total</TableHead>
              <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">Status</TableHead>
              <TableHead className="text-right text-xs font-bold text-slate-700 dark:text-slate-300">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredWorkOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-xs text-slate-400">
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
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <TableCell className="font-medium text-xs text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-2">
                        {isQuote ? (
                          <div className="p-1 rounded-md bg-amber-500/10 text-amber-500">
                            <FileText className="h-3.5 w-3.5" />
                          </div>
                        ) : (
                          <div className="p-1 rounded-md bg-indigo-500/10 text-indigo-500">
                            <ClipboardList className="h-3.5 w-3.5" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold">{wo.number}</p>
                          <p className="text-[11px] text-slate-400 font-normal">
                            {isQuote ? 'Orçamento' : 'Ordem de Serviço'}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      <div>
                        <p>{wo.clientName}</p>
                        {wo.clientPhone && (
                          <p className="text-[11px] text-slate-400 font-normal">{wo.clientPhone}</p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                      {wo.serviceName}
                    </TableCell>

                    <TableCell className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      R$ {wo.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>

                    <TableCell>{getStatusBadge(wo.status, wo.type)}</TableCell>

                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="h-8 w-8 p-0 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="text-xs">
                          <DropdownMenuItem onClick={() => onSelectWorkOrder(wo)}>
                            <Eye className="mr-2 h-3.5 w-3.5 text-slate-500" />
                            Ver Detalhes
                          </DropdownMenuItem>

                          {isQuote && wo.status === 'quote_sent' && (
                            <DropdownMenuItem
                              onClick={() => wo.$id && handleApproveQuote(wo.$id)}
                              className="text-emerald-600 font-semibold"
                            >
                              <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                              Aprovar & Converter em O.S.
                            </DropdownMenuItem>
                          )}

                          {!isQuote && wo.status === 'in_execution' && (
                            <DropdownMenuItem
                              onClick={() => wo.$id && handleStatusUpdate(wo.$id, 'completed')}
                              className="text-indigo-600 font-semibold"
                            >
                              <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                              Concluir Serviço
                            </DropdownMenuItem>
                          )}

                          {!isQuote && wo.status === 'completed' && (
                            <DropdownMenuItem
                              onClick={() => handleConvertToInvoice(wo)}
                              className="text-teal-600 font-bold"
                            >
                              <Zap className="mr-2 h-3.5 w-3.5 fill-current" />
                              Gerar Cobrança PIX
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

