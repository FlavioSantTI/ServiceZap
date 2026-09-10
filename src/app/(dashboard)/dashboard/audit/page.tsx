'use client';

import React, { useEffect, useState } from 'react';
import {
  History,
  Search,
  Filter,
  Calendar,
  ClipboardList,
  Receipt,
  Users,
  Briefcase,
  UserCheck,
  FileCheck2,
  Lock,
  Sparkles,
  RefreshCw,
  Clock,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { fetchAuditLogsAction } from '@/app/actions/audit';
import { AuditLogDocument, AuditCategory } from '@/types/appwrite';

const categoryConfig: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  work_orders: {
    label: 'Orçamentos & O.S.',
    icon: ClipboardList,
    color: '#E8622C',
    bg: '#FFF3EE',
  },
  invoices: {
    label: 'Faturas & PIX',
    icon: Receipt,
    color: '#10B981',
    bg: '#EBF6EE',
  },
  appointments: {
    label: 'Agenda',
    icon: Calendar,
    color: '#E8622C',
    bg: '#FFF3EE',
  },
  clients: {
    label: 'Clientes CRM',
    icon: Users,
    color: '#6366F1',
    bg: '#F0EEFC',
  },
  services: {
    label: 'Serviços',
    icon: Briefcase,
    color: '#6366F1',
    bg: '#F0EEFC',
  },
  team: {
    label: 'Equipe & Acessos',
    icon: UserCheck,
    color: '#8B5CF6',
    bg: '#F5F3FF',
  },
  fiscal: {
    label: 'Fiscal / NF-e',
    icon: FileCheck2,
    color: '#F59E0B',
    bg: '#FFF9E6',
  },
  auth: {
    label: 'Autenticação & Segurança',
    icon: Lock,
    color: '#3B82F6',
    bg: '#EFF6FF',
  },
  super_admin: {
    label: 'Super Admin',
    icon: Sparkles,
    color: '#E8622C',
    bg: '#FFF3EE',
  },
};

export default function AuditLogsPage() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLogDocument[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchAuditLogsAction({
        tenantId: 'tenant_01',
        category: categoryFilter as any,
        searchQuery: search,
      });
      setLogs(data);
    } catch (e) {
      console.error('Erro ao buscar logs de auditoria:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [categoryFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl bg-white p-6 shadow-warm-xs border border-[#DECDBB]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-6 items-center px-2 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-[#FFF3EE] text-[#E8622C] border border-[#F0806B]/20">
              Segurança & Governança
            </span>
            <span className="text-xs font-bold text-primary flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              Segurança &amp; Compliance
            </span>
            <span className="text-xs text-muted-foreground">Visibilidade Completa</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <History className="h-6 w-6 text-primary" />
            Trilha de Auditoria de Ações
          </h1>
          <p className="text-sm text-muted-foreground">
            Histórico imutável de todas as ações executadas pelos colaboradores da empresa para controle gerencial.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="border-border bg-card text-foreground hover:bg-muted"
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 rounded-2xl border border-border bg-card p-4 shadow-warm-xs">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por colaborador, ação ou detalhes do evento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border text-foreground placeholder:text-muted-foreground"
          />
        </form>

        <div className="flex items-center gap-2">
          <Select value={categoryFilter} onValueChange={(val: string | null) => setCategoryFilter(val || 'all')}>
            <SelectTrigger className="w-[200px] bg-card border-border text-foreground">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground">
              <SelectItem value="all">Todas as Categorias</SelectItem>
              <SelectItem value="work_orders">Orçamentos &amp; O.S.</SelectItem>
              <SelectItem value="invoices">Faturas &amp; Cobranças PIX</SelectItem>
              <SelectItem value="appointments">Agenda &amp; Atendimentos</SelectItem>
              <SelectItem value="team">Equipe &amp; Permissões</SelectItem>
              <SelectItem value="clients">Clientes CRM</SelectItem>
              <SelectItem value="fiscal">Fiscal / NF-e</SelectItem>
              <SelectItem value="auth">Segurança &amp; Auth</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Timeline List */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-warm-xs space-y-6">
        {loading ? (
          <div className="text-center py-12 text-sm text-muted-foreground">
            Carregando eventos de auditoria...
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">
            Nenhum registro de auditoria encontrado para os critérios selecionados.
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-border">
            {logs.map((log) => {
              const conf = categoryConfig[log.category] || {
                label: log.category,
                icon: ShieldCheck,
                color: '#D9502A',
                bg: '#EDDBC0',
              };
              const Icon = conf.icon;
              const dateFormatted = log.created_at || (log as any).$createdAt
                ? new Date(log.created_at || (log as any).$createdAt).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Recentemente';

              return (
                <div key={log.$id} className="relative group">
                  {/* Timeline Dot */}
                  <div
                    className="absolute -left-[31px] top-1 h-6 w-6 rounded-full border-2 border-card flex items-center justify-center shadow-xs transition-transform group-hover:scale-110"
                    style={{ backgroundColor: conf.color }}
                  >
                    <Icon className="h-3 w-3 text-white" />
                  </div>

                  <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2 hover:border-primary/40 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md"
                          style={{ backgroundColor: conf.bg, color: conf.color }}
                        >
                          {conf.label}
                        </span>
                        <span className="font-bold text-sm text-foreground">
                          {log.userName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({log.userRole?.toUpperCase() || 'COLABORADOR'})
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{dateFormatted}</span>
                      </div>
                    </div>

                    <div className="text-sm font-medium text-foreground">
                      {log.details || log.action}
                    </div>

                    {log.entityName && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                        <span className="font-semibold text-foreground">Alvo:</span> {log.entityName}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
