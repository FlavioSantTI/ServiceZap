'use client';

import React from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Receipt,
  Send,
  Plus,
  Building2,
  Calendar,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClientDocument } from '@/types/appwrite';
import { mockInvoices } from '@/lib/mock-data';

interface ClientDetailsModalProps {
  client: Partial<ClientDocument> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNewChargeForClient?: (client: Partial<ClientDocument>) => void;
}

export function ClientDetailsModal({
  client,
  open,
  onOpenChange,
  onNewChargeForClient,
}: ClientDetailsModalProps) {
  if (!client) return null;

  const clientInvoices = mockInvoices.filter((inv) => inv.clientName === client.name);

  const handleWhatsAppClick = () => {
    if (client.phone) {
      const cleanPhone = client.phone.replace(/\D/g, '');
      window.open(`https://wa.me/55${cleanPhone}`, '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/10 text-[#E8622C] font-bold text-lg">
                {client.name?.charAt(0) || 'C'}
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {client.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                  Doc: {client.document} • ID: {client.asaasCustomerId || client.$id}
                </DialogDescription>
              </div>
            </div>

            <Badge className="bg-orange-500/15 text-[#E8622C] border-orange-500/30">
              {client.status === 'active' ? 'Cliente Ativo' : client.status === 'lead' ? 'Lead' : 'Inativo'}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Métricas do Cliente (LTV & Faturas) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <DollarSign className="h-4 w-4 text-[#E8622C]" />
                <span>LTV (Total Pago)</span>
              </div>
              <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                R$ {client.totalPaid?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Receipt className="h-4 w-4 text-[#E8622C]" />
                <span>Histórico de Faturas</span>
              </div>
              <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                {client.totalInvoices || 0} Faturas
              </p>
            </div>
          </div>

          {/* Dados de Contato e Endereço */}
          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span>{client.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span>{client.phone}</span>
            </div>
            {client.address && (
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>
                  {client.address}, {client.addressNumber} - {client.neighborhood}, {client.city}/{client.state}
                </span>
              </div>
            )}
            {client.notes && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-slate-500 italic">
                "{client.notes}"
              </div>
            )}
          </div>

          {/* Histórico Recente de Cobranças */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Cobranças Vinculadas
            </span>

            {clientInvoices.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">Nenhuma fatura registrada para este cliente.</p>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {clientInvoices.map((inv) => (
                  <div
                    key={inv.$id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-100/60 dark:bg-slate-800/60 text-xs border border-slate-200 dark:border-slate-800"
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">{inv.description}</p>
                      <p className="text-[11px] text-slate-400">Vencimento: {inv.dueDate}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-slate-900 dark:text-slate-100">
                        R$ {inv.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <span className="text-[10px] uppercase font-bold text-[#E8622C]">
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ações Rápidas do Modal */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              onClick={handleWhatsAppClick}
              variant="outline"
              size="sm"
              className="h-9 gap-2 text-xs border-orange-500/30 text-[#E8622C] hover:bg-orange-500/10"
            >
              <Send className="h-4 w-4" />
              <span>Abrir WhatsApp</span>
            </Button>

            <Button
              onClick={() => {
                onOpenChange(false);
                if (onNewChargeForClient) onNewChargeForClient(client);
              }}
              size="sm"
              className="h-9 gap-2 text-xs bg-gradient-to-r from-[#F0806B] to-[#E8622C] hover:opacity-95 text-white font-bold rounded-xl shadow-warm-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Emitir Cobrança PIX</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
