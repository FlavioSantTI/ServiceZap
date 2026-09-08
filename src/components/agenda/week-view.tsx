"use client";

import React from "react";
import { AppointmentDocument, AppointmentStatus } from "@/types/appwrite";
import { Clock, Plus, User, MapPin } from "lucide-react";

interface WeekViewProps {
  currentDate: Date;
  appointments: Partial<AppointmentDocument>[];
  onSelectAppointment: (appointment: Partial<AppointmentDocument>) => void;
  onNewAppointmentOnDate: (dateStr: string, timeStr?: string) => void;
}

const HOURS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
];

const WEEK_DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

const STATUS_COLOR_MAP: Record<
  AppointmentStatus,
  { bg: string; text: string; border: string }
> = {
  scheduled: {
    bg: "bg-amber-500/15 dark:bg-amber-500/20",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-500/40",
  },
  confirmed: {
    bg: "bg-orange-500/15 dark:bg-orange-500/20",
    text: "text-[#E8622C]",
    border: "border-orange-500/40",
  },
  in_progress: {
    bg: "bg-amber-600/15 dark:bg-amber-600/20",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-600/40",
  },
  completed: {
    bg: "bg-orange-500/20 dark:bg-orange-500/25",
    text: "text-[#E8622C]",
    border: "border-orange-500/40",
  },
  canceled: {
    bg: "bg-rose-500/15 dark:bg-rose-500/20",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-500/40",
  },
  no_show: {
    bg: "bg-zinc-500/15 dark:bg-zinc-500/20",
    text: "text-zinc-700 dark:text-zinc-300",
    border: "border-zinc-500/40",
  },
};

export const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  appointments,
  onSelectAppointment,
  onNewAppointmentOnDate,
}) => {
  // Obter o primeiro dia da semana (Segunda-feira)
  const tempDate = new Date(currentDate);
  const dayOfWeek = tempDate.getDay(); // 0 = Dom, 1 = Seg ...
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  tempDate.setDate(tempDate.getDate() + diffToMonday);

  const weekDays: { name: string; dateStr: string; dayNum: number; isToday: boolean }[] = [];
  const todayStr = new Date().toISOString().split("T")[0];

  for (let i = 0; i < 7; i++) {
    const d = new Date(tempDate);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    weekDays.push({
      name: WEEK_DAYS[i],
      dateStr,
      dayNum: d.getDate(),
      isToday: dateStr === todayStr,
    });
  }

  // Agrupar agendamentos por data
  const appointmentsByDate: Record<string, Partial<AppointmentDocument>[]> = {};
  appointments.forEach((apt) => {
    if (apt.date) {
      if (!appointmentsByDate[apt.date]) appointmentsByDate[apt.date] = [];
      appointmentsByDate[apt.date].push(apt);
    }
  });

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col">
      {/* Header dos 7 Dias */}
      <div className="grid grid-cols-8 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-center py-3">
        <div className="text-xs font-bold text-slate-400 dark:text-slate-500 flex items-center justify-center">
          <Clock className="w-3.5 h-3.5" />
        </div>
        {weekDays.map((wd) => (
          <div key={wd.dateStr} className="space-y-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              {wd.name}
            </span>
            <span
              className={`inline-flex items-center justify-center text-xs font-bold w-6 h-6 rounded-full ${
                wd.isToday
                  ? "bg-gradient-to-r from-[#F0806B] to-[#E8622C] text-white shadow-sm shadow-orange-500/30"
                  : "text-slate-900 dark:text-slate-100"
              }`}
            >
              {wd.dayNum}
            </span>
          </div>
        ))}
      </div>

      {/* Grade de Horários */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[600px] overflow-y-auto">
        {HOURS.map((hour) => (
          <div key={hour} className="grid grid-cols-8 min-h-[58px] group">
            {/* Coluna de Horário */}
            <div className="border-r border-slate-200 dark:border-slate-800 p-2 text-[11px] font-mono font-medium text-slate-400 dark:text-slate-500 text-center flex items-start justify-center">
              {hour}
            </div>

            {/* 7 Colunas para cada dia */}
            {weekDays.map((wd) => {
              const dayApts = appointmentsByDate[wd.dateStr] || [];
              const hourApts = dayApts.filter((apt) => apt.time?.startsWith(hour.split(":")[0]));

              return (
                <div
                  key={wd.dateStr}
                  onClick={() => {
                    if (hourApts.length === 0) {
                      onNewAppointmentOnDate(wd.dateStr, hour);
                    }
                  }}
                  className="border-r border-slate-100 dark:border-slate-800/60 p-1 relative hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                >
                  {hourApts.map((apt) => {
                    const statusConfig =
                      STATUS_COLOR_MAP[apt.status || "scheduled"] || STATUS_COLOR_MAP.scheduled;

                    return (
                      <div
                        key={apt.$id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAppointment(apt);
                        }}
                        className={`p-1.5 rounded-xl text-xs border shadow-2xs mb-1 transition-transform hover:scale-[1.02] ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-mono font-bold text-[10px]">{apt.time}</span>
                          <span className="text-[10px] opacity-75 truncate">{apt.durationMinutes}m</span>
                        </div>
                        <p className="font-semibold text-xs truncate mt-0.5">{apt.clientName}</p>
                        <p className="text-[10px] opacity-85 truncate">{apt.serviceName}</p>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
