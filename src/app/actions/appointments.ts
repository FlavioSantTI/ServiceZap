"use server";

import { AppointmentDocument, AppointmentStatus } from "@/types/appwrite";
import { mockAppointments } from "@/lib/mock-data";
import { sendWhatsAppMessageDirectAction } from "@/app/actions/whatsapp";
import { sanitizeWhatsAppJid } from "@/lib/utils/whatsappUtils";
import { revalidatePath } from "next/cache";

// Fallback em memória para ambiente runtime / Appwrite
let inMemoryAppointments: Partial<AppointmentDocument>[] = [...mockAppointments];

export interface FetchAppointmentsFilter {
  date?: string; // YYYY-MM-DD
  month?: string; // YYYY-MM
  status?: AppointmentStatus;
  attendant?: string;
  search?: string;
}

export async function fetchAppointmentsAction(
  filters?: FetchAppointmentsFilter
): Promise<{
  success: boolean;
  data?: Partial<AppointmentDocument>[];
  error?: string;
}> {
  try {
    let filtered = [...inMemoryAppointments];

    if (filters) {
      if (filters.date) {
        filtered = filtered.filter((apt) => apt.date === filters.date);
      }
      if (filters.month) {
        filtered = filtered.filter((apt) => apt.date && apt.date.startsWith(filters.month!));
      }
      if (filters.status) {
        filtered = filtered.filter((apt) => apt.status === filters.status);
      }
      if (filters.attendant) {
        filtered = filtered.filter(
          (apt) => apt.attendantName?.toLowerCase() === filters.attendant?.toLowerCase()
        );
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        filtered = filtered.filter(
          (apt) =>
            (apt.clientName && apt.clientName.toLowerCase().includes(q)) ||
            (apt.clientPhone && apt.clientPhone.includes(q)) ||
            (apt.serviceName && apt.serviceName.toLowerCase().includes(q))
        );
      }
    }

    // Ordenar por data ascendente e horário ascendente
    filtered.sort((a, b) => {
      const dateCompare = (a.date || "").localeCompare(b.date || "");
      if (dateCompare !== 0) return dateCompare;
      return (a.time || "").localeCompare(b.time || "");
    });

    return { success: true, data: filtered };
  } catch (error: any) {
    console.error("[fetchAppointmentsAction] Erro:", error);
    return { success: false, error: error.message || "Falha ao carregar agendamentos" };
  }
}

