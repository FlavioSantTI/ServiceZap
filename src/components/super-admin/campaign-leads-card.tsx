'use client';

import React, { useEffect, useState } from 'react';
import { 
  Users, 
  MessageCircle, 
  ExternalLink, 
  Check, 
  Copy, 
  Sparkles, 
  RefreshCw,
  Phone,
  Briefcase,
  BarChart2
} from 'lucide-react';
import { getCampaignLeadsAction, updateLeadStatusAction } from '@/app/actions/campaign';
import { LeadData } from '@/types/campaign';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function CampaignLeadsCard() {
  const [leads, setLeads] = useState<LeadData[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const data = await getCampaignLeadsAction();
      setLeads(data);
    } catch (e) {
      console.error('Erro ao buscar leads da campanha:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const handleUpdateStatus = async (leadId: string, newStatus: LeadData['status']) => {
    await updateLeadStatusAction(leadId, newStatus);
    loadLeads();
  };

  const getProspectingUrl = (lead: LeadData) => {
    const firstName = lead.name.split(' ')[0] || 'Prestador';
    const text = `Olá ${firstName}! Aqui é da equipe do ServiceZap. ⚡

Recebemos sua candidatura para o Programa Piloto no seu serviço de ${lead.service_type}.

Seu perfil foi PRÉ-APROVADO para uma das vagas com 3 meses de acesso 100% gratuito no Plano Básico!

Podemos liberar seu acesso hoje para você começar a responder orçamentos no piloto automático?`;

    const cleanPhone = lead.whatsapp.replace(/\D/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  const handleCopyLink = (lead: LeadData) => {
    navigator.clipboard.writeText(getProspectingUrl(lead));
    setCopiedId(lead.$id || lead.whatsapp);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-warm-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-border pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-extrabold text-primary-foreground uppercase tracking-wider shadow-warm-xs">
              <Sparkles className="h-3 w-3" />
              Campanha Piloto Beta
            </span>
            <Badge variant="outline" className="border-border text-primary font-bold">
              {leads.length} candidaturas
            </Badge>
          </div>
          <h3 className="text-lg font-extrabold text-foreground tracking-tight">
            Leads Capturados pela Landing Page (5 Vagas Gratuitas)
          </h3>
          <p className="text-xs text-muted-foreground">
            Candidatos interessados em testar o ServiceZap por 3 meses no Plano Básico.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadLeads}
          disabled={loading}
          className="border-border text-foreground hover:bg-muted self-start sm:self-center rounded-xl cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Atualizar Leads
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-xs text-muted-foreground flex items-center justify-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin text-primary" />
          <span>Carregando candidaturas...</span>
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-8 text-xs text-muted-foreground bg-muted/40 rounded-xl border border-border p-4">
          Nenhuma candidatura registrada até o momento. Acesse a landing page em <code className="bg-primary/10 text-primary px-1 py-0.5 rounded font-mono">/campanha</code> para realizar um teste!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {leads.map((lead, idx) => (
            <div 
              key={lead.$id || idx}
              className="rounded-xl bg-background border border-border p-4 space-y-2.5 shadow-warm-xs hover:shadow-warm-sm transition"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  {lead.name}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  lead.status === 'aprovado' || lead.status === 'prospectado'
                    ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/25'
                    : 'bg-amber-500/15 text-amber-700 border-amber-500/25'
                }`}>
                  {lead.status === 'pendente_avaliacao' ? 'Para Avaliação' : lead.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border">
                <div className="flex items-center gap-1.5 truncate">
                  <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="truncate">{lead.whatsapp}</span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <Briefcase className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="truncate">{lead.service_type}</span>
                </div>
                <div className="col-span-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <BarChart2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>Volume: {lead.daily_volume || '50 a 200/dia'}</span>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between gap-2">
                <a
                  href={getProspectingUrl(lead)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleUpdateStatus(lead.$id || '', 'prospectado')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white shadow-warm-xs transition cursor-pointer"
                >
                  <MessageCircle className="h-3.5 w-3.5 fill-current" />
                  <span>Prospectar via WhatsApp</span>
                  <ExternalLink className="h-3 w-3" />
                </a>

                <button
                  onClick={() => handleCopyLink(lead)}
                  className="text-[11px] font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition cursor-pointer"
                >
                  {copiedId === (lead.$id || lead.whatsapp) ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span>{copiedId === (lead.$id || lead.whatsapp) ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
