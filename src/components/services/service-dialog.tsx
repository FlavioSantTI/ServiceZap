'use client';

import React, { useState, useEffect } from 'react';
import { Plus, DollarSign, Clock, Tag, FileText, CheckCircle2, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ServiceDocument } from '@/types/appwrite';

interface ServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceToEdit?: Partial<ServiceDocument> | null;
  onSave?: (service: Partial<ServiceDocument>) => void;
}

export function ServiceDialog({
  open,
  onOpenChange,
  serviceToEdit,
  onSave,
}: ServiceDialogProps) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [categories, setCategories] = useState<string[]>([
    'Procedimentos',
    'Avaliação',
    'Harmonização',
    'Consultas',
    'Estética Corporal',
    'Estética Facial',
  ]);
  const [category, setCategory] = useState('Procedimentos');
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (serviceToEdit) {
      setName(serviceToEdit.name || '');
      setPrice(serviceToEdit.price ? serviceToEdit.price.toString() : '');
      setDurationMinutes(serviceToEdit.durationMinutes ? serviceToEdit.durationMinutes.toString() : '60');
      const currentCat = serviceToEdit.category || 'Procedimentos';
      setCategory(currentCat);
      if (currentCat && !categories.includes(currentCat)) {
        setCategories((prev) => [...prev, currentCat]);
      }
      setDescription(serviceToEdit.description || '');
      setActive(serviceToEdit.active !== undefined ? serviceToEdit.active : true);
    } else {
      setName('');
      setPrice('');
      setDurationMinutes('60');
      setCategory(categories[0] || 'Procedimentos');
      setDescription('');
      setActive(true);
    }
  }, [serviceToEdit, open]);

  const handleAddCategory = () => {
    const trimmed = newCategoryInput.trim();
    if (trimmed) {
      if (!categories.includes(trimmed)) {
        setCategories((prev) => [...prev, trimmed]);
      }
      setCategory(trimmed);
      setNewCategoryInput('');
      setIsAddingNewCategory(false);
    }
  };

  const handleRemoveCategory = (catToRemove: string) => {
    if (categories.length <= 1) {
      alert('É necessário manter ao menos uma categoria.');
      return;
    }
    const updated = categories.filter((c) => c !== catToRemove);
    setCategories(updated);
    if (category === catToRemove) {
      setCategory(updated[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      const savedService: Partial<ServiceDocument> = {
        $id: serviceToEdit?.$id || `srv_${Math.floor(Math.random() * 900 + 100)}`,
        $createdAt: serviceToEdit?.$createdAt || new Date().toISOString(),
        tenantId: 'tenant_01',
        name,
        price: parseFloat(price) || 0,
        durationMinutes: parseInt(durationMinutes, 10) || 30,
        category,
        description,
        active,
      };

      if (onSave) {
        onSave(savedService);
      }

      setLoading(false);
      onOpenChange(false);
    }, 600);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {serviceToEdit ? 'Editar Serviço' : 'Novo Serviço'}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                Cadastre o serviço com preço padrão e duração para agilizar a emissão de cobranças.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Serviço
            </Label>
            <Input
              required
              placeholder="Ex: Limpeza de Pele Profunda"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9 text-xs rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Preço Padrão (R$)
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  required
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Duração (Minutos)
              </Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  required
                  type="number"
                  placeholder="60"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-xl"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Categoria
              </Label>
              {!isAddingNewCategory && (
                <button
                  type="button"
                  onClick={() => setIsAddingNewCategory(true)}
                  className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-500 transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  <span>Nova Categoria</span>
                </button>
              )}
            </div>

            {isAddingNewCategory ? (
              <div className="flex items-center gap-2">
                <Input
                  autoFocus
                  placeholder="Nome da nova categoria..."
                  value={newCategoryInput}
                  onChange={(e) => setNewCategoryInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCategory();
                    }
                  }}
                  className="h-9 text-xs rounded-xl flex-1"
                />
                <Button
                  type="button"
                  onClick={handleAddCategory}
                  size="sm"
                  className="h-9 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs"
                >
                  Adicionar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsAddingNewCategory(false);
                    setNewCategoryInput('');
                  }}
                  size="sm"
                  className="h-9 px-2 text-xs rounded-xl text-slate-400"
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                {categories.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => handleRemoveCategory(category)}
                    className="h-9 w-9 p-0 text-red-500 hover:bg-red-500/10 hover:text-red-600 rounded-xl"
                    title={`Excluir categoria "${category}"`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Descrição Detalhada
            </Label>
            <Input
              placeholder="Descrição exibida no comprovante PIX e corpo da NF-e"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-9 text-xs rounded-xl"
            />
          </div>

          <div className="flex items-center gap-2.5 pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Serviço ativo para novas cobranças</span>
            </label>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 text-xs rounded-xl"
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={loading}
              className="h-9 text-xs gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20"
            >
              {loading ? (
                <span>Salvando...</span>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{serviceToEdit ? 'Salvar Alterações' : 'Cadastrar Serviço'}</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
