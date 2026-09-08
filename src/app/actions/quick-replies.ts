"use server";

import { QuickReplyDocument } from "@/types/appwrite";
import { mockQuickReplies } from "@/lib/mock-data";

// Store in-memory fallback for current runtime if Appwrite collection isn't yet set up
let inMemoryQuickReplies: Partial<QuickReplyDocument>[] = [...mockQuickReplies];

export async function fetchQuickRepliesAction(): Promise<{
  success: boolean;
  data?: Partial<QuickReplyDocument>[];
  error?: string;
}> {
  try {
    return { success: true, data: inMemoryQuickReplies };
  } catch (error: any) {
    console.error("[fetchQuickRepliesAction] Erro:", error);
    return { success: false, error: error.message || "Falha ao carregar mensagens rápidas" };
  }
}

export async function createQuickReplyAction(data: {
  title: string;
  shortcut: string;
  content: string;
  category?: string;
}): Promise<{ success: boolean; data?: Partial<QuickReplyDocument>; error?: string }> {
  try {
    const formattedShortcut = data.shortcut.startsWith("/")
      ? data.shortcut.toLowerCase().trim()
      : `/${data.shortcut.toLowerCase().trim()}`;

    const newReply: Partial<QuickReplyDocument> = {
      $id: `qr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: data.title.trim(),
      shortcut: formattedShortcut,
      content: data.content.trim(),
      category: data.category?.trim() || "Geral",
      tenantId: "tenant_01",
      $createdAt: new Date().toISOString(),
      $updatedAt: new Date().toISOString(),
    };

    inMemoryQuickReplies.unshift(newReply);

    return { success: true, data: newReply };
  } catch (error: any) {
    console.error("[createQuickReplyAction] Erro:", error);
    return { success: false, error: error.message || "Falha ao criar resposta rápida" };
  }
}

export async function updateQuickReplyAction(
  id: string,
  data: Partial<Pick<QuickReplyDocument, "title" | "shortcut" | "content" | "category">>
): Promise<{ success: boolean; data?: Partial<QuickReplyDocument>; error?: string }> {
  try {
    const index = inMemoryQuickReplies.findIndex((qr) => qr.$id === id);
    if (index === -1) {
      return { success: false, error: "Resposta rápida não encontrada" };
    }

    const updatedReply: Partial<QuickReplyDocument> = {
      ...inMemoryQuickReplies[index],
      ...data,
      shortcut: data.shortcut
        ? data.shortcut.startsWith("/")
          ? data.shortcut.toLowerCase().trim()
          : `/${data.shortcut.toLowerCase().trim()}`
        : inMemoryQuickReplies[index].shortcut,
      $updatedAt: new Date().toISOString(),
    };

    inMemoryQuickReplies[index] = updatedReply;

    return { success: true, data: updatedReply };
  } catch (error: any) {
    console.error("[updateQuickReplyAction] Erro:", error);
    return { success: false, error: error.message || "Falha ao atualizar resposta rápida" };
  }
}

export async function deleteQuickReplyAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    inMemoryQuickReplies = inMemoryQuickReplies.filter((qr) => qr.$id !== id);
    return { success: true };
  } catch (error: any) {
    console.error("[deleteQuickReplyAction] Erro:", error);
    return { success: false, error: error.message || "Falha ao excluir resposta rápida" };
  }
}
