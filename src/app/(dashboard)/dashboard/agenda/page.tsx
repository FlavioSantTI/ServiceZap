"use client";

import React, { useState, useEffect } from "react";
import {
  AppointmentDocument,
  AppointmentStatus,
  ClientDocument,
  ServiceDocument,
} from "@/types/appwrite";
import {
  fetchAppointmentsAction,
  updateAppointmentStatusAction,
} from "@/app/actions/appointments";
import { fetchClientsAction } from "@/app/actions/clients";
import { fetchServicesAction } from "@/app/actions/services";
import { AgendaHeader, AgendaViewMode } from "@/components/agenda/agenda-header";
import { CalendarView } from "@/components/agenda/calendar-view";
import { WeekView } from "@/components/agenda/week-view";
import { KanbanView } from "@/components/agenda/kanban-view";
import { AppointmentModal } from "@/components/agenda/appointment-modal";
import { AppointmentDetailsDrawer } from "@/components/agenda/appointment-details-drawer";
import { Calendar, RefreshCw } from "lucide-react";

export default function AgendaPage() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<AgendaViewMode>("month");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">("all");

  const [appointments, setAppointments] = useState<Partial<AppointmentDocument>[]>([]);
  const [clients, setClients] = useState<Partial<ClientDocument>[]>([]);
  const [services, setServices] = useState<Partial<ServiceDocument>[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Estados dos Modais
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Partial<AppointmentDocument> | null>(null);
  const [appointmentToEdit, setAppointmentToEdit] = useState<Partial<AppointmentDocument> | null>(null);
  const [modalInitialDate, setModalInitialDate] = useState<string | undefined>(undefined);

  const loadData = async () => {
    setLoading(true);
    try {
      const [aptsRes, clientsRes, servicesRes] = await Promise.all([
        fetchAppointmentsAction(),
        fetchClientsAction(),
        fetchServicesAction(),
      ]);

      if (aptsRes.success && aptsRes.data) {
        setAppointments(aptsRes.data);
      }
      if (clientsRes) setClients(clientsRes);
      if (servicesRes) setServices(servicesRes);
    } catch (err) {
      console.error("Erro ao carregar dados da agenda:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtros aplicados em memória na lista de appointments
  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      !searchTerm.trim() ||
      (apt.clientName && apt.clientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (apt.serviceName && apt.serviceName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (apt.clientPhone && apt.clientPhone.includes(searchTerm)) ||
      (apt.attendantName && apt.attendantName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "all" || apt.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleSelectAppointment = (apt: Partial<AppointmentDocument>) => {
    setSelectedAppointment(apt);
    setDrawerOpen(true);
  };

  const handleOpenNew = (dateStr?: string) => {
    setAppointmentToEdit(null);
    setModalInitialDate(dateStr || new Date().toISOString().split("T")[0]);
    setModalOpen(true);
  };

  const handleEditAppointment = (apt: Partial<AppointmentDocument>) => {
    setAppointmentToEdit(apt);
    setModalOpen(true);
  };

  const handleAdvanceStatus = async (id: string, nextStatus: AppointmentStatus) => {
    const res = await updateAppointmentStatusAction(id, nextStatus);
    if (res.success && res.data) {
      setAppointments((prev) =>
        prev.map((item) => (item.$id === id ? res.data! : item))
      );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Geral da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <Calendar className="w-7 h-7 text-[#E8622C]" />
            <span>Agenda de Atendimento</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Gerenciamento interno de horários, visitas técnicas e confirmações de presença via WhatsApp
          </p>
        </div>
      </div>

      {/* Controles de Cabeçalho, KPIs e Filtros */}
      <AgendaHeader
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onOpenNewAppointment={() => handleOpenNew()}
        appointments={appointments}
      />

      {/* Área de Visualização Principal */}
      {loading ? (
        <div className="py-24 text-center text-zinc-400 text-xs flex flex-col items-center justify-center space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin text-[#E8622C]" />
          <span>Carregando agenda...</span>
        </div>
      ) : (
        <div className="animate-in fade-in duration-200">
          {viewMode === "month" && (
            <CalendarView
              currentDate={currentDate}
              appointments={filteredAppointments}
              onSelectAppointment={handleSelectAppointment}
              onNewAppointmentOnDate={(dateStr) => handleOpenNew(dateStr)}
            />
          )}

          {viewMode === "week" && (
            <WeekView
              currentDate={currentDate}
              appointments={filteredAppointments}
              onSelectAppointment={handleSelectAppointment}
              onNewAppointmentOnDate={(dateStr, timeStr) => handleOpenNew(dateStr)}
            />
          )}

          {viewMode === "kanban" && (
            <KanbanView
              appointments={filteredAppointments}
              onSelectAppointment={handleSelectAppointment}
              onAdvanceStatus={handleAdvanceStatus}
            />
          )}
        </div>
      )}

      {/* Modal de Criação / Edição */}
      <AppointmentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={(savedApt) => {
          setAppointments((prev) => {
            const exists = prev.some((a) => a.$id === savedApt.$id);
            if (exists) {
              return prev.map((a) => (a.$id === savedApt.$id ? savedApt : a));
            }
            return [savedApt, ...prev];
          });
        }}
        appointmentToEdit={appointmentToEdit}
        initialDate={modalInitialDate}
        clientsList={clients}
        servicesList={services}
      />

      {/* Drawer Lateral de Detalhes & Ações */}
      <AppointmentDetailsDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        appointment={selectedAppointment}
        onEdit={handleEditAppointment}
        onUpdated={(updatedApt) => {
          setSelectedAppointment(updatedApt);
          setAppointments((prev) =>
            prev.map((a) => (a.$id === updatedApt.$id ? updatedApt : a))
          );
        }}
        onDeleted={(deletedId) => {
          setAppointments((prev) => prev.filter((a) => a.$id !== deletedId));
          setDrawerOpen(false);
        }}
      />
    </div>
  );
}
