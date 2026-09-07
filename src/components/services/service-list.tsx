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
  MoreHorizontal,
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
import { ServiceDocument } from '@/types/appwrite';

interface ServiceListProps {
  services: Partial<ServiceDocument>[];
  onEditService: (service: Partial<ServiceDocument>) => void;
  onNewService: () => void;
}

export function ServiceList({ services, onEditService, onNewService }: ServiceListProps) {
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
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <Filter className="h-3.5 w-3.5 text-slate-400 ml-2" />
              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  categoryFilter === 'all'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
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
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm font-bold'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
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
          className="h-9 gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Novo Serviço</span>
        </Button>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/80 dark:bg-slate-950/60">
            <TableRow>
              <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">Serviço / Procedimento</TableHead>
              <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">Categoria</TableHead>
              <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">Preço Padrão</TableHead>
              <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">Duração</TableHead>
              <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">Status</TableHead>
              <TableHead className="text-right text-xs font-bold text-slate-700 dark:text-slate-300">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredServices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-xs text-slate-400">
                  Nenhum serviço encontrado no catálogo.
                </TableCell>
              </TableRow>
            ) : (
              filteredServices.map((srv) => (
                <TableRow key={srv.$id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <TableCell className="font-medium text-xs text-slate-900 dark:text-slate-100">
                    <div>
                      <p className="font-bold">{srv.name}</p>
                      <p className="text-[11px] text-slate-400 font-normal truncate max-w-xs">{srv.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[11px] border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                      <Tag className="mr-1 h-3 w-3 text-slate-400" />
                      {srv.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                    R$ {srv.price?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>{srv.durationMinutes} min</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {srv.active ? (
                      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 hover:bg-emerald-500/20">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Ativo</span>
                      </Badge>
                    ) : (
                      <Badge className="bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30 gap-1 hover:bg-slate-500/20">
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
                        className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                        title="Editar Serviço"
                      >
                        <Edit2 className="h-4 w-4" />
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
