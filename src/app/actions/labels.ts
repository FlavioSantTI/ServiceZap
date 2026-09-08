"use server";

import { LabelDocument } from "@/types/appwrite";
import { mockLabels } from "@/lib/mock-data";

// Store in-memory fallback for current runtime
let inMemoryLabels: Partial<LabelDocument>[] = [...mockLabels];

// Map phone number to label IDs in memory
let inMemoryContactLabels: Record<string, string[]> = {
  "556399565095": ["lbl_01", "lbl_03"],
};

export async function fetchLabelsAction(): Promise<{
  success: boolean;
  data?: Partial<LabelDocument>[];
  error?: string;
}> {
  try {
    return { success: true, data: inMemoryLabels };
  } catch (error: any) {
    console.error("[fetchLabelsAction] Erro:", error);
    return { success: false, error: error.message || "Falha ao carregar rótulos" };
  }
}

export async function createLabelAction(data: {
  name: string;
  color: string;
  description?: string;
}): Promise<{ success: boolean; data?: Partial<LabelDocument>; error?: string }> {
  try {
    const newLabel: Partial<LabelDocument> = {
      $id: `lbl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: data.name.trim(),
      color: data.color.trim() || "#6366f1",
      description: data.description?.trim() || "",
      tenantId: "tenant_01",
      $createdAt: new Date().toISOString(),
      $updatedAt: new Date().toISOString(),
    };

    inMemoryLabels.push(newLabel);

    return { success: true, data: newLabel };
  } catch (error: any) {
    console.error("[createLabelAction] Erro:", error);
    return { success: false, error: error.message || "Falha ao criar rótulo" };
  }
}

export async function updateLabelAction(
  id: string,
  data: Partial<Pick<LabelDocument, "name" | "color" | "description">>
): Promise<{ success: boolean; data?: Partial<LabelDocument>; error?: string }> {
  try {
    const index = inMemoryLabels.findIndex((lbl) => lbl.$id === id);
    if (index === -1) {
      return { success: false, error: "Rótulo não encontrado" };
    }

    const updatedLabel: Partial<LabelDocument> = {
      ...inMemoryLabels[index],
      ...data,
      $updatedAt: new Date().toISOString(),
    };

    inMemoryLabels[index] = updatedLabel;

    return { success: true, data: updatedLabel };
  } catch (error: any) {
    console.error("[updateLabelAction] Erro:", error);
    return { success: false, error: error.message || "Falha ao atualizar rótulo" };
  }
}

export async function deleteLabelAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    inMemoryLabels = inMemoryLabels.filter((lbl) => lbl.$id !== id);
    // Remove label from all contacts
    Object.keys(inMemoryContactLabels).forEach((phone) => {
      inMemoryContactLabels[phone] = inMemoryContactLabels[phone].filter((lId) => lId !== id);
    });
    return { success: true };
  } catch (error: any) {
    console.error("[deleteLabelAction] Erro:", error);
    return { success: false, error: error.message || "Falha ao excluir rótulo" };
  }
}

export async function getContactLabelsAction(phone: string): Promise<{ success: boolean; data: string[] }> {
  try {
    const labels = inMemoryContactLabels[phone] || [];
    return { success: true, data: labels };
  } catch (error: any) {
    console.error("[getContactLabelsAction] Erro:", error);
    return { success: false, data: [] };
  }
}

export async function updateContactLabelsAction(
  phone: string,
  labelIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    inMemoryContactLabels[phone] = labelIds;
    return { success: true };
  } catch (error: any) {
    console.error("[updateContactLabelsAction] Erro:", error);
    return { success: false, error: error.message || "Falha ao vincular rótulos ao contato" };
  }
}

export async function getAllContactsLabelsAction(): Promise<{ success: boolean; data: Record<string, string[]> }> {
  try {
    return { success: true, data: { ...inMemoryContactLabels } };
  } catch (error: any) {
    console.error("[getAllContactsLabelsAction] Erro:", error);
    return { success: false, data: {} };
  }
}
