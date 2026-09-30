import React, { useState } from 'react';
import { 
  Send, 
  CheckCircle2, 
  ShieldCheck, 
  AlertCircle, 
  Copy, 
  Check, 
  MessageCircle, 
  Building2, 
  User, 
  Flame
} from 'lucide-react';
import { motion } from 'motion/react';
import { ApplicationFormData, VolumeOption } from '../types';

const VOLUME_OPTIONS: VolumeOption[] = [
  'Menos de 100 / dia',
  '100 a 500 / dia',
  '500 a 2.000 / dia',
  'Mais de 2.000 / dia'
];

export const ApplicationFormSection: React.FC = () => {
  const [formData, setFormData] = useState<ApplicationFormData>({
    fullNameAndRole: '',
    whatsappContact: '',
    companyAndSector: '',
    dailyVolume: '500 a 2.000 / dia',
    currentToolOrApi: '',
    mainBottleneckOrPain: ''
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ApplicationFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState('');
  const [copiedId, setCopiedId] = useState(false);

  // Format WhatsApp input smoothly
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 11) val = val.slice(0, 11);

    let formatted = val;
    if (val.length > 2) {
      formatted = `(${val.slice(0, 2)}) ${val.slice(2)}`;
    }
    if (val.length > 7) {
      formatted = `(${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7)}`;
    }

    setFormData(prev => ({ ...prev, whatsappContact: formatted }));
    if (errors.whatsappContact) {
      setErrors(prev => ({ ...prev, whatsappContact: undefined }));
    }
  };

  const handleInputChange = (field: keyof ApplicationFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ApplicationFormData, string>> = {};

    if (!formData.fullNameAndRole.trim()) {
      newErrors.fullNameAndRole = 'Por favor, informe seu nome completo e cargo.';
    }
    if (!formData.whatsappContact.trim() || formData.whatsappContact.replace(/\D/g, '').length < 10) {
      newErrors.whatsappContact = 'Informe um WhatsApp válido com DDD.';
    }
    if (!formData.companyAndSector.trim()) {
      newErrors.companyAndSector = 'Informe o nome da empresa e o ramo de atuação.';
    }
    if (!formData.dailyVolume) {
      newErrors.dailyVolume = 'Selecione o volume estimado.';
    }
    if (!formData.currentToolOrApi.trim()) {
      newErrors.currentToolOrApi = 'Informe a ferramenta que utiliza hoje (ou digite "Nenhuma").';
    }
    if (!formData.mainBottleneckOrPain.trim()) {
      newErrors.mainBottleneckOrPain = 'Descreva brevemente a principal dificuldade com WhatsApp.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const generatedId = `SZ-BETA-${Math.floor(1000 + Math.random() * 9000)}`;
      setApplicationId(generatedId);
      setIsSubmitting(false);
      setIsSubmitted(true);

      try {
        const payload = {
          ...formData,
          id: generatedId,
          submittedAt: new Date().toISOString()
        };
        localStorage.setItem('servicezap_pilot_application', JSON.stringify(payload));
      } catch (err) {
        console.error(err);
      }
    }, 1200);
  };

  const copyApplicationId = () => {
    navigator.clipboard.writeText(applicationId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const resetForm = () => {
    setIsSubmitted(false);
    setFormData({
      fullNameAndRole: '',
      whatsappContact: '',
      companyAndSector: '',
      dailyVolume: '500 a 2.000 / dia',
      currentToolOrApi: '',
      mainBottleneckOrPain: ''
    });
  };

  return (
    <section id="formulario-aplicacao" className="relative py-20 bg-gradient-to-b from-[#FAF5ED] to-[#FFF6E9] border-t border-[#FFE0B2]/80">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-[#FFF0E0] px-4 py-1.5 text-xs font-extrabold text-[#C2410C] border border-[#FFD8A8] mb-4 shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#EA580C] opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#FF6B35]"></span>
            </span>
            <span>PROCESSO SELETIVO ABERTO</span>
          </div>

          <h2 
            id="form-title"
            className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#1C1917] tracking-tight leading-tight"
          >
            Aplicação para o Programa Piloto (5 Vagas Disponíveis)
          </h2>
          
          <p className="mt-3 text-[#57534E] text-sm sm:text-base max-w-xl mx-auto font-normal">
            Preencha as informações abaixo para avaliarmos a participação da sua empresa nas 5 vagas disponíveis.
          </p>
        </motion.div>

        {/* Form Container */}
        <motion.div 
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="relative rounded-3xl border border-[#FFD8A8] bg-white p-6 sm:p-10 shadow-[0_20px_50px_rgba(210,105,30,0.08)] backdrop-blur-xl"
        >
          {/* Top orange gradient indicator bar */}
          <div className="absolute -top-px left-12 right-12 h-1.5 bg-gradient-to-r from-[#FF6B35] via-[#F78C6B] to-[#D2691E] rounded-full" />

          {isSubmitted ? (
            /* Success State Confirmation */
            <div id="application-success-view" className="py-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF0E0] text-[#EA580C] border border-[#FFB380] mb-6 shadow-sm">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              
              <h3 className="text-2xl font-extrabold text-[#1C1917] mb-2">
                Aplicação Enviada com Sucesso!
              </h3>
              
              <p className="text-[#57534E] max-w-md mx-auto text-sm sm:text-base mb-6">
                Recebemos sua candidatura para o Programa Piloto do ServiceZap. Nossa equipe entrará em contato com você pelo WhatsApp em até 24h úteis.
              </p>

              {/* Protocol Badge */}
              <div className="inline-flex items-center gap-3 rounded-2xl bg-[#FFF8EE] border border-[#FFD8A8] px-5 py-3 mb-8 shadow-sm">
                <span className="text-xs font-semibold text-[#78716C]">Número da Inscrição:</span>
                <span className="font-mono font-extrabold text-[#C2410C] text-base">{applicationId}</span>
                <button
                  onClick={copyApplicationId}
                  className="text-[#78716C] hover:text-[#C2410C] transition cursor-pointer p-1"
                  title="Copiar Número"
                >
                  {copiedId ? <Check className="h-4 w-4 text-[#EA580C]" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>

              {/* Quick Summary of Candidate Data */}
              <div className="max-w-md mx-auto rounded-2xl bg-[#FAF5ED] p-5 border border-[#EADBCA] text-left text-xs space-y-2.5 mb-8 text-[#57534E]">
                <div className="flex justify-between border-b border-[#E8D7C2] pb-2">
                  <span className="text-[#78716C]">Responsável / Cargo:</span>
                  <span className="font-bold text-[#1C1917]">{formData.fullNameAndRole}</span>
                </div>
                <div className="flex justify-between border-b border-[#E8D7C2] pb-2">
                  <span className="text-[#78716C]">WhatsApp de Contato:</span>
                  <span className="font-bold text-[#C2410C]">{formData.whatsappContact}</span>
                </div>
                <div className="flex justify-between border-b border-[#E8D7C2] pb-2">
                  <span className="text-[#78716C]">Empresa:</span>
                  <span className="font-bold text-[#1C1917]">{formData.companyAndSector}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#78716C]">Volume Informado:</span>
                  <span className="font-extrabold text-[#D97706]">{formData.dailyVolume}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href={`https://wa.me/5563984913860?text=${encodeURIComponent(`Olá, submeti a candidatura da empresa ${formData.companyAndSector} para o Programa Beta do ServiceZap (Inscrição: ${applicationId}). Gostaria de confirmar o recebimento.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#EA580C] px-7 py-3.5 text-sm font-bold text-white shadow-[0_6px_20px_rgba(255,107,53,0.3)] hover:scale-[1.02] transition"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Falar no WhatsApp com o Time</span>
                </a>

                <button
                  onClick={resetForm}
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-[#FAF5ED] border border-[#E7D7C1] px-5 py-3.5 text-sm font-semibold text-[#57534E] hover:bg-[#F5EAD9] transition cursor-pointer"
                >
                  Submeter Outra Empresa
                </button>
              </div>
            </div>
          ) : (
            /* Active Form with Warm Cream & Orange Theme */
            <form id="pilot-application-form" onSubmit={handleSubmit} className="space-y-6">
              
              {/* Grid 1: Nome Completo e Cargo + WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="fullNameAndRole" className="block text-sm font-bold text-[#292524] mb-2">
                    Nome Completo e Cargo <span className="text-[#EA580C]">*</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#A8A29E]">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      id="fullNameAndRole"
                      name="fullNameAndRole"
                      value={formData.fullNameAndRole}
                      onChange={(e) => handleInputChange('fullNameAndRole', e.target.value)}
                      placeholder="Ex: Carlos Silva - Gerente Comercial"
                      className={`w-full rounded-2xl bg-[#FFFDF9] border ${errors.fullNameAndRole ? 'border-rose-400 focus:border-rose-500' : 'border-[#E7D7C1] focus:border-[#FF6B35] focus:ring-4 focus:ring-[#FF6B35]/15'} pl-10 pr-4 py-3.5 text-sm text-[#1C1917] placeholder-[#A8A29E] outline-none transition duration-200 shadow-sm`}
                    />
                  </div>
                  {errors.fullNameAndRole && (
                    <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1 font-medium">
                      <AlertCircle className="h-3 w-3" /> {errors.fullNameAndRole}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="whatsappContact" className="block text-sm font-bold text-[#292524] mb-2">
                    WhatsApp de Contato (com DDD) <span className="text-[#EA580C]">*</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#A8A29E]">
                      <MessageCircle className="h-4 w-4" />
                    </div>
                    <input
                      type="tel"
                      id="whatsappContact"
                      name="whatsappContact"
                      value={formData.whatsappContact}
                      onChange={handlePhoneChange}
                      placeholder="(11) 99999-8888"
                      className={`w-full rounded-2xl bg-[#FFFDF9] border ${errors.whatsappContact ? 'border-rose-400 focus:border-rose-500' : 'border-[#E7D7C1] focus:border-[#FF6B35] focus:ring-4 focus:ring-[#FF6B35]/15'} pl-10 pr-4 py-3.5 text-sm text-[#1C1917] placeholder-[#A8A29E] outline-none transition duration-200 font-mono shadow-sm`}
                    />
                  </div>
                  {errors.whatsappContact && (
                    <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1 font-medium">
                      <AlertCircle className="h-3 w-3" /> {errors.whatsappContact}
                    </p>
                  )}
                </div>
              </div>

              {/* Grid 2: Nome da Empresa e Ramo de Atuação */}
              <div>
                <label htmlFor="companyAndSector" className="block text-sm font-bold text-[#292524] mb-2">
                  Nome da Empresa e Ramo de Atuação <span className="text-[#EA580C]">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#A8A29E]">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    id="companyAndSector"
                    name="companyAndSector"
                    value={formData.companyAndSector}
                    onChange={(e) => handleInputChange('companyAndSector', e.target.value)}
                    placeholder="Ex: AutoPeças Silva - Comércio e Vendas"
                    className={`w-full rounded-2xl bg-[#FFFDF9] border ${errors.companyAndSector ? 'border-rose-400 focus:border-rose-500' : 'border-[#E7D7C1] focus:border-[#FF6B35] focus:ring-4 focus:ring-[#FF6B35]/15'} pl-10 pr-4 py-3.5 text-sm text-[#1C1917] placeholder-[#A8A29E] outline-none transition duration-200 shadow-sm`}
                  />
                </div>
                {errors.companyAndSector && (
                  <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1 font-medium">
                    <AlertCircle className="h-3 w-3" /> {errors.companyAndSector}
                  </p>
                )}
              </div>

              {/* Volume diário estimado de mensagens no WhatsApp */}
              <div>
                <label className="block text-sm font-bold text-[#292524] mb-2.5">
                  Volume diário estimado de mensagens no WhatsApp: <span className="text-[#EA580C]">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {VOLUME_OPTIONS.map((option) => {
                    const isSelected = formData.dailyVolume === option;
                    return (
                      <label
                        key={option}
                        className={`relative flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'border-[#FF6B35] bg-[#FFF0E0] text-[#9A3412] shadow-[0_4px_15px_rgba(255,107,53,0.15)] font-bold'
                            : 'border-[#E7D7C1] bg-[#FFFDF9] text-[#57534E] hover:border-[#FFB380] hover:bg-[#FFF9F0]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="dailyVolume"
                          value={option}
                          checked={isSelected}
                          onChange={() => handleInputChange('dailyVolume', option)}
                          className="h-4 w-4 text-[#FF6B35] border-[#D6D3D1] focus:ring-[#FF6B35]"
                        />
                        <span className="text-xs sm:text-sm font-semibold select-none">{option}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Qual ferramenta ou API vocês utilizam hoje? */}
              <div>
                <label htmlFor="currentToolOrApi" className="block text-sm font-bold text-[#292524] mb-2">
                  Qual ferramenta ou API vocês utilizam hoje? <span className="text-[#EA580C]">*</span>
                </label>
                <input
                  type="text"
                  id="currentToolOrApi"
                  name="currentToolOrApi"
                  value={formData.currentToolOrApi}
                  onChange={(e) => handleInputChange('currentToolOrApi', e.target.value)}
                  placeholder="Ex: WhatsApp Web comum no computador, Z-API, disparador ou nenhuma ferramenta no momento"
                  className={`w-full rounded-2xl bg-[#FFFDF9] border ${errors.currentToolOrApi ? 'border-rose-400 focus:border-rose-500' : 'border-[#E7D7C1] focus:border-[#FF6B35] focus:ring-4 focus:ring-[#FF6B35]/15'} px-4 py-3.5 text-sm text-[#1C1917] placeholder-[#A8A29E] outline-none transition duration-200 shadow-sm`}
                />
                {errors.currentToolOrApi && (
                  <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1 font-medium">
                    <AlertCircle className="h-3 w-3" /> {errors.currentToolOrApi}
                  </p>
                )}
              </div>

              {/* Qual o principal gargalo ou dor com WhatsApp na sua operação hoje? */}
              <div>
                <label htmlFor="mainBottleneckOrPain" className="block text-sm font-bold text-[#292524] mb-2">
                  Qual o principal gargalo ou dor com WhatsApp na sua operação hoje? <span className="text-[#EA580C]">*</span>
                </label>
                <textarea
                  id="mainBottleneckOrPain"
                  name="mainBottleneckOrPain"
                  rows={3}
                  value={formData.mainBottleneckOrPain}
                  onChange={(e) => handleInputChange('mainBottleneckOrPain', e.target.value)}
                  placeholder="Ex: O WhatsApp desconecta sozinho sem avisar, mensagens demoram para chegar ou perdemos clientes na fila de atendimento..."
                  className={`w-full rounded-2xl bg-[#FFFDF9] border ${errors.mainBottleneckOrPain ? 'border-rose-400 focus:border-rose-500' : 'border-[#E7D7C1] focus:border-[#FF6B35] focus:ring-4 focus:ring-[#FF6B35]/15'} px-4 py-3.5 text-sm text-[#1C1917] placeholder-[#A8A29E] outline-none transition duration-200 resize-none shadow-sm`}
                />
                {errors.mainBottleneckOrPain && (
                  <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1 font-medium">
                    <AlertCircle className="h-3 w-3" /> {errors.mainBottleneckOrPain}
                  </p>
                )}
              </div>

              {/* Submit CTA with vibrant orange gradient */}
              <div className="pt-3">
                <button
                  type="submit"
                  id="submit-application-btn"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#FF6B35] via-[#F78C6B] to-[#EA580C] py-4 text-base font-extrabold text-white shadow-[0_10px_25px_rgba(255,107,53,0.35)] transition-all duration-300 hover:shadow-[0_15px_35px_rgba(255,107,53,0.5)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Processando sua inscrição...</span>
                    </>
                  ) : (
                    <>
                      <span>Enviar Aplicação para Avaliação</span>
                      <Send className="h-5 w-5" />
                    </>
                  )}
                </button>

                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-[#78716C] gap-2">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-[#EA580C]" />
                    Seus dados não serão compartilhados com terceiros
                  </span>
                  <span className="text-[#C2410C] font-bold">
                    Apenas 5 empresas selecionadas nesta fase
                  </span>
                </div>
              </div>

            </form>
          )}

        </motion.div>

      </div>
    </section>
  );
};