export async function createAppointmentAction(data: {
  clientId?: string;
  clientName: string;
  clientPhone: string;
  serviceId?: string;
  serviceName: string;
  attendantName?: string;
  date: string;
  time: string;
  durationMinutes?: number;
  status?: AppointmentStatus;
  location?: string;
  notes?: string;
  sendWhatsAppConfirmation?: boolean;
}): Promise<{
  success: boolean;
  data?: Partial<AppointmentDocument>;
  whatsappSent?: boolean;
  error?: string;
}> {
  try {
    const cleanPhone = sanitizeWhatsAppJid(data.clientPhone);

    const newAppointment: Partial<AppointmentDocument> = {
      $id: `apt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      tenantId: "tenant_01",
      clientId: data.clientId,
      clientName: data.clientName.trim(),
      clientPhone: cleanPhone,
      serviceId: data.serviceId,
      serviceName: data.serviceName.trim(),
      attendantName: data.attendantName?.trim() || "Atendimento",
      date: data.date,
      time: data.time,
      durationMinutes: data.durationMinutes || 60,
      status: data.status || "scheduled",
      location: data.location?.trim() || "Sede / Balcão Principal",
      notes: data.notes?.trim() || "",
      reminderSent: false,
      $createdAt: new Date().toISOString(),
      $updatedAt: new Date().toISOString(),
    };

    inMemoryAppointments.unshift(newAppointment);

    let whatsappSent = false;
    if (data.sendWhatsAppConfirmation && cleanPhone) {
      try {
        const formattedDate = newAppointment.date?.split("-").reverse().join("/") || newAppointment.date;
        const message =
          `📅 *Confirmação de Agendamento - ServiceZap*\n\n` +
          `Olá *${newAppointment.clientName}*, seu atendimento foi agendado com sucesso!\n\n` +
          `🛠 *Serviço:* ${newAppointment.serviceName}\n` +
          `📆 *Data:* ${formattedDate}\n` +
          `⏰ *Horário:* ${newAppointment.time} (${newAppointment.durationMinutes} min)\n` +
          `👨‍💼 *Profissional:* ${newAppointment.attendantName}\n` +
          `📍 *Local:* ${newAppointment.location}\n\n` +
          `Caso precise remarcar ou tenha dúvidas, por favor nos avise por este canal!`;

        await sendWhatsAppMessageDirectAction(cleanPhone, message);
        whatsappSent = true;
      } catch (waErr) {
        console.warn("[createAppointmentAction] Falha ao enviar confirmação WhatsApp:", waErr);
      }
    }

    revalidatePath("/dashboard/agenda");
    return { success: true, data: newAppointment, whatsappSent };
  } catch (error: any) {
    console.error("[createAppointmentAction] Erro:", error);
    return { success: false, error: error.message || "Falha ao criar agendamento" };
  }
}

export async function updateAppointmentAction(
  id: string,
  data: Partial<
    Pick<
      AppointmentDocument,
      | "clientName"
      | "clientPhone"
      | "serviceName"
      | "attendantName"
      | "date"
      | "time"
      | "durationMinutes"
      | "status"
      | "location"
      | "notes"
      | "reminderSent"
    >
  >
): Promise<{ success: boolean; data?: Partial<AppointmentDocument>; error?: string }> {
  try {
    const index = inMemoryAppointments.findIndex((apt) => apt.$id === id);
    if (index === -1) {
      return { success: false, error: "Agendamento não encontrado" };
    }

    const updated: Partial<AppointmentDocument> = {
      ...inMemoryAppointments[index],
      ...data,
      clientPhone: data.clientPhone
        ? sanitizeWhatsAppJid(data.clientPhone)
        : inMemoryAppointments[index].clientPhone,
      $updatedAt: new Date().toISOString(),
    };

    inMemoryAppointments[index] = updated;
    revalidatePath("/dashboard/agenda");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("[updateAppointmentAction] Erro:", error);
    return { success: false, error: error.message || "Falha ao atualizar agendamento" };
  }
}

export async function updateAppointmentStatusAction(
  id: string,
  status: AppointmentStatus
): Promise<{ success: boolean; data?: Partial<AppointmentDocument>; error?: string }> {
  try {
    const index = inMemoryAppointments.findIndex((apt) => apt.$id === id);
    if (index === -1) {
      return { success: false, error: "Agendamento não encontrado" };
    }

    inMemoryAppointments[index] = {
      ...inMemoryAppointments[index],
      status,
      $updatedAt: new Date().toISOString(),
    };

    revalidatePath("/dashboard/agenda");
    return { success: true, data: inMemoryAppointments[index] };
  } catch (error: any) {
    console.error("[updateAppointmentStatusAction] Erro:", error);
    return { success: false, error: error.message || "Falha ao alterar status" };
  }
}

export async function deleteAppointmentAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    inMemoryAppointments = inMemoryAppointments.filter((apt) => apt.$id !== id);
    revalidatePath("/dashboard/agenda");
    return { success: true };
  } catch (error: any) {
    console.error("[deleteAppointmentAction] Erro:", error);
    return { success: false, error: error.message || "Falha ao excluir agendamento" };
  }
}

export async function sendAppointmentWhatsAppReminderAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const apt = inMemoryAppointments.find((a) => a.$id === id);
    if (!apt) {
      return { success: false, error: "Agendamento não encontrado" };
    }

    const cleanPhone = sanitizeWhatsAppJid(apt.clientPhone || "");
    if (!cleanPhone) {
      return { success: false, error: "Cliente sem telefone cadastrado" };
    }

    const formattedDate = apt.date?.split("-").reverse().join("/") || apt.date;
    const reminderMsg =
      `🔔 *Lembrete de Atendimento - ServiceZap*\n\n` +
      `Olá *${apt.clientName}*, este é um lembrete do seu atendimento programado:\n\n` +
      `🛠 *Serviço:* ${apt.serviceName}\n` +
      `📆 *Data:* ${formattedDate}\n` +
      `⏰ *Horário:* ${apt.time}\n` +
      `📍 *Local:* ${apt.location || "Sede Principal"}\n\n` +
      `Podemos confirmar a sua presença? Responda com *SIM* para confirmar.`;

    await sendWhatsAppMessageDirectAction(cleanPhone, reminderMsg);

    // Marcar reminderSent como true
    const index = inMemoryAppointments.findIndex((a) => a.$id === id);
    if (index !== -1) {
      inMemoryAppointments[index].reminderSent = true;
      inMemoryAppointments[index].$updatedAt = new Date().toISOString();
    }

    revalidatePath("/dashboard/agenda");
    return { success: true };
  } catch (error: any) {
    console.error("[sendAppointmentWhatsAppReminderAction] Erro:", error);
    return { success: false, error: error.message || "Falha ao enviar lembrete via WhatsApp" };
  }
}
