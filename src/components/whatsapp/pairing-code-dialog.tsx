'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  KeyRound,
  Phone,
  Copy,
  Check,
  RefreshCw,
  Smartphone,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { requestPairingCodeAction, checkWhatsAppConnectionAction } from '@/app/actions/whatsapp';

interface PairingCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected?: () => void;
}

export function PairingCodeDialog({
  open,
  onOpenChange,
  onConnected,
}: PairingCodeDialogProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Limpa estados ao fechar
  useEffect(() => {
    if (!open) {
      setPairingCode(null);
      setError(null);
      setLoading(false);
      setIsConnected(false);
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }
  }, [open]);

  // Inicia polling quando o código é gerado para verificar se o usuário pareou no celular
  useEffect(() => {
    if (pairingCode && !isConnected) {
      pollingRef.current = setInterval(async () => {
        try {
          const res = await checkWhatsAppConnectionAction();
          if (res.status === 'connected') {
            setIsConnected(true);
            if (pollingRef.current) clearInterval(pollingRef.current);
            setTimeout(() => {
              if (onConnected) onConnected();
              onOpenChange(false);
            }, 2000);
          }
        } catch (e) {
          // Polling silencioso
        }
      }, 3000);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [pairingCode, isConnected, onConnected, onOpenChange]);

  const handleGenerateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await requestPairingCodeAction(phoneNumber);
      if (!res.success || !res.pairingCode) {
        throw new Error(res.error || 'Não foi possível gerar o código.');
      }
      setPairingCode(res.pairingCode);
    } catch (err: any) {
      setError(err.message || 'Falha ao solicitar código.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!pairingCode) return;
    navigator.clipboard.writeText(pairingCode.replace(/[^a-zA-Z0-9]/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-6 text-slate-900 dark:text-slate-100">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Conectar WhatsApp
                <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
                  Pairing Code
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Pareamento seguro via código de 8 dígitos no celular (Sem QR Code).
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isConnected ? (
          <div className="my-6 flex flex-col items-center justify-center py-6 text-center space-y-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
            <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 animate-bounce">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">WhatsApp Conectado com Sucesso!</h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xs">
              Sua conta está sincronizada. Mensagens enviadas e recebidas serão espelhadas em tempo real.
            </p>
          </div>
        ) : !pairingCode ? (
          <form onSubmit={handleGenerateCode} className="space-y-4 my-2">
            <div className="space-y-1.5">
              <Label htmlFor="wa-phone" className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                Número do WhatsApp (com DDI e DDD)
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="wa-phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Ex: 5511998887777"
                  className="pl-9 h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus-visible:ring-emerald-500"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Informe o número com o código do país (55 para Brasil) e DDD sem espaços ou traços.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <DialogFooter className="mt-5 flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-9 text-xs rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="h-9 gap-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20"
              >
                {loading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                <span>{loading ? 'Aguardando Servidor...' : 'Gerar Código de 8 Dígitos'}</span>
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4 my-2">
            {/* Bloco do Código de 8 Dígitos */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl relative overflow-hidden">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Seu Código de Pareamento
              </div>
              <div className="font-mono text-3xl font-extrabold tracking-widest text-emerald-600 dark:text-emerald-400 my-1 select-all">
                {pairingCode}
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleCopy}
                className="h-8 gap-1.5 text-xs rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 mt-1"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copiado!' : 'Copiar Código'}</span>
              </Button>
            </div>

            {/* Passo a Passo no Smartphone */}
            <div className="space-y-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 p-3.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100 mb-1">
                <Smartphone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Como confirmar no seu WhatsApp:</span>
              </div>
              <ol className="space-y-1 list-decimal pl-5 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                <li>Abra o WhatsApp no celular.</li>
                <li>Toque nos 3 pontinhos &gt; <strong className="text-slate-700 dark:text-slate-200">Aparelhos Conectados</strong>.</li>
                <li>Toque em <strong className="text-slate-700 dark:text-slate-200">Conectar um aparelho</strong>.</li>
                <li>Na parte inferior, selecione <strong className="text-emerald-600 dark:text-emerald-400">"Conectar com número de telefone"</strong>.</li>
                <li>Digite o código de 8 dígitos acima.</li>
              </ol>
            </div>

            {/* Indicador de Espera / Polling */}
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500 py-1">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-600" />
              <span>Aguardando confirmação do celular...</span>
            </div>

            <DialogFooter className="flex justify-between sm:justify-between items-center w-full mt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPairingCode(null)}
                className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 text-xs"
              >
                Alterar Número
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-9 text-xs rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Fechar
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
