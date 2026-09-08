'use client';

import React, { useState, useEffect, useRef } from 'react';
import { UserPlus, User, Mail, Phone, MapPin, FileText, CheckCircle2, Loader2, Search } from 'lucide-react';
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
import { fetchAddressByCep, formatCep } from '@/lib/services/cepService';

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
  const [loadingCep, setLoadingCep] = useState(false);
  const [cepNotFound, setCepNotFound] = useState(false);

  const addressNumberRef = useRef<HTMLInputElement>(null);

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
      setZipCode(clientToEdit.zipCode ? formatCep(clientToEdit.zipCode) : '');
      setNotes(clientToEdit.notes || '');
      setCepNotFound(false);
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
      setCepNotFound(false);
    }
  }, [clientToEdit, open]);

  // Consulta automática na API ViaCEP
  const handleCepSearch = async (cepInput: string) => {
    const rawDigits = cepInput.replace(/\D/g, '');
    if (rawDigits.length !== 8) return;

    setLoadingCep(true);
    setCepNotFound(false);

    try {
      const addressData = await fetchAddressByCep(rawDigits);
      if (addressData) {
        if (addressData.logradouro) setAddress(addressData.logradouro);
        if (addressData.bairro) setNeighborhood(addressData.bairro);
        if (addressData.localidade) setCity(addressData.localidade);
        if (addressData.uf) setState(addressData.uf.toUpperCase());
        setCepNotFound(false);
        // Foca automaticamente no campo de número
        setTimeout(() => {
          addressNumberRef.current?.focus();
        }, 100);
      } else {
        setCepNotFound(true);
      }
    } catch (err) {
      console.warn('Erro ao consultar ViaCEP:', err);
      setCepNotFound(true);
    } finally {
      setLoadingCep(false);
    }
  };

  const handleZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    setZipCode(formatted);

    const rawDigits = formatted.replace(/\D/g, '');
    if (rawDigits.length === 8) {
      handleCepSearch(rawDigits);
    } else {
      setCepNotFound(false);
    }
  };

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
      <DialogContent className="sm:max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500/15 text-[#E8622C] border border-orange-500/20">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {clientToEdit ? 'Editar Cliente' : 'Novo Cliente / Lead'}
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                Cadastre o cliente com dados completos para faturamento no Asaas e emissão de NF-e.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Seção 1: Dados Pessoais & Contato */}
          <div className="space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
              1. Dados Cadastrais & Contato
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Nome Completo / Razão Social
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input
                    required
                    placeholder="Ex: Dr. Roberto Mendes"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-9 h-9 text-xs rounded-xl border-zinc-200 dark:border-zinc-800 focus-visible:ring-[#E8622C]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  CPF / CNPJ
                </Label>
                <Input
                  required
                  placeholder="000.000.000-00"
                  value={document}
                  onChange={(e) => setDocument(e.target.value)}
                  className="h-9 text-xs rounded-xl border-zinc-200 dark:border-zinc-800 focus-visible:ring-[#E8622C]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1 sm:col-span-1">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  E-mail Comercial
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input
                    required
                    type="email"
                    placeholder="cliente@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 h-9 text-xs rounded-xl border-zinc-200 dark:border-zinc-800 focus-visible:ring-[#E8622C]"
                  />
                </div>
              </div>

              <div className="space-y-1 sm:col-span-1">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  WhatsApp / Telefone
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input
                    required
                    placeholder="(11) 99999-8888"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-9 h-9 text-xs rounded-xl border-zinc-200 dark:border-zinc-800 focus-visible:ring-[#E8622C]"
                  />
                </div>
              </div>

              <div className="space-y-1 sm:col-span-1">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Status no CRM
                </Label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ClientStatus)}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#E8622C]"
                >
                  <option value="active">Ativo (Cliente)</option>
                  <option value="lead">Lead (Em negociação)</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>
            </div>
          </div>

          {/* Seção 2: Endereço para Emissão de Nota Fiscal */}
          <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                2. Endereço (Necessário para Asaas & Focus NF-e)
              </span>
              {loadingCep && (
                <span className="flex items-center gap-1 text-[11px] text-[#E8622C] font-semibold animate-pulse">
                  <Loader2 className="h-3 w-3 animate-spin" /> Buscando no ViaCEP...
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    CEP (Auto-complete)
                  </Label>
                  {cepNotFound && (
                    <span className="text-[10px] text-amber-500 font-medium">Não encontrado</span>
                  )}
                </div>
                <div className="relative">
                  <Input
                    placeholder="00000-000"
                    value={zipCode}
                    maxLength={9}
                    onChange={handleZipCodeChange}
                    onBlur={() => handleCepSearch(zipCode)}
                    className={`h-9 text-xs rounded-xl pr-8 border-zinc-200 dark:border-zinc-800 focus-visible:ring-[#E8622C] ${cepNotFound ? 'border-amber-500/50' : ''}`}
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
                    {loadingCep ? (
                      <Loader2 className="h-4 w-4 animate-spin text-[#E8622C]" />
                    ) : (
                      <Search className="h-3.5 w-3.5" />
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Logradouro / Rua
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input
                    placeholder="Ex: Av. Paulista"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="pl-9 h-9 text-xs rounded-xl border-zinc-200 dark:border-zinc-800 focus-visible:ring-[#E8622C]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Número
                </Label>
                <Input
                  ref={addressNumberRef}
                  placeholder="1000"
                  value={addressNumber}
                  onChange={(e) => setAddressNumber(e.target.value)}
                  className="h-9 text-xs rounded-xl font-medium border-zinc-200 dark:border-zinc-800 focus-visible:ring-[#E8622C]"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Bairro
                </Label>
                <Input
                  placeholder="Bela Vista"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="h-9 text-xs rounded-xl border-zinc-200 dark:border-zinc-800 focus-visible:ring-[#E8622C]"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Cidade
                </Label>
                <Input
                  placeholder="São Paulo"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="h-9 text-xs rounded-xl border-zinc-200 dark:border-zinc-800 focus-visible:ring-[#E8622C]"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  UF
                </Label>
                <Input
                  placeholder="SP"
                  value={state}
                  onChange={(e) => setState(e.target.value.toUpperCase())}
                  className="h-9 text-xs rounded-xl uppercase font-medium border-zinc-200 dark:border-zinc-800 focus-visible:ring-[#E8622C]"
                  maxLength={2}
                />
              </div>
            </div>
          </div>

          {/* Seção 3: Observações CRM */}
          <div className="space-y-1.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Observações & Notas do CRM
            </Label>
            <Input
              placeholder="Ex: Preferências de atendimento, observações de faturamento..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-9 text-xs rounded-xl border-zinc-200 dark:border-zinc-800 focus-visible:ring-[#E8622C]"
            />
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
