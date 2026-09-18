'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  MessageCircle, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Copy, 
  Check, 
  User, 
  Briefcase,
  Phone,
  BarChart3,
  Send,
  Database,
  RefreshCw,
  ExternalLink,
  Users
} from 'lucide-react';
import { submitCampaignLeadAction, getCampaignLeadsAction } from '@/app/actions/campaign';
import { LeadData } from '@/types/campaign';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPhone?: string;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  defaultPhone = '5511999999999'
}) => {
  const [phoneNumber, setPhoneNumber] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('servicezap_dest_phone') || defaultPhone;
    }
    return defaultPhone;
  });
  
  // Form fields
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [dailyVolume, setDailyVolume] = useState('50 a 200 mensagens/dia');
  
  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedLead, setSubmittedLead] = useState<LeadData | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  
  // Owner tabs
  const [activeTab, setActiveTab] = useState<'form' | 'admin'>('form');
  const [localLeads, setLocalLeads] = useState<LeadData[]>([]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Load recent campaign leads
      getCampaignLeadsAction().then(setLocalLeads);
    } else {
      document.body.style.overflow = 'unset';
      setTimeout(() => {
        setSubmittedLead(null);
        setErrorMsg('');
      }, 300);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSavePhone = (newPhone: string) => {
    const clean = newPhone.replace(/\D/g, '');
    setPhoneNumber(clean);
    if (typeof window !== 'undefined') {
      localStorage.setItem('servicezap_dest_phone', clean);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Por favor, informe o seu nome ou o da sua empresa.');
      return;
    }
    const cleanPhone = whatsapp.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg('Por favor, informe um WhatsApp válido com DDD.');
      return;
    }
    if (!serviceType.trim()) {
      setErrorMsg('Por favor, especifique o serviço que você presta.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await submitCampaignLeadAction({
        name: name.trim(),
        whatsapp: cleanPhone,
        service_type: serviceType.trim(),
        daily_volume: dailyVolume,
        notes: `Candidato às 5 vagas. Volume: ${dailyVolume}`
      });

      const newLead: LeadData = {
        $id: res.leadId,
        name: name.trim(),
        whatsapp: cleanPhone,
        service_type: serviceType.trim(),
        daily_volume: dailyVolume,
        status: 'pendente_avaliacao',
        created_at: new Date().toISOString()
      };

      setSubmittedLead(newLead);
      const updated = await getCampaignLeadsAction();
      setLocalLeads(updated);
    } catch (err: any) {
      setErrorMsg('Ocorreu um erro ao enviar sua candidatura. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWhatsAppEvaluationUrl = (lead: LeadData) => {
    const msg = `Olá! Acabei de preencher o formulário de candidatura para o Programa Piloto do ServiceZap.

👤 Nome: ${lead.name}
📱 WhatsApp: ${lead.whatsapp}
🔧 Serviço: ${lead.service_type}
📊 Volume: ${lead.daily_volume}

Gostaria de solicitar a avaliação do meu perfil para liberação de uma das 5 vagas gratuitas por 3 meses no Plano Básico!`;

    const dest = phoneNumber.replace(/\D/g, '') || defaultPhone;
    return `https://wa.me/${dest}?text=${encodeURIComponent(msg)}`;
  };

  const getProspectingMessageForLead = (lead: LeadData) => {
    const firstName = lead.name.split(' ')[0] || 'Prestador';
    const text = `Olá ${firstName}! Aqui é da equipe do ServiceZap. ⚡

Recebemos seu formulário de candidatura para o Programa Piloto no seu serviço de ${lead.service_type}.

Seu perfil foi PRÉ-APROVADO para uma das 5 vagas com 3 meses de acesso 100% gratuito no Plano Básico!

Queremos te ajudar a nunca mais perder um orçamento por demorar a responder clientes enquanto está atendendo. Podemos liberar seu acesso hoje?`;

    const cleanLeadPhone = lead.whatsapp.replace(/\D/g, '');
    return `https://wa.me/${cleanLeadPhone}?text=${encodeURIComponent(text)}`;
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg rounded-3xl bg-[#FFFDF9] border border-[#FFD8A8] p-6 sm:p-8 shadow-2xl z-10 my-8 text-left max-h-[90vh] flex flex-col justify-between overflow-hidden">
        
        {/* Top Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
          aria-label="Fechar modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Body Scrollable */}
        <div className="overflow-y-auto pr-1 -mr-1">
          
          {/* Header Badge */}
          <div className="flex items-center justify-between mb-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#FFF0E0] px-3 py-1 text-xs font-bold text-[#C2410C] border border-[#FFD8A8]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#EA580C] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF6B35]" />
              </span>
              <span>⚠️ PROGRAMA PILOTO • 5 VAGAS</span>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'form' ? 'admin' : 'form')}
              className="text-[11px] font-semibold text-stone-500 hover:text-stone-800 flex items-center gap-1 bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200 transition cursor-pointer"
            >
              <Users className="h-3 w-3" />
              <span>{activeTab === 'form' ? `Ver Leads (${localLeads.length})` : 'Voltar ao Formulário'}</span>
            </button>
          </div>

          {/* TAB 1: FORMULÁRIO DE CANDIDATURA */}
          {activeTab === 'form' && (
            <>
              {!submittedLead ? (
                <div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight leading-snug font-['Plus_Jakarta_Sans',sans-serif]">
                    Candidatura para as 5 Vagas Gratuitas
                  </h3>
                  
                  <div className="mt-2 p-3 rounded-2xl bg-[#C8F3EF]/40 border border-[#39C8C5]/30 text-xs sm:text-sm text-[#06232D] leading-relaxed">
                    <p className="font-semibold text-[#0E969C] flex items-center gap-1.5 mb-1">
                      <ShieldCheck className="h-4 w-4 shrink-0 text-[#18B5B5]" />
                      <span>Como funciona a aprovação:</span>
                    </p>
                    <p>
                      Preencha o formulário abaixo com os dados do seu serviço. Sua candidatura <strong>irá para avaliação</strong> da nossa equipe para liberação de uma das <strong>5 vagas com 3 meses de acesso 100% gratuito</strong> no Plano Básico.
                    </p>
                  </div>

                  {errorMsg && (
                    <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                      {errorMsg}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
                    {/* Campo Nome */}
                    <div>
                      <label className="block text-xs font-semibold text-[#06232D] mb-1">
                        Seu nome ou nome da sua empresa <span className="text-[#18B5B5]">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#286A70]" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Ex: Carlos Oliveira (Eletricista) ou SolarTech"
                          className="w-full rounded-xl border border-[#C8F3EF] bg-white py-2.5 pl-10 pr-3.5 text-sm text-[#06232D] placeholder-[#286A70]/60 focus:border-[#18B5B5] focus:outline-none focus:ring-2 focus:ring-[#18B5B5]/20 transition"
                        />
                      </div>
                    </div>

                    {/* Campo WhatsApp */}
                    <div>
                      <label className="block text-xs font-semibold text-[#06232D] mb-1">
                        Seu WhatsApp comercial com DDD <span className="text-[#18B5B5]">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#286A70]" />
                        <input
                          type="tel"
                          required
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(e.target.value)}
                          placeholder="Ex: (11) 98765-4321"
                          className="w-full rounded-xl border border-[#C8F3EF] bg-white py-2.5 pl-10 pr-3.5 text-sm text-[#06232D] placeholder-[#286A70]/60 focus:border-[#18B5B5] focus:outline-none focus:ring-2 focus:ring-[#18B5B5]/20 transition"
                        />
                      </div>
                      <span className="text-[10px] text-[#286A70] mt-1 block">
                        Usado para te comunicar o resultado da avaliação da sua vaga.
                      </span>
                    </div>

                    {/* Campo Tipo de Serviço */}
                    <div>
                      <label className="block text-xs font-semibold text-[#06232D] mb-1">
                        Qual serviço você presta? <span className="text-[#18B5B5]">*</span>
                      </label>
                      <div className="relative">
                        <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#286A70]" />
                        <input
                          type="text"
                          required
                          value={serviceType}
                          onChange={(e) => setServiceType(e.target.value)}
                          placeholder="Ex: Instalação de Ar Condicionado, Padrão de Luz, Reforma..."
                          className="w-full rounded-xl border border-[#C8F3EF] bg-white py-2.5 pl-10 pr-3.5 text-sm text-[#06232D] placeholder-[#286A70]/60 focus:border-[#18B5B5] focus:outline-none focus:ring-2 focus:ring-[#18B5B5]/20 transition"
                        />
                      </div>
                    </div>

                    {/* Seletor de Volume Diário */}
                    <div>
                      <label className="block text-xs font-semibold text-[#06232D] mb-1">
                        Volume médio de mensagens recebidas por dia
                      </label>
                      <div className="relative">
                        <BarChart3 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#286A70]" />
                        <select
                          value={dailyVolume}
                          onChange={(e) => setDailyVolume(e.target.value)}
                          className="w-full rounded-xl border border-[#C8F3EF] bg-white py-2.5 pl-10 pr-3.5 text-sm text-[#06232D] focus:border-[#18B5B5] focus:outline-none focus:ring-2 focus:ring-[#18B5B5]/20 transition cursor-pointer"
                        >
                          <option value="Menos de 50 mensagens/dia">Menos de 50 mensagens/dia</option>
                          <option value="50 a 200 mensagens/dia">50 a 200 mensagens/dia</option>
                          <option value="Mais de 200 mensagens/dia">Mais de 200 mensagens/dia</option>
                        </select>
                      </div>
                    </div>

                    {/* Botão de Submissão */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="mt-5 w-full group relative inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#18B5B5] hover:bg-[#0E969C] px-6 py-3.5 sm:py-4 text-sm sm:text-base font-bold text-white shadow-md transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-75"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Enviando para Avaliação...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          <span>Enviar Formulário para Avaliação</span>
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </>
                      )}
                    </button>
                  </form>

                  <div className="mt-4 pt-3 border-t border-stone-200/80 flex items-center justify-between text-[11px] text-stone-500">
                    <span className="flex items-center gap-1.5">
                      <Database className="h-3.5 w-3.5 text-[#EA580C]" />
                      <span>Salvo com segurança no banco de dados</span>
                    </span>
                    <span>Sem cartão de crédito</span>
                  </div>
                </div>
              ) : (
                /* TELA DE SUCESSO APÓS ENVIO */
                <div className="py-2 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F8EE] text-[#16A34A] mb-4 border border-[#BBF7D0]">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>

                  <h3 className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight">
                    Candidatura Enviada para Avaliação!
                  </h3>

                  <p className="mt-2 text-sm text-stone-600 leading-relaxed max-w-md mx-auto">
                    Seus dados foram registrados com sucesso no banco de dados. Nossa equipe está avaliando o perfil da sua empresa para a concessão dos <strong>3 meses gratuitos</strong>.
                  </p>

                  <div className="mt-5 rounded-2xl bg-[#FFF8EE] border border-[#FFE4C4] p-4 text-left text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-stone-500">Candidato:</span>
                      <span className="font-bold text-stone-800">{submittedLead.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">WhatsApp:</span>
                      <span className="font-bold text-stone-800">{submittedLead.whatsapp}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Serviço:</span>
                      <span className="font-bold text-stone-800">{submittedLead.service_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Status:</span>
                      <span className="font-bold text-[#C2410C]">Pendente de Avaliação</span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <p className="text-xs font-semibold text-stone-700 mb-2">
                      Quer acelerar sua aprovação antes que as 5 vagas fechem?
                    </p>
                    <a
                      href={getWhatsAppEvaluationUrl(submittedLead)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#25D366] via-[#22C55E] to-[#16A34A] px-6 py-3.5 text-sm sm:text-base font-bold text-white shadow-[0_8px_20px_rgba(34,197,94,0.35)] hover:scale-[1.01] transition cursor-pointer"
                    >
                      <MessageCircle className="h-5 w-5 fill-current" />
                      <span>Agilizar Avaliação no WhatsApp</span>
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  </div>

                  <button
                    onClick={onClose}
                    className="mt-4 text-xs text-stone-500 hover:text-stone-800 underline transition cursor-pointer"
                  >
                    Concluir e voltar para a página
                  </button>
                </div>
              )}
            </>
          )}

          {/* TAB 2: PAINEL DO GESTOR / LEADS CAPTURADOS */}
          {activeTab === 'admin' && (
            <div>
              <h3 className="text-lg font-bold text-stone-900 tracking-tight flex items-center justify-between">
                <span>Leads para Avaliação e Prospecção</span>
                <span className="text-xs bg-[#FFF0E0] text-[#C2410C] px-2.5 py-0.5 rounded-full border border-[#FFD8A8]">
                  {localLeads.length} registrados
                </span>
              </h3>
              <p className="text-xs text-stone-500 mt-1 mb-4">
                Banco de leads capturados pelo formulário da campanha.
              </p>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {localLeads.length === 0 ? (
                  <div className="text-center py-6 text-xs text-stone-400">
                    Nenhum lead preenchido ainda. Faça um teste pelo formulário!
                  </div>
                ) : (
                  localLeads.map((lead, idx) => (
                    <div key={idx} className="p-3 rounded-2xl bg-white border border-stone-200 text-xs space-y-1.5 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-900">{lead.name}</span>
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {lead.status === 'pendente_avaliacao' ? 'Para Avaliação' : lead.status}
                        </span>
                      </div>
                      <div className="text-stone-600">
                        📱 <strong>WhatsApp:</strong> {lead.whatsapp}
                      </div>
                      <div className="text-stone-600">
                        🔧 <strong>Serviço:</strong> {lead.service_type}
                      </div>
                      <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                        <a
                          href={getProspectingMessageForLead(lead)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-green-700 hover:text-green-800 bg-green-50 px-2.5 py-1 rounded-lg border border-green-200 transition"
                        >
                          <MessageCircle className="h-3 w-3" />
                          <span>Prospectar no WhatsApp</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                        <button
                          onClick={() => copyText(getProspectingMessageForLead(lead))}
                          className="text-[10px] text-stone-500 hover:text-stone-800 transition flex items-center gap-1"
                        >
                          {copiedLink ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                          <span>{copiedLink ? 'Copiado' : 'Copiar Link'}</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-stone-200">
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Seu número comercial para receber as candidaturas:
                </label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => handleSavePhone(e.target.value)}
                  placeholder="Ex: 5511999999999"
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs text-stone-800"
                />
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
