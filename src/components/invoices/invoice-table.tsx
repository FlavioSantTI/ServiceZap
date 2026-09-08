'use client';

import React, { useState } from 'react';
import {
  MoreHorizontal,
  QrCode,
  FileText,
  Send,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { InvoiceDocument } from '@/types/appwrite';

interface InvoiceTableProps {
  invoices: Partial<InvoiceDocument>[];
  onSelectPix?: (invoice: Partial<InvoiceDocument>) => void;
  onSelectReceipt?: (invoice: Partial<InvoiceDocument>) => void;
  onStatusChange?: (invoiceId: string, status: any) => void;
  onDeleteInvoice?: (invoiceId: string) => void;
}

export function InvoiceTable({
  invoices,
  onSelectPix,
  onSelectReceipt,
  onStatusChange,
  onDeleteInvoice,
}: InvoiceTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.$id?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge className="bg-orange-500/15 text-[#E8622C] dark:text-[#F0806B] border-orange-500/30 gap-1 hover:bg-orange-500/20">
            <CheckCircle2 className="h-3 w-3" />
            <span>Pago</span>
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 hover:bg-amber-500/20">
            <Clock className="h-3 w-3" />
            <span>Pendente</span>
          </Badge>
        );
      case 'overdue':
        return (
          <Badge className="bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 gap-1 hover:bg-red-500/20">
            <AlertTriangle className="h-3 w-3" />
            <span>Vencido</span>
          </Badge>
        );
      case 'canceled':
        return (
          <Badge className="bg-neutral-500/15 text-neutral-600 dark:text-neutral-400 border-neutral-500/30 gap-1 hover:bg-neutral-500/20">
            <XCircle className="h-3 w-3" />
            <span>Cancelado</span>
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getNfeBadge = (status?: string, number?: string) => {
    switch (status) {
      case 'authorized':
        return (
          <span className="text-[11px] font-semibold text-[#E8622C] dark:text-[#F0806B] bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">
            {number || 'Emitida'}
          </span>
        );
      case 'processing':
        return (
          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
            Processando
          </span>
        );
      default:
        return (
          <span className="text-[11px] text-neutral-400 italic">Não emitida</span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Table Filters & Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Buscar por cliente ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl bg-white border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-900 p-1 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs">
            <Filter className="h-3.5 w-3.5 text-neutral-400 ml-2" />
            {(['all', 'pending', 'paid', 'overdue'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  statusFilter === st
                    ? 'bg-white dark:bg-neutral-800 text-[#E8622C] shadow-sm font-bold'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                {st === 'all'
                  ? 'Todas'
                  : st === 'pending'
                  ? 'Pendentes'
                  : st === 'paid'
                  ? 'Pagas'
                  : 'Vencidas'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/80 dark:bg-slate-950/60">
            <TableRow>
              <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">Cliente</TableHead>
              <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">Valor</TableHead>
              <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">Vencimento</TableHead>
              <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">Status Fatura</TableHead>
              <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">Nota Fiscal</TableHead>
              <TableHead className="text-right text-xs font-bold text-slate-700 dark:text-slate-300">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-xs text-slate-400">
                  Nenhuma fatura encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((inv) => (
                <TableRow key={inv.$id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <TableCell className="font-medium text-xs text-slate-900 dark:text-slate-100">
                    <div>
                      <p className="font-bold">{inv.clientName}</p>
                      <p className="text-[11px] text-slate-400 font-normal">{inv.description}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    R$ {inv.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                    {inv.dueDate}
                  </TableCell>
                  <TableCell>{getStatusBadge(inv.status)}</TableCell>
                  <TableCell>{getNfeBadge(inv.nfeStatus, inv.nfeNumber)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {inv.pixQrCodeUrl && (
                        <Button
                          onClick={() => onSelectPix && onSelectPix(inv)}
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-[#E8622C] hover:text-orange-500 hover:bg-orange-500/10"
                          title="Ver QR Code PIX"
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger className="h-8 w-8 p-0 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="text-xs">
                          <DropdownMenuItem onClick={() => onSelectReceipt && onSelectReceipt(inv)}>
                            <FileText className="mr-2 h-3.5 w-3.5 text-slate-700 dark:text-slate-200" />
                            Gerar Recibo de Serviço
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onSelectPix && onSelectPix(inv)}>
                            <QrCode className="mr-2 h-3.5 w-3.5 text-[#E8622C]" />
                            Exibir QR Code PIX
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Send className="mr-2 h-3.5 w-3.5 text-[#E8622C]" />
                            Reenviar no WhatsApp
                          </DropdownMenuItem>
                          {inv.nfeStatus === 'authorized' && (
                            <DropdownMenuItem>
                              <FileText className="mr-2 h-3.5 w-3.5 text-[#E8622C]" />
                              Baixar NF-e (PDF)
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {inv.status !== 'paid' && (
                            <DropdownMenuItem
                              onClick={() => inv.$id && onStatusChange && onStatusChange(inv.$id, 'paid')}
                              className="text-[#E8622C] font-semibold"
                            >
                              <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                              Marcar como Pago
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => inv.$id && onDeleteInvoice && onDeleteInvoice(inv.$id)}
                            className="text-rose-600 font-semibold"
                          >
                            <XCircle className="mr-2 h-3.5 w-3.5" />
                            Cancelar Cobrança
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
