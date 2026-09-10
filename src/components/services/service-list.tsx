'use client';

import React, { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  Clock,
  Tag,
  Edit2,
  Trash2,
  CheckCircle2,
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
import { ServiceDocument } from '@/types/appwrite';

interface ServiceListProps {
  services: Partial<ServiceDocument>[];
  onEditService: (service: Partial<ServiceDocument>) => void;
  onDeleteService?: (serviceId: string) => void;
  onNewService: () => void;
}

export function ServiceList({
  services,
  onEditService,
  onDeleteService,
  onNewService,
}: ServiceListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const categories = Array.from(new Set(services.map((s) => s.category).filter(Boolean)));

  const filteredServices = services.filter((srv) => {
    const matchesSearch =
      srv.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      srv.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || srv.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const handleDelete = (srv: Partial<ServiceDocument>) => {
    if (!srv.$id) return;
    if (confirm(`Tem certeza que deseja excluir o serviço "${srv.name}" do catálogo?`)) {
      if (onDeleteService) {
        onDeleteService(srv.$id);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Filters & Add Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar serviço por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl"
            />
          </div>

          {categories.length > 0 && (
            <div className="flex items-center gap-1 bg-muted p-1 rounded-xl border border-border text-xs">
              <Filter className="h-3.5 w-3.5 text-muted-foreground ml-2" />
              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  categoryFilter === 'all'
                    ? 'bg-card text-foreground shadow-sm font-bold border border-border/50'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Todas
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat!)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    categoryFilter === cat
                      ? 'bg-card text-foreground shadow-sm font-bold border border-border/50'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        <Button
          onClick={onNewService}
          size="sm"
          className="h-9 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-warm-xs w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Novo Serviço</span>
        </Button>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/60">
            <TableRow className="border-border">
              <TableHead className="text-xs font-bold text-foreground">Serviço / Procedimento</TableHead>
              <TableHead className="text-xs font-bold text-foreground">Categoria</TableHead>
              <TableHead className="text-xs font-bold text-foreground">Preço Padrão</TableHead>
              <TableHead className="text-xs font-bold text-foreground">Duração</TableHead>
              <TableHead className="text-xs font-bold text-foreground">Status</TableHead>
              <TableHead className="text-right text-xs font-bold text-foreground">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredServices.length === 0 ? (
              <TableRow className="border-border">
                <TableCell colSpan={6} className="text-center py-12 text-xs text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Tag className="h-8 w-8 text-muted-foreground/60" />
                    <p className="font-semibold text-foreground">Nenhum serviço encontrado no catálogo.</p>
                    <p className="text-[11px] text-muted-foreground">Clique em &ldquo;Novo Serviço&rdquo; acima para cadastrar seu primeiro item.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredServices.map((srv) => (
                <TableRow key={srv.$id} className="border-border hover:bg-muted/40 transition-colors">
                  <TableCell className="font-medium text-xs text-foreground">
                    <div>
                      <p className="font-bold text-foreground">{srv.name}</p>
                      <p className="text-[11px] text-muted-foreground font-normal truncate max-w-xs">{srv.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[11px] border-border text-muted-foreground bg-muted/30">
                      <Tag className="mr-1 h-3 w-3 text-muted-foreground" />
                      {srv.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-extrabold text-foreground">
                    <div>
                      <span>R$ {srv.price?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      <span className="text-[11px] font-normal text-muted-foreground ml-1">/ {srv.unit || 'un'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{srv.durationMinutes} min</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {srv.active ? (
                      <Badge className="bg-primary/15 text-primary border-primary/30 gap-1 hover:bg-primary/20">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Ativo</span>
                      </Badge>
                    ) : (
                      <Badge className="bg-muted text-muted-foreground border-border gap-1">
                        <XCircle className="h-3 w-3" />
                        <span>Inativo</span>
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        onClick={() => onEditService(srv)}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                        title="Editar Serviço"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(srv)}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-500/10"
                        title="Excluir Serviço"
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
