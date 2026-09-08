"use client";

import React, { useState } from "react";
import { AppointmentDocument, AppointmentStatus } from "@/types/appwrite";
import {
  updateAppointmentStatusAction,
  deleteAppointmentAction,
  sendAppointmentWhatsAppReminderAction,
} from "@/app/actions/appointments";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  Briefcase,
  MapPin,
  FileText,
  X,
  MessageSquare,
  Bell,
  CheckCircle2,
  PlayCircle,
  XCircle,
  Trash2,
  Edit2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface AppointmentDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Partial<AppointmentDocument> | null;
  onEdit: (appointment: Partial<AppointmentDocument>) => void;
  onUpdated: (appointment: Partial<AppointmentDocument>) => void;
  onDeleted: (id: string) => void;
}

const STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  scheduled: {
    label: "Agendado",
    bg: "bg-amber-500/10 dark:bg-amber-500/15",
    text: "text-amber-500",
    border: "border-amber-500/30",
  },
  confirmed: {
    label: "Confirmado",
    bg: "bg-orange-500/10 dark:bg-orange-500/15",
    text: "text-[#E8622C]",
    border: "border-orange-500/30",
  },
  in_progress: {
    label: "Em Atendimento",
    bg: "bg-amber-600/10 dark:bg-amber-600/15",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-600/30",
  },
  completed: {
    label: "Concluído",
    bg: "bg-orange-500/15 dark:bg-orange-500/20",
    text: "text-[#E8622C]",
    border: "border-orange-500/30",
  },
  canceled: {
    label: "Cancelado",
    bg: "bg-rose-500/10 dark:bg-rose-500/15",
    text: "text-rose-400",
    border: "border-rose-500/30",
  },
  no_show: {
    label: "Não Compareceu",
    bg: "bg-zinc-500/10 dark:bg-zinc-500/15",
    text: "text-zinc-400",
    border: "border-zinc-500/30",
  },
};

