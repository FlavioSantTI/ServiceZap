"use client";

import React, { useState, useEffect } from "react";
import { AppointmentDocument, AppointmentStatus, ClientDocument, ServiceDocument } from "@/types/appwrite";
import { createAppointmentAction, updateAppointmentAction } from "@/app/actions/appointments";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  Briefcase,
  MapPin,
  FileText,
  X,
  Sparkles,
  Send,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (appointment: Partial<AppointmentDocument>) => void;
  appointmentToEdit?: Partial<AppointmentDocument> | null;
  initialClient?: Partial<ClientDocument> | null;
  initialDate?: string;
  clientsList?: Partial<ClientDocument>[];
  servicesList?: Partial<ServiceDocument>[];
}

const DURATIONS = [
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "1 hora", value: 60 },
  { label: "1h 30m", value: 90 },
  { label: "2 horas", value: 120 },
];

const STATUS_OPTIONS: { label: string; value: AppointmentStatus; color: string }[] = [
  { label: "Agendado", value: "scheduled", color: "bg-amber-500/15 text-amber-500 border-amber-500/30" },
  { label: "Confirmado", value: "confirmed", color: "bg-orange-500/15 text-[#E8622C] border-orange-500/30" },
  { label: "Em Atendimento", value: "in_progress", color: "bg-zinc-800 text-zinc-200 border-zinc-700" },
  { label: "Concluído", value: "completed", color: "bg-orange-500/20 text-[#E8622C] border-orange-500/40" },
  { label: "Cancelado", value: "canceled", color: "bg-rose-500/15 text-rose-400 border-rose-500/30" },
];

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  appointmentToEdit,
  initialClient,
  initialDate,
  clientsList = [],
  servicesList = [],
}) => {
  const [formData, setFormData] = useState<{
    clientId?: string;
    clientName: string;
    clientPhone: string;
    serviceId?: string;
    serviceName: string;
    attendantName: string;
    date: string;
    time: string;
    durationMinutes: number;
    status: AppointmentStatus;
    location: string;
    notes: string;
    sendWhatsAppConfirmation: boolean;
  }>({
    clientId: "",
    clientName: "",
    clientPhone: "",
    serviceId: "",
    serviceName: "",
    attendantName: "Atendimento",
    date: initialDate || new Date().toISOString().split("T")[0],
    time: "14:00",
    durationMinutes: 60,
    status: "scheduled",
    location: "Sede / Balcão Principal",
    notes: "",
    sendWhatsAppConfirmation: true,
  });

  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (appointmentToEdit) {
        setFormData({
          clientId: appointmentToEdit.clientId || "",
          clientName: appointmentToEdit.clientName || "",
          clientPhone: appointmentToEdit.clientPhone || "",
          serviceId: appointmentToEdit.serviceId || "",
          serviceName: appointmentToEdit.serviceName || "",
          attendantName: appointmentToEdit.attendantName || "Atendimento",
          date: appointmentToEdit.date || new Date().toISOString().split("T")[0],
          time: appointmentToEdit.time || "14:00",
          durationMinutes: appointmentToEdit.durationMinutes || 60,
          status: appointmentToEdit.status || "scheduled",
          location: appointmentToEdit.location || "Sede / Balcão Principal",
          notes: appointmentToEdit.notes || "",
          sendWhatsAppConfirmation: false,
        });
      } else if (initialClient) {
        setFormData({
          clientId: initialClient.$id || "",
          clientName: initialClient.name || "",
          clientPhone: initialClient.phone || "",
          serviceId: "",
          serviceName: "Atendimento Técnico / Consulta",
          attendantName: "Atendimento",
          date: initialDate || new Date().toISOString().split("T")[0],
          time: "14:00",
          durationMinutes: 60,
          status: "scheduled",
          location: "Sede / Balcão Principal",
          notes: "",
          sendWhatsAppConfirmation: true,
        });
      } else {
        setFormData({
          clientId: "",
          clientName: "",
          clientPhone: "",
          serviceId: "",
          serviceName: "",
          attendantName: "Atendimento",
          date: initialDate || new Date().toISOString().split("T")[0],
          time: "14:00",
          durationMinutes: 60,
          status: "scheduled",
          location: "Sede / Balcão Principal",
          notes: "",
          sendWhatsAppConfirmation: true,
        });
      }
      setErrorMsg(null);
    }
  }, [isOpen, appointmentToEdit, initialClient, initialDate]);

  const handleSelectClient = (clientId: string) => {
    const found = clientsList.find((c) => c.$id === clientId);
    if (found) {
      setFormData((prev) => ({
        ...prev,
        clientId: found.$id,
        clientName: found.name || "",
        clientPhone: found.phone || "",
      }));
    }
  };

  const handleSelectService = (serviceId: string) => {
    const found = servicesList.find((s) => s.$id === serviceId);
    if (found) {
      setFormData((prev) => ({
        ...prev,
        serviceId: found.$id,
        serviceName: found.name || "",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName.trim() || !formData.date || !formData.time || !formData.serviceName.trim()) {
      setErrorMsg("Preencha todos os campos obrigatórios (Cliente, Serviço, Data e Horário).");
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      if (appointmentToEdit && appointmentToEdit.$id) {
        const res = await updateAppointmentAction(appointmentToEdit.$id, formData);
        if (res.success && res.data) {
          onSuccess(res.data);
          onClose();
        } else {
          setErrorMsg(res.error || "Falha ao salvar alterações.");
        }
      } else {
        const res = await createAppointmentAction(formData);
        if (res.success && res.data) {
          onSuccess(res.data);
          onClose();
        } else {
          setErrorMsg(res.error || "Falha ao registrar agendamento.");
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Erro inesperado ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-orange-500/15 text-[#E8622C] border border-orange-500/20">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-100 text-base flex items-center gap-2">
                {appointmentToEdit ? "Editar Agendamento" : "Novo Agendamento de Atendimento"}
              </h3>
              <p className="text-xs text-zinc-400">
                {appointmentToEdit
                  ? "Atualize as informações do compromisso"
                  : "Preencha os dados para registrar o atendimento na agenda"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <X className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Seção 1: Dados do Cliente */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#E8622C]" />
              <span>Dados do Cliente</span>
            </h4>

            {clientsList.length > 0 && !appointmentToEdit && (
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Selecionar da lista de clientes cadastrados (opcional)
                </label>
                <select
                  value={formData.clientId || ""}
                  onChange={(e) => handleSelectClient(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700/60 rounded-xl text-zinc-100 text-xs focus:outline-none focus:border-[#E8622C] transition-colors"
                >
                  <option value="">-- Digitar cliente avulso --</option>
                  {clientsList.map((c) => (
                    <option key={c.$id} value={c.$id}>
                      {c.name} {c.phone ? `(${c.phone})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Nome do Cliente *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João da Silva"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700/60 rounded-xl text-zinc-100 text-xs focus:outline-none focus:border-[#E8622C] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  WhatsApp / Telefone (com DDD)
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="556399565095 ou (11) 98888-7777"
                    value={formData.clientPhone}
                    onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                    className="w-full pl-8 pr-3 py-2 bg-zinc-800/80 border border-zinc-700/60 rounded-xl text-zinc-100 text-xs focus:outline-none focus:border-[#E8622C] transition-colors font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Seção 2: Serviço e Profissional */}
          <div className="space-y-3 pt-2 border-t border-zinc-800/70">
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-[#E8622C]" />
              <span>Serviço & Atendente</span>
            </h4>

            {servicesList.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Selecionar do Catálogo de Serviços
                </label>
                <select
                  value={formData.serviceId || ""}
                  onChange={(e) => handleSelectService(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700/60 rounded-xl text-zinc-100 text-xs focus:outline-none focus:border-[#E8622C] transition-colors"
                >
                  <option value="">-- Escolher do catálogo ou digitar abaixo --</option>
                  {servicesList.map((s) => (
                    <option key={s.$id} value={s.$id}>
                      {s.name} {s.price ? `- R$ ${s.price.toFixed(2)}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Nome do Serviço / Motivo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Instalação Fibra, Consulta, Troca de Peça"
                  value={formData.serviceName}
                  onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700/60 rounded-xl text-zinc-100 text-xs focus:outline-none focus:border-[#E8622C] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Profissional / Técnico Responsável
                </label>
                <input
                  type="text"
                  placeholder="Ex: Dr. Rafael, Carlos Técnico"
                  value={formData.attendantName}
                  onChange={(e) => setFormData({ ...formData, attendantName: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700/60 rounded-xl text-zinc-100 text-xs focus:outline-none focus:border-[#E8622C] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Seção 3: Data, Horário e Duração */}
          <div className="space-y-3 pt-2 border-t border-zinc-800/70">
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#E8622C]" />
              <span>Data, Horário & Duração</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Data do Atendimento *
                </label>
                <DatePicker
                  required
                  value={formData.date}
                  onChange={(val) => setFormData({ ...formData, date: val })}
                  placeholder="DD/MM/AAAA"
                  className="bg-zinc-800/80 border-zinc-700/60 h-9"
                  presets={[
                    { label: 'Hoje', daysOffset: 0 },
                    { label: 'Amanhã', daysOffset: 1 },
                    { label: '+2 dias', daysOffset: 2 },
                    { label: '+7 dias', daysOffset: 7 },
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Horário de Início *
                </label>
                <input
                  type="time"
                  required
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700/60 rounded-xl text-zinc-100 text-xs focus:outline-none focus:border-[#E8622C] transition-colors font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Duração Prevista
                </label>
                <select
                  value={formData.durationMinutes}
                  onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700/60 rounded-xl text-zinc-100 text-xs focus:outline-none focus:border-[#E8622C] transition-colors"
                >
                  {DURATIONS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Status Inicial
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as AppointmentStatus })}
                  className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700/60 rounded-xl text-zinc-100 text-xs focus:outline-none focus:border-[#E8622C] transition-colors"
                >
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st.value} value={st.value}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Local / Endereço
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Ex: Sala 02 ou Endereço do Cliente"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full pl-8 pr-3 py-2 bg-zinc-800/80 border border-zinc-700/60 rounded-xl text-zinc-100 text-xs focus:outline-none focus:border-[#E8622C] transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-1 pt-2 border-t border-zinc-800/70">
            <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-zinc-400" />
              <span>Observações / Instruções Internas (opcional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Instruções para a equipe, necessidades especiais do cliente..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700/60 rounded-xl text-zinc-100 text-xs focus:outline-none focus:border-[#E8622C] transition-colors resize-none"
            />
          </div>

          {/* Checkbox Confirmação WhatsApp */}
          {!appointmentToEdit && (
            <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/25 flex items-center gap-3">
              <input
                type="checkbox"
                id="sendWaCheck"
                checked={formData.sendWhatsAppConfirmation}
                onChange={(e) => setFormData({ ...formData, sendWhatsAppConfirmation: e.target.checked })}
                className="w-4 h-4 rounded text-[#E8622C] focus:ring-[#E8622C] border-zinc-700 bg-zinc-800 cursor-pointer accent-[#E8622C]"
              />
              <label htmlFor="sendWaCheck" className="text-xs text-zinc-200 cursor-pointer select-none">
                <span className="font-semibold text-[#E8622C]">Enviar confirmação automática no WhatsApp</span>
                <p className="text-[11px] text-zinc-400">
                  Dispara uma mensagem elegante com todos os dados do agendamento para o cliente assim que salvar.
                </p>
              </label>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:bg-zinc-800 border-zinc-700/60"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#F0806B] to-[#E8622C] hover:opacity-95 text-white text-xs font-bold transition-all shadow-md shadow-orange-500/20 disabled:opacity-50"
            >
              {saving ? (
                "Salvando..."
              ) : appointmentToEdit ? (
                "Salvar Alterações"
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar Agendamento</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
