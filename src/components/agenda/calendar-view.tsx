"use client";

import React from "react";
import { AppointmentDocument, AppointmentStatus } from "@/types/appwrite";
import { Plus, Clock, User, Phone } from "lucide-react";

interface CalendarViewProps {
  currentDate: Date;
  appointments: Partial<AppointmentDocument>[];
  onSelectAppointment: (appointment: Partial<AppointmentDocument>) => void;
  onNewAppointmentOnDate: (dateStr: string) => void;
}

const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const STATUS_COLOR_MAP: Record<AppointmentStatus, string> = {
  scheduled: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25",
  confirmed: "bg-orange-500/15 text-[#E8622C] border-orange-500/25",
  in_progress: "bg-amber-600/15 text-amber-700 dark:text-amber-300 border-amber-600/25",
  completed: "bg-orange-500/20 text-[#E8622C] border-orange-500/30",
  canceled: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/25",
  no_show: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/25",
};

export const CalendarView: React.FC<CalendarViewProps> = ({
  currentDate,
  appointments,
  onSelectAppointment,
  onNewAppointmentOnDate,
}) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Primeiro dia do mês e total de dias
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const totalDaysInPrevMonth = new Date(year, month, 0).getDate();

  const todayStr = new Date().toISOString().split("T")[0];

  // Matriz de 35 a 42 dias para preencher a grade
  const calendarDays: {
    dayNumber: number;
    dateStr: string;
    isCurrentMonth: boolean;
    isToday: boolean;
  }[] = [];

  // Dias do mês anterior
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const day = totalDaysInPrevMonth - i;
    const prevMonthDate = new Date(year, month - 1, day);
    const dateStr = prevMonthDate.toISOString().split("T")[0];
    calendarDays.push({
      dayNumber: day,
      dateStr,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
    });
  }

  // Dias do mês atual
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const currentMonthDate = new Date(year, month, d);
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    calendarDays.push({
      dayNumber: d,
      dateStr,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
    });
  }

  // Dias do próximo mês para completar 35 ou 42 células
  const remainingCells = (7 - (calendarDays.length % 7)) % 7;
  for (let d = 1; d <= remainingCells; d++) {
    const nextMonthDate = new Date(year, month + 1, d);
    const dateStr = nextMonthDate.toISOString().split("T")[0];
    calendarDays.push({
      dayNumber: d,
      dateStr,
      isCurrentMonth: false,
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
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
      {/* Header com Dias da Semana */}
      <div className="grid grid-cols-7 border-b border-border bg-muted/60 text-center py-2.5">
        {WEEK_DAYS.map((day, idx) => (
          <span
            key={day}
            className={`text-xs font-bold uppercase tracking-wider ${
              idx === 0 || idx === 6
                ? "text-muted-foreground"
                : "text-foreground"
            }`}
          >
            {day}
          </span>
        ))}
      </div>

      {/* Grade de Células de Dias */}
      <div className="grid grid-cols-7 divide-x divide-y divide-border bg-card">
        {calendarDays.map((calDay, idx) => {
          const dayAppointments = appointmentsByDate[calDay.dateStr] || [];

          return (
            <div
              key={idx}
              className={`min-h-[110px] sm:min-h-[135px] p-2 flex flex-col justify-between transition-colors group relative ${
                !calDay.isCurrentMonth
                  ? "bg-muted/30 text-muted-foreground/50"
                  : "hover:bg-muted/40 text-foreground"
              }`}
            >
              {/* Header do Dia */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                    calDay.isToday
                      ? "bg-primary text-primary-foreground shadow-xs font-bold"
                      : calDay.isCurrentMonth
                      ? "text-foreground"
                      : "text-muted-foreground/60"
                  }`}
                >
                  {calDay.dayNumber}
                </span>

                {/* Botão rápido + ao passar o mouse */}
                <button
                  onClick={() => onNewAppointmentOnDate(calDay.dateStr)}
                  title={`Agendar em ${calDay.dateStr.split("-").reverse().join("/")}`}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Lista de Agendamentos no Dia */}
              <div className="flex-1 space-y-1 my-1 overflow-y-auto max-h-[85px] no-scrollbar">
                {dayAppointments.slice(0, 3).map((apt) => {
                  const statusStyle =
                    STATUS_COLOR_MAP[apt.status || "scheduled"] || STATUS_COLOR_MAP.scheduled;

                  return (
                    <div
                      key={apt.$id}
                      onClick={() => onSelectAppointment(apt)}
                      title={`${apt.time} - ${apt.clientName} (${apt.serviceName})`}
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium border truncate cursor-pointer transition-transform hover:scale-[1.02] flex items-center gap-1 ${statusStyle}`}
                    >
                      <span className="font-mono font-bold shrink-0">{apt.time}</span>
                      <span className="truncate">{apt.clientName || apt.serviceName}</span>
                    </div>
                  );
                })}

                {dayAppointments.length > 3 && (
                  <div
                    onClick={() => onSelectAppointment(dayAppointments[3])}
                    className="text-[10px] font-semibold text-muted-foreground hover:text-primary px-1 cursor-pointer"
                  >
                    + {dayAppointments.length - 3} mais...
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
