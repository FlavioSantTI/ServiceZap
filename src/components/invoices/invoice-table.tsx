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
import { sendInvoiceViaWhatsAppAction } from '@/app/actions/invoices';

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
  const [sendingWhatsAppId, setSendingWhatsAppId] = useState<string | null>(null);

  const handleSendWhatsApp = async (inv: Partial<InvoiceDocument>) => {
    if (!inv.$id) return;
    const targetPhone = prompt(
      `Confirme o WhatsApp (com DDD) para envio da cobrança de ${inv.clientName} (deixe em branco para usar o número cadastrado do cliente):`,
      ''
    );
    if (targetPhone === null) return; // cancelou

    try {
      setSendingWhatsAppId(inv.$id);
      const res = await sendInvoiceViaWhatsAppAction(inv.$id, targetPhone.trim() || undefined);
      if (res.success) {
        alert(res.message || 'Fatura enviada com sucesso no WhatsApp do cliente!');
      } else {
        alert(`Erro ao enviar fatura: ${res.error}`);
      }
    } catch (err: any) {
      alert(`Erro inesperado ao enviar: ${err.message}`);
    } finally {
      setSendingWhatsAppId(null);
    }
  };

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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl bg-card border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 bg-muted p-1 rounded-xl border border-border text-xs">
            <Filter className="h-3.5 w-3.5 text-muted-foreground ml-2" />
            {(['all', 'pending', 'paid', 'overdue'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  statusFilter === st
                    ? 'bg-card text-foreground shadow-sm font-bold border border-border/50'
                    : 'text-muted-foreground hover:text-foreground'
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
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/60">
            <TableRow className="border-border">
              <TableHead className="text-xs font-bold text-foreground">Cliente</TableHead>
              <TableHead className="text-xs font-bold text-foreground">Valor</TableHead>
              <TableHead className="text-xs font-bold text-foreground">Vencimento</TableHead>
              <TableHead className="text-xs font-bold text-foreground">Status Fatura</TableHead>
              <TableHead className="text-xs font-bold text-foreground">Nota Fiscal</TableHead>
              <TableHead className="text-right text-xs font-bold text-foreground">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.length === 0 ? (
              <TableRow className="border-border">
                <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                  Nenhuma fatura encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((inv) => (
                <TableRow key={inv.$id} className="border-border hover:bg-muted/40 transition-colors">
                  <TableCell className="font-medium text-xs text-foreground">
                    <div>
                      <p className="font-bold text-foreground">{inv.clientName}</p>
                      <p className="text-[11px] text-muted-foreground font-normal">{inv.description}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-bold text-foreground">
                    R$ {inv.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {inv.dueDate}
                  </TableCell>
                  <TableCell>{getStatusBadge(inv.status)}</TableCell>
                  <TableCell>{getNfeBadge(inv.nfeStatus, inv.nfeNumber)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        onClick={() => handleSendWhatsApp(inv)}
                        disabled={sendingWhatsAppId === inv.$id}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-primary hover:text-primary hover:bg-muted"
                        title="Enviar Cobrança por WhatsApp"
                      >
                        <Send className={`h-4 w-4 ${sendingWhatsAppId === inv.$id ? 'animate-spin' : ''}`} />
                      </Button>

                      {inv.pixQrCodeUrl && (
                        <Button
                          onClick={() => onSelectPix && onSelectPix(inv)}
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-primary hover:text-primary hover:bg-muted"
                          title="Ver QR Code PIX"
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger className="h-8 w-8 p-0 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="text-xs bg-card border-border text-foreground">
                          <DropdownMenuItem onClick={() => handleSendWhatsApp(inv)} className="hover:bg-muted cursor-pointer">
                            <Send className="mr-2 h-3.5 w-3.5 text-primary" />
                            Enviar / Reenviar no WhatsApp
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onSelectReceipt && onSelectReceipt(inv)} className="hover:bg-muted cursor-pointer">
                            <FileText className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                            Gerar Recibo de Serviço
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onSelectPix && onSelectPix(inv)} className="hover:bg-muted cursor-pointer">
                            <QrCode className="mr-2 h-3.5 w-3.5 text-primary" />
                            Exibir QR Code PIX
                          </DropdownMenuItem>
                          {inv.nfeStatus === 'authorized' && (
                            <DropdownMenuItem className="hover:bg-muted cursor-pointer">
                              <FileText className="mr-2 h-3.5 w-3.5 text-primary" />
                              Baixar NF-e (PDF)
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator className="bg-border" />
                          {inv.status !== 'paid' && (
                            <DropdownMenuItem
                              onClick={() => inv.$id && onStatusChange && onStatusChange(inv.$id, 'paid')}
                              className="text-primary font-semibold hover:bg-muted cursor-pointer"
                            >
                              <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                              Marcar como Pago
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => inv.$id && onDeleteInvoice && onDeleteInvoice(inv.$id)}
                            className="text-rose-600 font-semibold hover:bg-muted cursor-pointer"
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
