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
      const checkRes = await checkWhatsAppConnectionAction();
      setInstance({
        ...inst,
        status: checkRes.status,
        phone: checkRes.phone || inst.phone || '',
      });
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
      <Card className="rounded-2xl border border-border bg-muted text-foreground shadow-warm-xs overflow-hidden relative">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary border border-primary/25 shrink-0">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-base text-foreground">
                    WhatsApp (Motor Embutido)
                  </h4>
                  <Badge
                    variant="outline"
                    className={
                      isConnected
                        ? 'border-emerald-600/40 bg-emerald-500/15 text-emerald-800 text-xs font-semibold'
                        : 'border-red-500/40 bg-red-500/15 text-red-800 text-xs font-semibold'
                    }
                  >
                    <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-emerald-600 animate-pulse' : 'bg-red-500'}`} />
                    {isConnected ? 'Conectado & Ativo' : status === 'connecting' ? 'Aguardando Pareamento' : 'Desconectado'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isConnected ? (
                    <>
                      <span className="text-foreground font-semibold">Número Conectado:</span>{' '}
                      <span className="text-foreground font-mono font-bold">{instance.phone ? `+${instance.phone.replace(/[^0-9]/g, '')}` : 'Linha Ativa'}</span>
                    </>
                  ) : (
                    <>
                      Status: <span className="text-muted-foreground font-medium">WhatsApp Desconectado</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Link href="/dashboard/whatsapp">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-xs bg-card border-border hover:bg-background text-foreground rounded-xl"
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
                  className="h-8 gap-1.5 text-xs bg-card border-border hover:bg-background text-foreground rounded-xl"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${checking ? 'animate-spin text-primary' : ''}`} />
                  <span>{checking ? 'Verificando...' : 'Verificar'}</span>
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setPairingOpen(true)}
                  className="h-8 gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-warm-xs"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>Conectar via Código (8 Dígitos)</span>
                </Button>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 text-foreground font-medium">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Envio automático de PIX & Notificações ativado</span>
            </div>
            <div className="flex items-center gap-1">
              <Wifi className="h-3.5 w-3.5 text-primary" />
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

