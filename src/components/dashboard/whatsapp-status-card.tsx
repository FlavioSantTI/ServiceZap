'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageSquare, CheckCircle2, RefreshCw, KeyRound, Wifi, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockWhatsAppInstance } from '@/lib/mock-data';
import { PairingCodeDialog } from '@/components/whatsapp/pairing-code-dialog';
import { checkWhatsAppConnectionAction, getWhatsAppInstanceAction } from '@/app/actions/whatsapp';
import { WhatsAppStatus } from '@/types/appwrite';

export function WhatsAppStatusCard() {
  const [instance, setInstance] = useState(mockWhatsAppInstance);
  const [status, setStatus] = useState<WhatsAppStatus>(mockWhatsAppInstance.status || 'connected');
  const [pairingOpen, setPairingOpen] = useState(false);
  const [checking, setChecking] = useState(false);

  const isConnected = status === 'connected';

  const loadStatus = async () => {
    try {
      setChecking(true);
      const inst = await getWhatsAppInstanceAction();
      setInstance(inst);
      const checkRes = await checkWhatsAppConnectionAction();
      setStatus(checkRes.status);
    } catch (e) {
      // mantém o status atual em caso de erro transitório
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  return (
    <>
      <Card className="border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white shadow-lg overflow-hidden relative">
        <div className="absolute -right-6 -bottom-6 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-base text-white">
                    WhatsApp (Evolution API)
                  </h4>
                  <Badge
                    variant="outline"
                    className={
                      isConnected
                        ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300 text-[10px]'
                        : 'border-rose-500/40 bg-rose-500/20 text-rose-300 text-[10px]'
                    }
                  >
                    <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                    {isConnected ? 'Conectado & Ativo' : status === 'connecting' ? 'Aguardando Pareamento' : 'Desconectado'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Instância: <span className="text-slate-200 font-mono">{instance.instanceName || 'ServiceZap Main'}</span> {instance.phone ? `(${instance.phone})` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Link href="/dashboard/whatsapp">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-xs bg-slate-800/80 border-slate-700 hover:bg-slate-800 text-slate-200"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Central de Conversas</span>
                </Button>
              </Link>

              {isConnected ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadStatus}
                  disabled={checking}
                  className="h-8 gap-1.5 text-xs bg-slate-800/80 border-slate-700 hover:bg-slate-800 text-slate-200"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${checking ? 'animate-spin text-emerald-400' : ''}`} />
                  <span>{checking ? 'Verificando...' : 'Verificar'}</span>
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setPairingOpen(true)}
                  className="h-8 gap-1.5 text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>Conectar via Código (8 Dígitos)</span>
                </Button>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>Envio automático de PIX & Notificações ativado</span>
            </div>
            <div className="flex items-center gap-1">
              <Wifi className="h-3.5 w-3.5 text-emerald-400" />
              <span>Latência: 42ms</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <PairingCodeDialog
        open={pairingOpen}
        onOpenChange={setPairingOpen}
        onConnected={loadStatus}
      />
    </>
  );
}

