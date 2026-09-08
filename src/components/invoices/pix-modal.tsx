'use client';

import React, { useState } from 'react';
import { QrCode, Copy, Check, ShieldCheck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { InvoiceDocument } from '@/types/appwrite';

interface PixModalProps {
  invoice: Partial<InvoiceDocument> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PixModal({ invoice, open, onOpenChange }: PixModalProps) {
  const [copied, setCopied] = useState(false);

  if (!invoice) return null;

  const handleCopy = () => {
    if (invoice.pixCopyPaste) {
      navigator.clipboard.writeText(invoice.pixCopyPaste);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/15 text-[#E8622C] mb-2">
            <QrCode className="h-6 w-6" />
          </div>
          <DialogTitle className="text-lg font-bold text-[#2B2B2B] dark:text-[#FAF6F2]">
            Pagamento via PIX
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral-500 dark:text-neutral-400">
            Escaneie o QR Code abaixo no app do seu banco ou copie a chave PIX Copia e Cola.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center p-4 space-y-4">
          {/* Valor da Cobrança */}
          <div className="text-center">
            <span className="text-xs font-semibold text-neutral-400 uppercase">Valor a Pagar</span>
            <h3 className="text-3xl font-extrabold text-[#E8622C] font-mono">
              R$ {invoice.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">Cliente: {invoice.clientName}</p>
          </div>

          {/* QR Code Frame */}
          <div className="p-3 bg-[#FAF6F2] dark:bg-neutral-800 rounded-2xl border-2 border-dashed border-orange-500/40 shadow-inner">
            {invoice.pixQrCodeUrl ? (
              <img
                src={invoice.pixQrCodeUrl}
                alt="QR Code PIX"
                className="w-48 h-48 rounded-xl object-contain bg-white p-2"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center bg-white dark:bg-neutral-900 rounded-xl text-neutral-400 text-xs">
                QR Code Indisponível
              </div>
            )}
          </div>

          {/* Copia e Cola Button */}
          <div className="w-full space-y-2">
            <Button
              onClick={handleCopy}
              className="w-full h-11 gap-2 bg-gradient-to-r from-[#F0806B] to-[#E8622C] hover:opacity-95 text-white font-bold rounded-2xl shadow-md shadow-orange-500/20"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Código PIX Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copiar Chave PIX Copia e Cola</span>
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 pt-2">
            <ShieldCheck className="h-3.5 w-3.5 text-[#E8622C]" />
            <span>Processado com segurança via Asaas Integrado</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
