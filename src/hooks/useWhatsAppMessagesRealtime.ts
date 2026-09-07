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
  limit = 50,
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

  // 1. Carga inicial de mensagens via Server Action (com fallback para SDK REST)
  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
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

      // Popula o map preservando mensagens optimistas pendentes
      const newMap = new Map<string, MessageDocument>();
      for (const doc of docs) {
        if (doc && doc.$id) {
          newMap.set(doc.$id, doc);
        }
      }
      for (const [key, existing] of messagesMapRef.current.entries()) {
        if (key.startsWith('temp_') && !newMap.has(key)) {
          newMap.set(key, existing);
        }
      }
      messagesMapRef.current = newMap;

      syncMessagesFromMap();
    } catch (err: any) {
      console.error('[useWhatsAppMessagesRealtime] Erro ao carregar mensagens:', err);
      setError(err?.message || 'Falha ao buscar mensagens');
    } finally {
      setLoading(false);
    }
  }, [phone, limit, syncMessagesFromMap]);

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
        // PREVENÇÃO CONTRA DUPLICAÇÃO VISUAL:
        // Verifica se já existe um documento com o mesmo $id OU com o mesmo whatsapp_message_id
        let targetKey = payload.$id;

        if (payload.whatsapp_message_id) {
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

    // Cleanup obrigatório para evitar memory leaks
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

  return {
    messages,
    loading,
    error,
    refresh: fetchMessages,
    addOptimisticMessage,
  };
}
