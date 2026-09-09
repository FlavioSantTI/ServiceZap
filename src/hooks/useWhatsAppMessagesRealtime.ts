'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { client, databases } from '@/lib/appwrite/client';
import { Query } from 'appwrite';
import { MessageDocument } from '@/types/appwrite';
import { sanitizeWhatsAppJid, isSamePhone } from '@/lib/utils/whatsappUtils';
import { getWhatsAppMessagesAction } from '@/app/actions/whatsapp';

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'servicezap_db';
const MESSAGES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID || 'messages';

interface UseWhatsAppMessagesRealtimeOptions {
  phone?: string; // Filtrar por telefone específico da conversa (opcional)
  initialMessages?: MessageDocument[];
  limit?: number;
}

export function useWhatsAppMessagesRealtime({
  phone,
  initialMessages = [],
  limit = 60,
}: UseWhatsAppMessagesRealtimeOptions = {}) {
  const [messages, setMessages] = useState<MessageDocument[]>(initialMessages);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Map de referência para checagem O(1) de duplicidades em tempo real
  const messagesMapRef = useRef<Map<string, MessageDocument>>(new Map());

  // Helper para sincronizar o state e o map de de-duplicação
  const syncMessagesFromMap = useCallback(() => {
    const list = Array.from(messagesMapRef.current.values()).sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    setMessages(list);
  }, []);

  // 1. Carga de mensagens via Server Action
  const fetchMessages = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      setError(null);

      let docs: MessageDocument[] = [];

      try {
        docs = await getWhatsAppMessagesAction(phone, limit);
      } catch (actionErr) {
        console.warn('[useWhatsAppMessagesRealtime] Fallback para client databases SDK:', actionErr);
        const queries = [
          Query.orderAsc('created_at'),
          Query.limit(limit),
        ];

        if (phone) {
          const cleanPhone = sanitizeWhatsAppJid(phone);
          const phoneVariants = [cleanPhone];

          if (cleanPhone.startsWith('55') && cleanPhone.length === 13 && cleanPhone[4] === '9') {
            phoneVariants.push(`${cleanPhone.slice(0, 4)}${cleanPhone.slice(5)}`);
          } else if (cleanPhone.startsWith('55') && cleanPhone.length === 12) {
            phoneVariants.push(`${cleanPhone.slice(0, 4)}9${cleanPhone.slice(4)}`);
          }

          queries.push(Query.equal('phone', phoneVariants));
        }

        const response = await databases.listDocuments<MessageDocument>(
          DATABASE_ID,
          MESSAGES_COLLECTION_ID,
          queries
        );
        docs = response.documents;
      }

      // Popula o map eliminando qualquer duplicata residual por whatsapp_message_id
      const newMap = new Map<string, MessageDocument>();
      const seenWamids = new Set<string>();

      for (const doc of docs) {
        if (!doc || !doc.$id) continue;
        const wamid = doc.whatsapp_message_id;
        if (wamid && !wamid.startsWith('app_') && !wamid.startsWith('temp_')) {
          if (seenWamids.has(wamid)) {
            continue; // descarta documento duplicado com mesmo WAMID
          }
          seenWamids.add(wamid);
        }
        newMap.set(doc.$id, doc);
      }

      // Preserva mensagens otimistas temporárias apenas se ainda não foram salvas
      const now = Date.now();
      for (const [key, existing] of messagesMapRef.current.entries()) {
        if (key.startsWith('temp_')) {
          const isAlreadySaved = Array.from(newMap.values()).some((saved) => {
            const isSameDir = saved.direction === existing.direction;
            const isRecent = Math.abs(now - new Date(saved.created_at || saved.$createdAt).getTime()) < 45000;
            const isSameContent = saved.content && existing.content && saved.content.trim() === existing.content.trim();
            const isSameMedia = (saved.fileName && saved.fileName === existing.fileName) || (saved.mediaUrl && saved.mediaUrl === existing.mediaUrl);
            return isSameDir && isRecent && (isSameContent || isSameMedia);
          });

          if (!isAlreadySaved) {
            newMap.set(key, existing);
          }
        }
      }
      messagesMapRef.current = newMap;

      syncMessagesFromMap();
    } catch (err: any) {
      console.error('[useWhatsAppMessagesRealtime] Erro ao carregar mensagens:', err);
      setError(err?.message || 'Falha ao buscar mensagens');
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [phone, limit, syncMessagesFromMap]);

  // Limpa o map ao trocar de telefone
  useEffect(() => {
    messagesMapRef.current.clear();
    setMessages([]);
    fetchMessages();
  }, [phone]);

  // 2. Subscrição Realtime desacoplada e limpa
  useEffect(() => {
    fetchMessages();

    // Canal específico da coleção de mensagens no Appwrite
    const channel = `databases.${DATABASE_ID}.collections.${MESSAGES_COLLECTION_ID}.documents`;

    const unsubscribe = client.subscribe(channel, (response) => {
      const payload = response.payload as MessageDocument;
      if (!payload || !payload.$id) return;

      // Se houver filtro de telefone ativo, descarta eventos de outros números com isSamePhone
      if (phone) {
        const cleanPhone = sanitizeWhatsAppJid(phone);
        if (payload.phone && !isSamePhone(payload.phone, cleanPhone)) return;
      }

      const events = response.events;
      const isCreate = events.some((e) => e.includes('.create'));
      const isUpdate = events.some((e) => e.includes('.update'));
      const isDelete = events.some((e) => e.includes('.delete'));

      if (isDelete) {
        messagesMapRef.current.delete(payload.$id);
        syncMessagesFromMap();
        return;
      }

      if (isCreate || isUpdate) {
        // Remove mensagem otimista correspondente se existir
        for (const [key, existingDoc] of messagesMapRef.current.entries()) {
          if (key.startsWith('temp_')) {
            const isMatch = (payload.content && existingDoc.content === payload.content) ||
                            (payload.fileName && existingDoc.fileName === payload.fileName);
            if (isMatch) {
              messagesMapRef.current.delete(key);
              break;
            }
          }
        }

        // PREVENÇÃO CONTRA DUPLICAÇÃO VISUAL:
        let targetKey = payload.$id;

        if (payload.whatsapp_message_id && !payload.whatsapp_message_id.startsWith('app_')) {
          for (const [key, existingDoc] of messagesMapRef.current.entries()) {
            if (
              existingDoc.whatsapp_message_id === payload.whatsapp_message_id ||
              key === payload.$id
            ) {
              targetKey = key;
              break;
            }
          }
        }

        // Atualiza ou insere atomicamente no Map
        messagesMapRef.current.set(targetKey, {
          ...(messagesMapRef.current.get(targetKey) || {}),
          ...payload,
        });

        syncMessagesFromMap();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [fetchMessages, phone, syncMessagesFromMap]);

  // Função para adicionar mensagem otimista no front-end antes da resposta do servidor
  const addOptimisticMessage = useCallback(
    (optimisticMsg: Partial<MessageDocument> & { $id: string }) => {
      messagesMapRef.current.set(optimisticMsg.$id, optimisticMsg as MessageDocument);
      syncMessagesFromMap();
    },
    [syncMessagesFromMap]
  );

  // Função para remover mensagem temporária otimista após conclusão do envio
  const removeOptimisticMessage = useCallback(
    (tempId: string) => {
      if (messagesMapRef.current.has(tempId)) {
        messagesMapRef.current.delete(tempId);
        syncMessagesFromMap();
      }
    },
    [syncMessagesFromMap]
  );

  return {
    messages,
    loading,
    error,
    refresh: fetchMessages,
    addOptimisticMessage,
    removeOptimisticMessage,
  };
}
