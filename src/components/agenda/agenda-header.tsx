"use client";

import React from "react";
import { AppointmentDocument, AppointmentStatus } from "@/types/appwrite";
import {
  Calendar as CalendarIcon,
  Clock,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  CheckCircle2,
  PlayCircle,
  AlertCircle,
  Sparkles,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type AgendaViewMode = "month" | "week" | "kanban";

interface AgendaHeaderProps {
  currentDate: Date;
  onDateChange: (newDate: Date) => void;
  viewMode: AgendaViewMode;
  onViewModeChange: (mode: AgendaViewMode) => void;
  searchTerm: string;
  onSearchChange: (search: string) => void;
  statusFilter: AppointmentStatus | "all";
  onStatusFilterChange: (status: AppointmentStatus | "all") => void;
  onOpenNewAppointment: () => void;
  appointments: Partial<AppointmentDocument>[];
}

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export const AgendaHeader: React.FC<AgendaHeaderProps> = ({
  currentDate,
  onDateChange,
  viewMode,
  onViewModeChange,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onOpenNewAppointment,
  appointments,
}) => {
  // Cálculo de KPIs
  const todayStr = new Date().toISOString().split("T")[0];
  const todayAppointments = appointments.filter((a) => a.date === todayStr);
  const confirmedCount = appointments.filter((a) => a.status === "confirmed").length;
  const inProgressCount = appointments.filter((a) => a.status === "in_progress").length;
  const completedCount = appointments.filter((a) => a.status === "completed").length;

  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewMode === "month") {
      next.setMonth(next.getMonth() - 1);
    } else if (viewMode === "week") {
      next.setDate(next.getDate() - 7);
    } else {
      next.setDate(next.getDate() - 1);
    }
    onDateChange(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === "month") {
      next.setMonth(next.getMonth() + 1);
    } else if (viewMode === "week") {
      next.setDate(next.getDate() + 7);
    } else {
      next.setDate(next.getDate() + 1);
    }
    onDateChange(next);
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const periodLabel = `${MONTH_NAMES[currentDate.getMonth()]} de ${currentDate.getFullYear()}`;

  return (
    <div className="space-y-4">
      {/* 1. KPIs Topo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-card border border-border shadow-warm-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-muted-foreground">Hoje</span>
            <p className="text-xl font-bold text-foreground">{todayAppointments.length}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 border border-amber-500/20">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-card border border-border shadow-warm-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-muted-foreground">Confirmados</span>
            <p className="text-xl font-bold text-primary">{confirmedCount}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-primary/15 text-primary border border-primary/20">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-card border border-border shadow-warm-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-muted-foreground">Em Atendimento</span>
            <p className="text-xl font-bold text-foreground">{inProgressCount}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-muted text-muted-foreground border border-border">
            <PlayCircle className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-card border border-border shadow-warm-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-muted-foreground">Concluídos</span>
            <p className="text-xl font-bold text-primary">{completedCount}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-primary/20 text-primary border border-primary/30">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 2. Barra Principal de Controles */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-warm-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Navegação de Datas */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={handleToday}
            className="h-9 px-3 rounded-xl text-xs font-semibold border-border bg-card text-foreground hover:bg-muted"
          >
            Hoje
          </Button>

          <div className="flex items-center rounded-xl border border-border overflow-hidden bg-muted/50">
            <button
              onClick={handlePrev}
              title="Anterior"
              className="p-2 hover:bg-muted text-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 text-xs font-bold text-foreground min-w-[150px] text-center select-none">
              {periodLabel}
            </span>
            <button
              onClick={handleNext}
              title="Próximo"
              className="p-2 hover:bg-muted text-foreground transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Alternador de Modo de Visualização */}
          <div className="flex items-center p-1 rounded-xl bg-muted border border-border gap-1 text-xs">
            <button
              onClick={() => onViewModeChange("month")}
              className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                viewMode === "month"
                  ? "bg-card text-foreground shadow-xs font-bold border border-border/50"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5 text-primary" />
              <span>Mês</span>
            </button>

            <button
              onClick={() => onViewModeChange("week")}
              className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                viewMode === "week"
                  ? "bg-card text-foreground shadow-xs font-bold border border-border/50"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>Semana</span>
            </button>

            <button
              onClick={() => onViewModeChange("kanban")}
              className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                viewMode === "kanban"
                  ? "bg-card text-foreground shadow-xs font-bold border border-border/50"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-primary" />
              <span>Fluxo Kanban</span>
            </button>
          </div>
        </div>

        {/* Busca, Filtro e Botão Novo */}
        <div className="flex items-center gap-2.5 w-full lg:w-auto justify-end flex-wrap">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
            <Input
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar cliente, serviço..."
              className="pl-8 h-9 text-xs rounded-xl bg-card border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as AppointmentStatus | "all")}
            className="h-9 px-3 rounded-xl bg-card border border-border text-xs font-medium text-foreground focus:outline-none"
          >
            <option value="all">Todos os Status</option>
            <option value="scheduled">Agendados</option>
            <option value="confirmed">Confirmados</option>
            <option value="in_progress">Em Atendimento</option>
            <option value="completed">Concluídos</option>
            <option value="canceled">Cancelados</option>
          </select>

          <Button
            size="sm"
            onClick={onOpenNewAppointment}
            className="h-9 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-xs gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Agendamento</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
