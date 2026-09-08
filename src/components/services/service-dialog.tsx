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
  const [unit, setUnit] = useState('un');
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

  const unitsList = [
    { value: 'un', label: 'Unidade (un)' },
    { value: 'hora', label: 'Hora / Horas (hr)' },
    { value: 'kg', label: 'Quilo (kg)' },
    { value: 'metro', label: 'Metro Linear (m)' },
    { value: 'm²', label: 'Metro Quadrado (m²)' },
    { value: 'diária', label: 'Diária (dia)' },
    { value: 'sessão', label: 'Sessão / Atendimento' },
    { value: 'serviço', label: 'Serviço Global' },
  ];

  useEffect(() => {
    if (serviceToEdit) {
      setName(serviceToEdit.name || '');
      setPrice(serviceToEdit.price ? serviceToEdit.price.toString() : '');
      setDurationMinutes(serviceToEdit.durationMinutes ? serviceToEdit.durationMinutes.toString() : '60');
      setUnit(serviceToEdit.unit || 'un');
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
      setUnit('un');
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
        unit: unit.trim() || 'un',
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
      <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500/15 text-[#E8622C] border border-orange-500/20">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {serviceToEdit ? 'Editar Serviço' : 'Novo Serviço'}
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                Cadastre o serviço com preço padrão e duração para agilizar a emissão de cobranças.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Serviço
            </Label>
            <Input
              required
              placeholder="Ex: Limpeza de Pele Profunda"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9 text-xs rounded-xl border-zinc-200 dark:border-zinc-800 focus-visible:ring-[#E8622C]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Preço Padrão (R$)
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  required
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-xl border-zinc-200 dark:border-zinc-800 focus-visible:ring-[#E8622C]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Unidade de Medida
              </Label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full h-9 px-3 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#E8622C]"
              >
                {unitsList.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Duração (Minutos)
              </Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  required
                  type="number"
                  placeholder="60"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-xl border-zinc-200 dark:border-zinc-800 focus-visible:ring-[#E8622C]"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Categoria
              </Label>
              {!isAddingNewCategory && (
                <button
                  type="button"
                  onClick={() => setIsAddingNewCategory(true)}
                  className="flex items-center gap-1 text-[11px] font-bold text-[#E8622C] hover:opacity-80 transition-colors"
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
                  className="h-9 text-xs rounded-xl flex-1 border-zinc-200 dark:border-zinc-800 focus-visible:ring-[#E8622C]"
                />
                <Button
                  type="button"
                  onClick={handleAddCategory}
                  size="sm"
                  className="h-9 px-3 bg-gradient-to-r from-[#F0806B] to-[#E8622C] hover:opacity-95 text-white font-bold rounded-xl text-xs shadow-md shadow-orange-500/20"
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
                  className="h-9 px-2 text-xs rounded-xl text-zinc-400"
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 z-10" />
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#E8622C]"
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
            <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Descrição Detalhada
            </Label>
            <Input
              placeholder="Descrição exibida no comprovante PIX e corpo da NF-e"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-9 text-xs rounded-xl border-zinc-200 dark:border-zinc-800 focus-visible:ring-[#E8622C]"
            />
          </div>

          <div className="flex items-center gap-2.5 pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-[#E8622C] focus:ring-[#E8622C] accent-[#E8622C]"
              />
              <span>Serviço ativo para novas cobranças</span>
            </label>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 text-xs rounded-xl border-zinc-200 dark:border-zinc-800"
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={loading}
              className="h-9 text-xs gap-2 bg-gradient-to-r from-[#F0806B] to-[#E8622C] hover:opacity-95 text-white font-bold rounded-xl shadow-md shadow-orange-500/20"
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
