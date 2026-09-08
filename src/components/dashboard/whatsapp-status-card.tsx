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
      <Card className="rounded-2xl border border-neutral-800 bg-[#252423] text-[#FAF6F2] shadow-warm-md overflow-hidden relative">
        <div className="absolute -right-6 -bottom-6 h-32 w-32 rounded-full bg-orange-500/10 blur-2xl pointer-events-none" />

        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/20 text-[#F0806B] border border-orange-500/30 shrink-0">
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
                        ? 'border-orange-500/40 bg-orange-500/20 text-orange-300 text-[10px]'
                        : 'border-red-500/40 bg-red-500/20 text-red-300 text-[10px]'
                    }
                  >
                    <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-[#F0806B] animate-pulse' : 'bg-red-400'}`} />
                    {isConnected ? 'Conectado & Ativo' : status === 'connecting' ? 'Aguardando Pareamento' : 'Desconectado'}
                  </Badge>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Instância: <span className="text-white font-mono">{instance.instanceName || 'ServiceZap Main'}</span> {instance.phone ? `(${instance.phone})` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Link href="/dashboard/whatsapp">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-xs bg-neutral-800/80 border-neutral-700 hover:bg-neutral-800 text-neutral-200 rounded-xl"
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
                  className="h-8 gap-1.5 text-xs bg-neutral-800/80 border-neutral-700 hover:bg-neutral-800 text-neutral-200 rounded-xl"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${checking ? 'animate-spin text-orange-400' : ''}`} />
                  <span>{checking ? 'Verificando...' : 'Verificar'}</span>
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setPairingOpen(true)}
                  className="h-8 gap-1.5 text-xs bg-gradient-to-r from-[#F0806B] to-[#E8622C] hover:opacity-95 text-white font-bold rounded-xl shadow-md shadow-orange-500/20"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>Conectar via Código (8 Dígitos)</span>
                </Button>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
            <div className="flex items-center gap-1.5 text-[#F0806B]">
              <CheckCircle2 className="h-4 w-4" />
              <span>Envio automático de PIX & Notificações ativado</span>
            </div>
            <div className="flex items-center gap-1">
              <Wifi className="h-3.5 w-3.5 text-orange-400" />
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