export const AppointmentDetailsDrawer: React.FC<AppointmentDetailsDrawerProps> = ({
  isOpen,
  onClose,
  appointment,
  onEdit,
  onUpdated,
  onDeleted,
}) => {
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);
  const [sendingReminder, setSendingReminder] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!isOpen || !appointment) return null;

  const currentStatus = appointment.status || "scheduled";
  const statusInfo = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.scheduled;

  const handleStatusChange = async (newStatus: AppointmentStatus) => {
    if (!appointment.$id) return;
    setUpdatingStatus(true);
    setFeedbackMsg(null);
    try {
      const res = await updateAppointmentStatusAction(appointment.$id, newStatus);
      if (res.success && res.data) {
        onUpdated(res.data);
        setFeedbackMsg({ type: "success", text: `Status atualizado para "${STATUS_CONFIG[newStatus].label}"` });
      } else {
        setFeedbackMsg({ type: "error", text: res.error || "Falha ao atualizar status." });
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSendReminder = async () => {
    if (!appointment.$id) return;
    setSendingReminder(true);
    setFeedbackMsg(null);
    try {
      const res = await sendAppointmentWhatsAppReminderAction(appointment.$id);
      if (res.success) {
        onUpdated({ ...appointment, reminderSent: true });
        setFeedbackMsg({ type: "success", text: "Lembrete enviado com sucesso pelo WhatsApp!" });
      } else {
        setFeedbackMsg({ type: "error", text: res.error || "Falha ao enviar lembrete." });
      }
    } finally {
      setSendingReminder(false);
    }
  };

  const handleDelete = async () => {
    if (!appointment.$id) return;
    if (!confirm(`Tem certeza que deseja excluir o agendamento de "${appointment.clientName}"?`)) return;
    const res = await deleteAppointmentAction(appointment.$id);
    if (res.success) {
      onDeleted(appointment.$id);
      onClose();
    } else {
      alert(res.error || "Falha ao excluir agendamento.");
    }
  };

  const formattedDate = appointment.date ? appointment.date.split("-").reverse().join("/") : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md h-full sm:h-auto sm:max-h-[92vh] bg-zinc-900 border border-zinc-800 sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header Drawer */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800/80 bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border} flex items-center gap-1.5`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.text} bg-current`} />
              {statusInfo.label}
            </span>
            {appointment.reminderSent && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-[#E8622C] border border-orange-500/20">
                Lembrete Enviado
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                onEdit(appointment);
                onClose();
              }}
              title="Editar agendamento"
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              title="Excluir agendamento"
              className="p-2 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {feedbackMsg && (
            <div
              className={`p-3 rounded-2xl text-xs flex items-center gap-2 border ${
                feedbackMsg.type === "success"
                  ? "bg-orange-500/10 border-orange-500/20 text-[#E8622C]"
                  : "bg-rose-500/10 border-rose-500/20 text-rose-400"
              }`}
            >
              {feedbackMsg.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{feedbackMsg.text}</span>
            </div>
          )}

          {/* Card Principal: Serviço e Horário */}
          <div className="p-4 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 space-y-3">
            <h3 className="font-bold text-zinc-100 text-lg leading-snug">
              {appointment.serviceName}
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-zinc-300">
                <CalendarIcon className="w-4 h-4 text-[#E8622C] shrink-0" />
                <div>
                  <span className="text-[10px] text-zinc-500 block">Data</span>
                  <span className="font-semibold">{formattedDate}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-zinc-300">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-zinc-500 block">Horário / Duração</span>
                  <span className="font-mono font-semibold">
                    {appointment.time} ({appointment.durationMinutes} min)
                  </span>
                </div>
              </div>
            </div>

            {appointment.attendantName && (
              <div className="pt-2 border-t border-zinc-700/50 flex items-center gap-2 text-xs text-zinc-300">
                <Briefcase className="w-3.5 h-3.5 text-[#E8622C] shrink-0" />
                <span>Responsável: <strong className="text-zinc-100 font-medium">{appointment.attendantName}</strong></span>
              </div>
            )}

            {appointment.location && (
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span className="truncate">{appointment.location}</span>
              </div>
            )}
          </div>

          {/* Dados do Cliente & Atalho WhatsApp */}
          <div className="p-4 rounded-2xl bg-zinc-800/30 border border-zinc-800 space-y-3">
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#E8622C]" />
              <span>Cliente</span>
            </h4>

            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-sm text-zinc-100">{appointment.clientName}</p>
                <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5 font-mono">
                  <Phone className="w-3 h-3 text-zinc-500" />
                  <span>{appointment.clientPhone || "Sem telefone"}</span>
                </p>
              </div>

              {appointment.clientPhone && (
                <Link
                  href="/dashboard/whatsapp"
                  className="px-3 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-[#E8622C] border border-orange-500/20 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Abrir Chat</span>
                </Link>
              )}
            </div>
          </div>

          {/* Observações */}
          {appointment.notes && (
            <div className="p-3.5 rounded-2xl bg-zinc-800/20 border border-zinc-800/80 space-y-1">
              <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-zinc-500" />
                Observações
              </span>
              <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                {appointment.notes}
              </p>
            </div>
          )}

          {/* Ações Rápidas de Status */}
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Ações Rápidas de Fluxo
            </h4>

            <div className="grid grid-cols-2 gap-2">
              {currentStatus !== "confirmed" && currentStatus !== "completed" && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={updatingStatus}
                  onClick={() => handleStatusChange("confirmed")}
                  className="rounded-xl text-xs font-medium border-orange-500/30 bg-orange-500/10 text-[#E8622C] hover:bg-orange-500/20 gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirmar</span>
                </Button>
              )}

              {currentStatus !== "in_progress" && currentStatus !== "completed" && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={updatingStatus}
                  onClick={() => handleStatusChange("in_progress")}
                  className="rounded-xl text-xs font-medium border-amber-600/30 bg-amber-600/10 text-amber-500 hover:bg-amber-600/20 gap-1.5"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>Iniciar Atendimento</span>
                </Button>
              )}

              {currentStatus !== "completed" && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={updatingStatus}
                  onClick={() => handleStatusChange("completed")}
                  className="rounded-xl text-xs font-medium border-orange-500/30 bg-orange-500/15 text-[#E8622C] hover:bg-orange-500/25 gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Concluir</span>
                </Button>
              )}

              {currentStatus !== "canceled" && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={updatingStatus}
                  onClick={() => handleStatusChange("canceled")}
                  className="rounded-xl text-xs font-medium border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Cancelar</span>
                </Button>
              )}
            </div>

            {/* Botão de Disparar Lembrete WhatsApp */}
            {appointment.clientPhone && (
              <Button
                size="sm"
                variant="outline"
                disabled={sendingReminder}
                onClick={handleSendReminder}
                className="w-full mt-2 rounded-xl text-xs font-semibold border-orange-500/30 bg-orange-500/10 text-[#E8622C] hover:bg-gradient-to-r hover:from-[#F0806B] hover:to-[#E8622C] hover:text-white transition-all gap-2 py-2"
              >
                <Bell className="w-4 h-4" />
                <span>{sendingReminder ? "Disparando no WhatsApp..." : "Disparar Lembrete pelo WhatsApp"}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-950/60 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
          <span>Criado em {new Date(appointment.$createdAt || Date.now()).toLocaleDateString("pt-BR")}</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200"
          >
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
};
