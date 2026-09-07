'use client';

import React, { useState, useEffect } from 'react';
import { UserPlus, User, Mail, Phone, MapPin, FileText, CheckCircle2 } from 'lucide-react';
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
import { ClientDocument, ClientStatus } from '@/types/appwrite';

interface ClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientToEdit?: Partial<ClientDocument> | null;
  onSave?: (client: Partial<ClientDocument>) => void;
}

export function ClientDialog({
  open,
  onOpenChange,
  clientToEdit,
  onSave,
}: ClientDialogProps) {
  const [name, setName] = useState('');
  const [document, setDocument] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<ClientStatus>('active');
  const [address, setAddress] = useState('');
  const [addressNumber, setAddressNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (clientToEdit) {
      setName(clientToEdit.name || '');
      setDocument(clientToEdit.document || '');
      setEmail(clientToEdit.email || '');
      setPhone(clientToEdit.phone || '');
      setStatus(clientToEdit.status || 'active');
      setAddress(clientToEdit.address || '');
      setAddressNumber(clientToEdit.addressNumber || '');
      setNeighborhood(clientToEdit.neighborhood || '');
      setCity(clientToEdit.city || '');
      setState(clientToEdit.state || '');
      setZipCode(clientToEdit.zipCode || '');
      setNotes(clientToEdit.notes || '');
    } else {
      setName('');
      setDocument('');
      setEmail('');
      setPhone('');
      setStatus('active');
      setAddress('');
      setAddressNumber('');
      setNeighborhood('');
      setCity('');
      setState('');
      setZipCode('');
      setNotes('');
    }
  }, [clientToEdit, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      const savedClient: Partial<ClientDocument> = {
        $id: clientToEdit?.$id || `cli_${Math.floor(Math.random() * 900 + 100)}`,
        $createdAt: clientToEdit?.$createdAt || new Date().toISOString(),
        tenantId: 'tenant_01',
        name,
        document,
        email,
        phone,
        status,
        totalPaid: clientToEdit?.totalPaid || 0,
        totalInvoices: clientToEdit?.totalInvoices || 0,
        address,
        addressNumber,
        neighborhood,
        city,
        state,
        zipCode,
        notes,
      };

      if (onSave) {
        onSave(savedClient);
      }

      setLoading(false);
      onOpenChange(false);
    }, 600);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {clientToEdit ? 'Editar Cliente' : 'Novo Cliente / Lead'}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                Cadastre o cliente com dados completos para faturamento no Asaas e emissão de NF-e.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Seção 1: Dados Pessoais & Contato */}
          <div className="space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              1. Dados Cadastrais & Contato
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nome Completo / Razão Social
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    required
                    placeholder="Ex: Dr. Roberto Mendes"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-9 h-9 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  CPF / CNPJ
                </Label>
                <Input
                  required
                  placeholder="000.000.000-00"
                  value={document}
                  onChange={(e) => setDocument(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1 sm:col-span-1">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  E-mail Comercial
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    required
                    type="email"
                    placeholder="cliente@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 h-9 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1 sm:col-span-1">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  WhatsApp / Telefone
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    required
                    placeholder="(11) 99999-8888"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-9 h-9 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1 sm:col-span-1">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Status no CRM
                </Label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ClientStatus)}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                >
                  <option value="active">Ativo (Cliente)</option>
                  <option value="lead">Lead (Em negociação)</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>
            </div>
          </div>

          {/* Seção 2: Endereço para Emissão de Nota Fiscal */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              2. Endereço (Necessário para Asaas & Focus NF-e)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  CEP
                </Label>
                <Input
                  placeholder="00000-000"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Logradouro / Rua
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Ex: Av. Paulista"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="pl-9 h-9 text-xs rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Número
                </Label>
                <Input
                  placeholder="1000"
                  value={addressNumber}
                  onChange={(e) => setAddressNumber(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Bairro
                </Label>
                <Input
                  placeholder="Bela Vista"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Cidade
                </Label>
                <Input
                  placeholder="São Paulo"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  UF
                </Label>
                <Input
                  placeholder="SP"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="h-9 text-xs rounded-xl uppercase"
                  maxLength={2}
                />
              </div>
            </div>
          </div>

          {/* Seção 3: Observações CRM */}
          <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Observações & Notas do CRM
            </Label>
            <Input
              placeholder="Ex: Preferências de atendimento, observações de faturamento..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-9 text-xs rounded-xl"
            />
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
                  <span>{clientToEdit ? 'Salvar Alterações' : 'Cadastrar Cliente'}</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
