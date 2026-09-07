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
          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 hover:bg-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" />
            <span>Ativo</span>
          </Badge>
        );
      case 'lead':
        return (
          <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 gap-1 hover:bg-blue-500/20">
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por nome, documento, e-mail ou WhatsApp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <Filter className="h-3.5 w-3.5 text-slate-400 ml-2" />
            {(['all', 'active', 'lead', 'inactive'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  statusFilter === st
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
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
          className="h-9 gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Novo Cliente</span>
        </Button>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/80 dark:bg-slate-950/60">
            <TableRow>
              <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">Cliente / Documento</TableHead>
              <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">Contato & WhatsApp</TableHead>
              <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">LTV (Total Pago)</TableHead>
              <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">Status CRM</TableHead>
              <TableHead className="text-right text-xs font-bold text-slate-700 dark:text-slate-300">Ações Rápidas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-xs text-slate-400">
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((cli) => (
                <TableRow key={cli.$id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <TableCell className="font-medium text-xs text-slate-900 dark:text-slate-100">
                    <div>
                      <p className="font-bold">{cli.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{cli.document}</p>
                    </div>
                  </TableCell>

                  <TableCell className="text-xs text-slate-600 dark:text-slate-300">
                    <div>
                      <p className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-slate-400" />
                        <span>{cli.email}</span>
                      </p>
                      <p className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Phone className="h-3 w-3 text-emerald-500" />
                        <span>{cli.phone}</span>
                      </p>
                    </div>
                  </TableCell>

                  <TableCell className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                    <div>
                      <p className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                        R$ {cli.totalPaid?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                      </p>
                      <p className="text-[10px] text-slate-400 font-normal">
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
                        className="h-8 gap-1.5 text-xs text-emerald-600 hover:text-emerald-500 hover:bg-emerald-500/10 font-semibold"
                        title="Emitir Cobrança PIX Direta"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Cobrar</span>
                      </Button>

                      <Button
                        onClick={() => handleWhatsApp(cli.phone)}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-emerald-500 hover:bg-emerald-500/10"
                        title="Abrir WhatsApp"
                      >
                        <Send className="h-4 w-4" />
                      </Button>

                      <Button
                        onClick={() => onViewClientDetails(cli)}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-blue-500 hover:bg-blue-500/10"
                        title="Ver Histórico CRM 360°"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      <Button
                        onClick={() => onEditClient(cli)}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                        title="Editar Cadastro / Alterar Status"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>

                      <Button
                        onClick={() => onDeleteClient(cli)}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-red-500 hover:bg-red-500/10 hover:text-red-600"
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
