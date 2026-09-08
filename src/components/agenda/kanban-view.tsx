"use client";

import React from "react";
import { AppointmentDocument, AppointmentStatus } from "@/types/appwrite";
import {
  Clock,
  User,
  Phone,
  Briefcase,
  MapPin,
  MessageSquare,
  CheckCircle2,
  PlayCircle,
  Calendar as CalendarIcon,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

interface KanbanViewProps {
  appointments: Partial<AppointmentDocument>[];
  onSelectAppointment: (appointment: Partial<AppointmentDocument>) => void;
  onAdvanceStatus?: (id: string, nextStatus: AppointmentStatus) => void;
}

const COLUMNS: {
  status: AppointmentStatus;
  title: string;
  dotColor: string;
  badgeBg: string;
  badgeText: string;
  nextStatus?: AppointmentStatus;
  nextLabel?: string;
}[] = [
  {
    status: "scheduled",
    title: "Agendados",
    dotColor: "bg-amber-500",
    badgeBg: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    badgeText: "text-amber-500",
    nextStatus: "confirmed",
    nextLabel: "Confirmar",
  },
  {
    status: "confirmed",
    title: "Confirmados",
    dotColor: "bg-[#E8622C]",
    badgeBg: "bg-orange-500/10 text-[#E8622C] border-orange-500/20",
    badgeText: "text-[#E8622C]",
    nextStatus: "in_progress",
    nextLabel: "Iniciar",
  },
  {
    status: "in_progress",
    title: "Em Atendimento",
    dotColor: "bg-amber-600",
    badgeBg: "bg-amber-600/10 text-amber-600 border-amber-600/20",
    badgeText: "text-amber-600",
    nextStatus: "completed",
    nextLabel: "Concluir",
  },
  {
    status: "completed",
    title: "Concluídos",
    dotColor: "bg-[#2B2B2B]",
    badgeBg: "bg-orange-500/15 text-[#E8622C] border-orange-500/20",
    badgeText: "text-[#E8622C]",
  },
];

export const KanbanView: React.FC<KanbanViewProps> = ({
  appointments,
  onSelectAppointment,
  onAdvanceStatus,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
      {COLUMNS.map((col) => {
        const columnApts = appointments.filter((a) => a.status === col.status);

        return (
          <div
            key={col.status}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col overflow-hidden"
          >
            {/* Header da Coluna */}
            <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  {col.title}
                </h4>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {columnApts.length}
              </span>
            </div>

            {/* Lista de Cards */}
            <div className="p-3 space-y-2.5 min-h-[250px] max-h-[650px] overflow-y-auto">
              {columnApts.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs">
                  Nenhum atendimento nesta etapa.
                </div>
              ) : (
                columnApts.map((apt) => {
                  const formattedDate = apt.date ? apt.date.split("-").reverse().join("/") : "";

                  return (
                    <div
                      key={apt.$id}
                      onClick={() => onSelectAppointment(apt)}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:border-[#E8622C]/40 dark:hover:border-[#E8622C]/40 transition-all cursor-pointer space-y-2.5 group hover:shadow-xs"
                    >
                      {/* Topo do Card: Horário & Data */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                          <CalendarIcon className="w-3 h-3 text-[#E8622C]" />
                          <span>{formattedDate}</span>
                        </span>
                        <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                          {apt.time}
                        </span>
                      </div>

                      {/* Título do Serviço e Cliente */}
                      <div>
                        <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-1">
                          {apt.serviceName}
                        </h5>
                        <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <User className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{apt.clientName}</span>
                        </p>
                      </div>

                      {/* Atendente & Local */}
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                        {apt.attendantName && (
                          <p className="flex items-center gap-1 truncate">
                            <Briefcase className="w-3 h-3 text-[#E8622C] shrink-0" />
                            <span>{apt.attendantName}</span>
                          </p>
                        )}
                        {apt.location && (
                          <p className="flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                            <span className="truncate">{apt.location}</span>
                          </p>
                        )}
                      </div>

                      {/* Rodapé do Card com Ação Rápida */}
                      <div className="flex items-center justify-between pt-1">
                        {apt.clientPhone ? (
                          <Link
                            href="/dashboard/whatsapp"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-lg bg-orange-500/10 text-[#E8622C] hover:bg-gradient-to-r hover:from-[#F0806B] hover:to-[#E8622C] hover:text-white transition-colors"
                            title="Abrir WhatsApp"
                          >
                            <MessageSquare className="w-3 h-3" />
                          </Link>
                        ) : (
                          <div />
                        )}

                        {col.nextStatus && col.nextLabel && onAdvanceStatus && apt.$id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAdvanceStatus(apt.$id!, col.nextStatus!);
                            }}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-200/80 hover:bg-gradient-to-r hover:from-[#F0806B] hover:to-[#E8622C] hover:text-white dark:bg-slate-800 dark:hover:from-[#F0806B] dark:hover:to-[#E8622C] text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1"
                          >
                            <span>{col.nextLabel}</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
