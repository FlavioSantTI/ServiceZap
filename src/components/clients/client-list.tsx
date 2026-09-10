'use client';

import React, { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  Phone,
  Mail,
  DollarSign,
  Send,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  UserCheck,
  Building,
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
import { ClientDocument, ClientStatus } from '@/types/appwrite';

interface ClientListProps {
  clients: Partial<ClientDocument>[];
  onEditClient: (client: Partial<ClientDocument>) => void;
  onViewClientDetails: (client: Partial<ClientDocument>) => void;
  onNewClient: () => void;
  onQuickCharge: (client: Partial<ClientDocument>) => void;
  onDeleteClient: (client: Partial<ClientDocument>) => void;
}

export function ClientList({
  clients,
  onEditClient,
  onViewClientDetails,
  onNewClient,
  onQuickCharge,
  onDeleteClient,
}: ClientListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredClients = clients.filter((cli) => {
    const matchesSearch =
      cli.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cli.document?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cli.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cli.phone?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || cli.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status?: ClientStatus) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-orange-500/15 text-[#E8622C] border-orange-500/30 gap-1 hover:bg-orange-500/20">
            <CheckCircle2 className="h-3 w-3" />
            <span>Ativo</span>
          </Badge>
        );
      case 'lead':
        return (
          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 hover:bg-amber-500/20">
            <Clock className="h-3 w-3" />
            <span>Lead</span>
          </Badge>
        );
      case 'inactive':
        return (
          <Badge className="bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30 gap-1 hover:bg-slate-500/20">
            <span>Inativo</span>
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleWhatsApp = (phone?: string) => {
    if (phone) {
      const clean = phone.replace(/\D/g, '');
      window.open(`https://wa.me/55${clean}`, '_blank');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Filters & Add Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, documento, e-mail ou WhatsApp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl bg-card border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex items-center gap-1 bg-muted p-1 rounded-xl border border-border text-xs">
            <Filter className="h-3.5 w-3.5 text-muted-foreground ml-2" />
            {(['all', 'active', 'lead', 'inactive'] as const).map((st) => (
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
                  ? 'Todos'
                  : st === 'active'
                  ? 'Ativos'
                  : st === 'lead'
                  ? 'Leads'
                  : 'Inativos'}
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={onNewClient}
          size="sm"
          className="h-9 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-warm-xs w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Novo Cliente</span>
        </Button>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/60">
            <TableRow className="border-border">
              <TableHead className="text-xs font-bold text-foreground">Cliente / Documento</TableHead>
              <TableHead className="text-xs font-bold text-foreground">Contato &amp; WhatsApp</TableHead>
              <TableHead className="text-xs font-bold text-foreground">LTV (Total Pago)</TableHead>
              <TableHead className="text-xs font-bold text-foreground">Status CRM</TableHead>
              <TableHead className="text-right text-xs font-bold text-foreground">Ações Rápidas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length === 0 ? (
              <TableRow className="border-border">
                <TableCell colSpan={5} className="text-center py-8 text-xs text-muted-foreground">
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((cli) => (
                <TableRow key={cli.$id} className="border-border hover:bg-muted/40 transition-colors">
                  <TableCell className="font-medium text-xs text-foreground">
                    <div>
                      <p className="font-bold text-foreground">{cli.name}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">{cli.document}</p>
                    </div>
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground">
                    <div>
                      <p className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span>{cli.email}</span>
                      </p>
                      <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Phone className="h-3 w-3 text-primary" />
                        <span>{cli.phone}</span>
                      </p>
                    </div>
                  </TableCell>

                  <TableCell className="text-xs font-extrabold text-foreground">
                    <div>
                      <p className="text-primary font-extrabold">
                        R$ {cli.totalPaid?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-normal">
                        {cli.totalInvoices || 0} faturas
                      </p>
                    </div>
                  </TableCell>

                  <TableCell>{getStatusBadge(cli.status)}</TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        onClick={() => onQuickCharge(cli)}
                        size="sm"
                        variant="ghost"
                        className="h-8 gap-1.5 text-xs text-primary hover:text-primary hover:bg-muted font-semibold"
                        title="Emitir Cobrança PIX Direta"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Cobrar</span>
                      </Button>

                      <Button
                        onClick={() => handleWhatsApp(cli.phone)}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-primary hover:bg-muted"
                        title="Abrir WhatsApp"
                      >
                        <Send className="h-4 w-4" />
                      </Button>

                      <Button
                        onClick={() => onViewClientDetails(cli)}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                        title="Ver Histórico CRM 360°"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      <Button
                        onClick={() => onEditClient(cli)}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                        title="Editar Cadastro / Alterar Status"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>

                      <Button
                        onClick={() => onDeleteClient(cli)}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600"
                        title="Excluir Cliente"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
