'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import {
  MessageSquare,
  Send,
  Search,
  KeyRound,
  RefreshCw,
  PowerOff,
  User,
  Phone,
  Check,
  CheckCheck,
  Clock,
  Smartphone,
  ShieldCheck,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Mic,
  X,
  Download,
  Plus,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ClientDocument, MessageDocument, WhatsAppInstanceDocument, WhatsAppStatus } from '@/types/appwrite';
import { useWhatsAppMessagesRealtime } from '@/hooks/useWhatsAppMessagesRealtime';
import { PairingCodeDialog } from '@/components/whatsapp/pairing-code-dialog';
import { sanitizeWhatsAppJid, isSamePhone } from '@/lib/utils/whatsappUtils';
import { client } from '@/lib/appwrite/client';
import {
  sendWhatsAppMessageDirectAction,
  sendWhatsAppMediaDirectAction,
  disconnectWhatsAppAction,
  checkWhatsAppConnectionAction,
  getWhatsAppMessagesAction,
} from '@/app/actions/whatsapp';

interface WhatsAppChatInterfaceProps {
  initialInstance: Partial<WhatsAppInstanceDocument>;
  clients: Partial<ClientDocument>[];
}

export function WhatsAppChatInterface({
  initialInstance,
  clients,
}: WhatsAppChatInterfaceProps) {
  const [instance, setInstance] = useState(initialInstance);
  const [status, setStatus] = useState<WhatsAppStatus>(initialInstance.status || 'connected');
  const [pairingOpen, setPairingOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [clientsList, setClientsList] = useState<Partial<ClientDocument>[]>(clients);
  const [selectedClient, setSelectedClient] = useState<Partial<ClientDocument> | null>(
    clients.length > 0 ? clients[0] : null
  );
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Estados do Menu de Anexos e Pré-visualização de Mídias
  const [attachmentMenuOpen, setAttachmentMenuOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{
    file: File;
    type: 'image' | 'video' | 'audio' | 'document';
    previewUrl: string;
  } | null>(null);
  const [mediaCaption, setMediaCaption] = useState('');
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    overrideType?: 'image' | 'video' | 'audio' | 'document'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let fileType: 'image' | 'video' | 'audio' | 'document' = overrideType || 'document';
    if (!overrideType) {
      if (file.type.startsWith('image/')) fileType = 'image';
      else if (file.type.startsWith('video/')) fileType = 'video';
      else if (file.type.startsWith('audio/')) fileType = 'audio';
    }

    const previewUrl = URL.createObjectURL(file);
    setSelectedFile({ file, type: fileType, previewUrl });
    setAttachmentMenuOpen(false);
    e.target.value = '';
  };

  const handleSendMedia = async () => {
    if (!selectedFile || !activePhone || isSending) return;

    setIsSending(true);
    const { file, type, previewUrl } = selectedFile;
    const caption = mediaCaption.trim();

    setSelectedFile(null);
    setMediaCaption('');

    const tempId = `temp_media_${Date.now()}`;
    const optimisticMsg: Partial<MessageDocument> & { $id: string } = {
      $id: tempId,
      $collectionId: 'messages',
      $databaseId: 'servicezap_db',
      $createdAt: new Date().toISOString(),
      $updatedAt: new Date().toISOString(),
      phone: activePhone,
      content: caption,
      direction: 'outbound',
      status: 'pending',
      origin: 'app_ui',
      whatsapp_message_id: tempId,
      created_at: new Date().toISOString(),
      mediaType: type,
      mediaUrl: previewUrl,
      mimeType: file.type,
      fileName: file.name,
    };

    addOptimisticMessage(optimisticMsg);

    try {
      const formData = new FormData();
      formData.append('phoneNumber', activePhone);
      formData.append('mediaType', type);
      formData.append('caption', caption);
      formData.append('file', file);

      await sendWhatsAppMediaDirectAction(formData);
    } catch (err) {
      console.error('Falha ao enviar mídia:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Sincroniza props iniciais
  useEffect(() => {
    setClientsList(clients);
  }, [clients]);

  // 1. Carrega e mescla contatos não cadastrados a partir do histórico recente de mensagens via Server Action
  useEffect(() => {
    async function loadRecentMessageContacts() {
      try {
        const recentMsgs = await getWhatsAppMessagesAction(undefined, 100);
        if (recentMsgs && recentMsgs.length > 0) {
          setClientsList((prev) => {
            const updated = [...prev];
            for (const msg of recentMsgs) {
              if (msg.phone) {
                const cleanPhone = sanitizeWhatsAppJid(msg.phone);
                const exists = updated.some(
                  (c) => isSamePhone(c.phone || '', cleanPhone)
                );
                if (!exists && cleanPhone) {
                  updated.push({
                    $id: `auto_${cleanPhone}`,
                    name: `Contato WA (${cleanPhone.slice(-8)})`,
                    phone: cleanPhone,
                    status: 'active',
                    notes: 'Contato detectado nas mensagens do WhatsApp',
                  });
                }
              }
            }
            return updated;
          });
        }
      } catch (err) {
        console.warn('Erro ao carregar contatos de mensagens recentes:', err);
      }
    }

    loadRecentMessageContacts();
  }, []);

  // 2. Subscrição Realtime de novos clientes (coleção de clientes no Appwrite)
  useEffect(() => {
    const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'servicezap_db';
    const COLLECTION_CLIENTS = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_CLIENTS || 'clients';
    const channel = `databases.${DATABASE_ID}.collections.${COLLECTION_CLIENTS}.documents`;

    const unsubscribe = client.subscribe(channel, (response) => {
      const payload = response.payload as Partial<ClientDocument>;
      if (!payload || !payload.$id) return;

      const events = response.events;
      const isCreate = events.some((e) => e.includes('.create'));
      const isUpdate = events.some((e) => e.includes('.update'));

      if (isCreate || isUpdate) {
        setClientsList((prev) => {
          const exists = prev.some(
            (c) => c.$id === payload.$id || isSamePhone(c.phone || '', payload.phone || '')
          );
          if (exists) {
            return prev.map((c) =>
              c.$id === payload.$id || isSamePhone(c.phone || '', payload.phone || '')
                ? { ...c, ...payload }
                : c
            );
          }
          return [payload, ...prev];
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // 3. Subscrição Realtime global de mensagens para adiantar a inserção de números não cadastrados na barra lateral
  useEffect(() => {
    const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'servicezap_db';
    const MESSAGES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID || 'messages';
    const channel = `databases.${DATABASE_ID}.collections.${MESSAGES_COLLECTION_ID}.documents`;

    const unsubscribe = client.subscribe(channel, (response) => {
      const payload = response.payload as Partial<MessageDocument>;
      if (!payload || !payload.phone) return;

      const cleanPhone = sanitizeWhatsAppJid(payload.phone);
      if (!cleanPhone) return;

      setClientsList((prev) => {
        const exists = prev.some((c) => isSamePhone(c.phone || '', cleanPhone));
        if (!exists) {
          return [
            {
              $id: `auto_${cleanPhone}`,
              name: `Contato WA (${cleanPhone.slice(-8)})`,
              phone: cleanPhone,
              status: 'active',
              notes: 'Contato detectado em tempo real',
            },
            ...prev,
          ];
        }
        return prev;
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Limpeza e normalização do telefone do contato ativo (garantindo DDI 55)
  const activePhone = selectedClient?.phone ? sanitizeWhatsAppJid(selectedClient.phone) : '';

  // Subscrição em tempo real das mensagens com de-duplicação automática
  const { messages, loading: messagesLoading, addOptimisticMessage, refresh } = useWhatsAppMessagesRealtime({
    phone: activePhone,
    limit: 60,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    scrollToBottom(true);
  }, [messages.length, selectedClient?.$id]);

  const isConnected = status === 'connected';

  // Filtra clientes por nome ou telefone a partir da lista dinâmica
  const filteredClients = clientsList.filter((c) => {
    const q = searchTerm.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q))
    );
  });

  const handleRefreshConnection = async () => {
    try {
      setIsRefreshing(true);
      const res = await checkWhatsAppConnectionAction();
      setStatus(res.status);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDisconnect = async () => {
    if (confirm('Deseja realmente desconectar esta sessão do WhatsApp?')) {
      await disconnectWhatsAppAction();
      setStatus('disconnected');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activePhone || isSending) return;

    const messageText = inputText.trim();
    setInputText('');
    setIsSending(true);

    const tempId = `temp_${Date.now()}`;
    const optimisticMsg: Partial<MessageDocument> & { $id: string } = {
      $id: tempId,
      $collectionId: 'messages',
      $databaseId: 'servicezap_db',
      $createdAt: new Date().toISOString(),
      $updatedAt: new Date().toISOString(),
      phone: activePhone,
      content: messageText,
      direction: 'outbound',
      status: 'pending',
      origin: 'app_ui',
      whatsapp_message_id: tempId,
      created_at: new Date().toISOString(),
    };

    // 1. Renderiza imediatamente no estado da conversa
    addOptimisticMessage(optimisticMsg);

    try {
      // 2. Dispara envio síncrono para o motor embutido e atualiza Appwrite
      await sendWhatsAppMessageDirectAction(activePhone, messageText);
    } catch (err) {
      console.error('Falha ao enviar mensagem:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Barra de Status da Instância */}
      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-2xl overflow-hidden shrink-0">
        <CardContent className="p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Instância WhatsApp (Motor Embutido)
                </h3>
                <Badge
                  variant="outline"
                  className={
                    isConnected
                      ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px]'
                      : status === 'connecting'
                      ? 'border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px]'
                      : 'border-rose-500/30 bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[10px]'
                  }
                >
                  <span
                    className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                      isConnected ? 'bg-emerald-500 animate-pulse' : status === 'connecting' ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                  />
                  {isConnected ? 'Conectado & Ativo' : status === 'connecting' ? 'Aguardando Pareamento' : 'Desconectado'}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Sessão: <span className="font-medium text-slate-700 dark:text-slate-300 font-mono">{instance.instanceName || 'servicezap_main'}</span>
                {instance.phone ? ` • Tel: ${instance.phone}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefreshConnection}
              disabled={isRefreshing}
              className="h-8 gap-1.5 text-xs rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
              <span>Verificar</span>
            </Button>

            {isConnected ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleDisconnect}
                className="h-8 gap-1.5 text-xs rounded-xl border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60"
              >
                <PowerOff className="h-3.5 w-3.5" />
                <span>Desconectar</span>
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => setPairingOpen(true)}
                className="h-8 gap-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20"
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>Conectar via Código (8 Dígitos)</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2. Layout Principal de Mensageria */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm grid grid-cols-1 lg:grid-cols-12 min-h-[420px] h-[calc(100vh-21rem)]">
        {/* Painel Esquerdo: Lista de Clientes / Conversas (4 colunas) */}
        <div className="lg:col-span-4 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full min-h-0 bg-white dark:bg-slate-900 overflow-hidden">
          {/* Header da lista */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2 shrink-0 bg-slate-50/80 dark:bg-slate-950/60">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <span>Conversas</span>
                <span className="text-[11px] bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-medium">
                  {filteredClients.length}
                </span>
              </h4>
            </div>

            {/* Input de Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar cliente ou telefone..."
                className="pl-9 h-8 text-xs rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Lista de Contatos */}
          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2 space-y-1">
            {filteredClients.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Nenhum contato encontrado.
              </div>
            ) : (
              filteredClients.map((client) => {
                const isSelected = selectedClient?.$id === client.$id;
                return (
                  <button
                    key={client.$id}
                    onClick={() => setSelectedClient(client)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-slate-900 dark:text-slate-100 shadow-sm'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-transparent'
                    }`}
                  >
                    <div
                      className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {client.name ? client.name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs truncate text-slate-900 dark:text-slate-100">
                          {client.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5">
                        <Phone className="h-3 w-3 text-slate-400" />
                        <span>{client.phone}</span>
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Painel Direito: Janela de Chat em Tempo Real (8 colunas) */}
        <div className="lg:col-span-8 flex flex-col h-full min-h-0 bg-slate-50/40 dark:bg-slate-950/40 overflow-hidden">
          {selectedClient ? (
            <>
              {/* Header do Chat */}
              <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 flex items-center justify-center font-bold text-sm shrink-0">
                    {selectedClient.name ? selectedClient.name.charAt(0).toUpperCase() : 'C'}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{selectedClient.name}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <span>{selectedClient.phone}</span>
                      {selectedClient.document && (
                        <span className="text-slate-400">• Doc: {selectedClient.document}</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] gap-1">
                    <ShieldCheck className="h-3 w-3 text-emerald-500" />
                    <span>Realtime Ativo</span>
                  </Badge>
                </div>
              </div>

              {/* Área de Mensagens */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
                {messagesLoading && messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
                    <RefreshCw className="h-5 w-5 animate-spin text-emerald-600" />
                    <span className="text-xs">Carregando histórico do WhatsApp...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2 text-center p-6">
                    <MessageSquare className="h-9 w-9 text-slate-300 dark:text-slate-700" />
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nenhuma mensagem nesta conversa ainda</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm">
                      Envie uma mensagem abaixo ou responda pelo próprio WhatsApp no celular. Todas as ações sincronizam automaticamente.
                    </p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, idx) => {
                      const isOutbound = msg?.direction === 'outbound';
                      const isNative = msg?.origin === 'whatsapp_native';

                      // Formatação ultranativa e segura de horário para evitar exceções de renderização
                      let formattedTime = '';
                      const rawDateStr = msg?.created_at || msg?.$createdAt;
                      if (rawDateStr) {
                        try {
                          const parsedDate = new Date(rawDateStr);
                          if (!isNaN(parsedDate.getTime())) {
                            formattedTime = parsedDate.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            });
                          }
                        } catch {
                          formattedTime = '';
                        }
                      }

                      let activeMediaType = msg.mediaType;
                      let activeMediaUrl = msg.mediaUrl;

                      // Fallback resiliente para ler mídias com tag no texto se mediaUrl não veio do Appwrite
                      if (!activeMediaUrl && msg.content && msg.content.includes('/api/media/')) {
                        const match = msg.content.match(/(\/api\/media\/[^\s\n]+)/);
                        if (match) {
                          activeMediaUrl = match[1];
                        }
                        if (msg.content.includes('[Mídia: image]')) activeMediaType = 'image';
                        else if (msg.content.includes('[Mídia: video]')) activeMediaType = 'video';
                        else if (msg.content.includes('[Mídia: audio]')) activeMediaType = 'audio';
                        else if (msg.content.includes('[Mídia: document]')) activeMediaType = 'document';
                      }

                      // Limpa a tag de fallback do texto visível ([Mídia: type] /api/media/... ou [Mídia: type])
                      let textContent = msg?.content
                        ? msg.content
                            .replace(/\[Mídia: [^\]]+\](\s*\/api\/media\/[^\s\n]+)?/g, '')
                            .trim()
                        : '';

                      if (!textContent && !activeMediaUrl) {
                        if (msg.content?.includes('[Mídia: audio]')) {
                          textContent = '🎵 (Áudio de voz do WhatsApp)';
                        } else if (msg.content?.includes('[Mídia: image]')) {
                          textContent = '📷 (Imagem do WhatsApp)';
                        } else if (msg.content?.includes('[Mídia: video]')) {
                          textContent = '🎥 (Vídeo do WhatsApp)';
                        } else if (msg.content?.includes('[Mídia: document]')) {
                          textContent = '📄 (Documento do WhatsApp)';
                        } else {
                          textContent = '📷 (Mensagem de mídia/áudio ou figurinha)';
                        }
                      }

                      const safeKey = msg?.$id || msg?.whatsapp_message_id || `msg_${idx}`;

                      return (
                        <div
                          key={safeKey}
                          className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-[82%] sm:max-w-[70%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm transition-all ${
                              isOutbound
                                ? 'bg-emerald-600 text-white rounded-tr-none shadow-emerald-600/10'
                                : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-700/60'
                            }`}
                          >
                            {/* Renderização de Mídia */}
                            {activeMediaUrl && (
                              <div className="mb-2">
                                {activeMediaType === 'image' && (
                                  <div className="relative group cursor-pointer overflow-hidden rounded-xl border border-black/10">
                                    <img
                                      src={activeMediaUrl}
                                      alt={textContent || 'Imagem WhatsApp'}
                                      onClick={() => setLightboxUrl(activeMediaUrl!)}
                                      className="max-h-60 max-w-full object-cover rounded-xl hover:opacity-95 transition-opacity"
                                    />
                                  </div>
                                )}

                                {activeMediaType === 'video' && (
                                  <div className="rounded-xl overflow-hidden border border-black/10">
                                    <video
                                      src={activeMediaUrl}
                                      controls
                                      className="max-h-60 max-w-full rounded-xl"
                                    />
                                  </div>
                                )}

                                {activeMediaType === 'audio' && (
                                  <div className="flex items-center gap-2 p-1.5 rounded-xl bg-black/10 dark:bg-white/10 border border-black/10">
                                    <div className="h-7 w-7 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                      <Mic className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-300" />
                                    </div>
                                    <audio
                                      src={activeMediaUrl}
                                      controls
                                      className="w-44 sm:w-52 h-7 text-xs"
                                    />
                                  </div>
                                )}

                                {activeMediaType === 'document' && (
                                  <div className="flex items-center gap-2.5 p-2 rounded-xl bg-black/10 dark:bg-white/10 border border-black/10">
                                    <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                                      <FileText className="h-4 w-4 text-slate-700 dark:text-slate-200" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-semibold text-xs truncate">{msg.fileName || 'Documento'}</p>
                                      <p className="text-[10px] opacity-75 truncate">{msg.mimeType || 'Arquivo'}</p>
                                    </div>
                                    <a
                                      href={activeMediaUrl}
                                      download={msg.fileName || 'documento'}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-600 dark:text-emerald-300 transition-colors shrink-0"
                                      title="Baixar arquivo"
                                    >
                                      <Download className="h-3.5 w-3.5" />
                                    </a>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Texto / Legenda */}
                            {textContent && (
                              <p className="whitespace-pre-wrap break-words leading-relaxed">{textContent}</p>
                            )}

                            <div
                              className={`flex items-center justify-end gap-1.5 mt-1 text-[10px] ${
                                isOutbound ? 'text-emerald-100/80' : 'text-slate-400 dark:text-slate-500'
                              }`}
                            >
                              {/* Origem */}
                              {isOutbound && (
                                <span className="flex items-center gap-0.5">
                                  {isNative ? (
                                    <span className="flex items-center gap-0.5">
                                      <Smartphone className="h-2.5 w-2.5" /> celular •
                                    </span>
                                  ) : (
                                    <span>painel •</span>
                                  )}
                                </span>
                              )}

                              {/* Hora */}
                              {formattedTime && <span>{formattedTime}</span>}

                              {/* Status de Envio */}
                              {isOutbound && (
                                <span className="ml-0.5">
                                  {msg?.status === 'pending' && <Clock className="h-3 w-3 inline text-amber-200 animate-spin" />}
                                  {msg?.status === 'sent' && <Check className="h-3 w-3 inline text-white" />}
                                  {(msg?.status === 'delivered' || msg?.status === 'received') && <CheckCheck className="h-3 w-3 inline text-white" />}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Formulário de Envio (Estilo WhatsApp Web) */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2 shrink-0 relative">
                {/* Menu de Anexos */}
                <div className="relative">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => setAttachmentMenuOpen(!attachmentMenuOpen)}
                    className="h-10 w-10 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors shrink-0"
                    title="Anexar arquivo"
                  >
                    <Paperclip className="h-5 w-5" />
                  </Button>

                  {/* Popover de Seleção de Anexo */}
                  {attachmentMenuOpen && (
                    <div className="absolute bottom-12 left-0 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 w-52 space-y-1 animate-in fade-in slide-in-from-bottom-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (fileInputRef.current) {
                            fileInputRef.current.accept = 'image/*,video/*';
                            fileInputRef.current.click();
                          }
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors font-medium"
                      >
                        <div className="h-7 w-7 rounded-lg bg-purple-500/15 text-purple-600 flex items-center justify-center shrink-0">
                          <ImageIcon className="h-4 w-4" />
                        </div>
                        <span>Fotos & Vídeos</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (fileInputRef.current) {
                            fileInputRef.current.accept = 'audio/*';
                            fileInputRef.current.click();
                          }
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors font-medium"
                      >
                        <div className="h-7 w-7 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                          <Mic className="h-4 w-4" />
                        </div>
                        <span>Áudio / Voz</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (fileInputRef.current) {
                            fileInputRef.current.accept = '*/*';
                            fileInputRef.current.click();
                          }
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors font-medium"
                      >
                        <div className="h-7 w-7 rounded-lg bg-blue-500/15 text-blue-600 flex items-center justify-center shrink-0">
                          <FileText className="h-4 w-4" />
                        </div>
                        <span>Documento</span>
                      </button>
                    </div>
                  )}

                  {/* Input HTML oculto */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Mensagem para ${selectedClient.name || 'cliente'}...`}
                  className="flex-1 h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus-visible:ring-emerald-500"
                />

                <Button
                  type="submit"
                  disabled={isSending || !inputText.trim()}
                  className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-600/20 text-xs gap-1.5 shrink-0"
                >
                  {isSending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">Enviar</span>
                </Button>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
              <User className="h-10 w-10 text-slate-300 dark:text-slate-700" />
              <p className="text-xs">Selecione um contato na lista lateral para abrir o chat.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Pré-visualização de Mídia (antes de enviar) */}
      {selectedFile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden space-y-4 p-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-emerald-600" />
                <span>Enviar {selectedFile.type === 'image' ? 'Imagem' : selectedFile.type === 'video' ? 'Vídeo' : selectedFile.type === 'audio' ? 'Áudio' : 'Documento'}</span>
              </h3>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setSelectedFile(null)}
                className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Container de Preview */}
            <div className="flex items-center justify-center bg-slate-100 dark:bg-slate-950 rounded-2xl p-4 min-h-[160px] max-h-72 overflow-hidden border border-slate-200 dark:border-slate-800">
              {selectedFile.type === 'image' && (
                <img src={selectedFile.previewUrl} alt="Preview" className="max-h-64 object-contain rounded-xl" />
              )}
              {selectedFile.type === 'video' && (
                <video src={selectedFile.previewUrl} controls className="max-h-64 rounded-xl" />
              )}
              {selectedFile.type === 'audio' && (
                <audio src={selectedFile.previewUrl} controls className="w-full" />
              )}
              {selectedFile.type === 'document' && (
                <div className="flex items-center gap-3 text-left w-full p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <FileText className="h-8 w-8 text-emerald-600 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs truncate text-slate-900 dark:text-slate-100">{selectedFile.file.name}</p>
                    <p className="text-[11px] text-slate-400">{(selectedFile.file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
              )}
            </div>

            {/* Input de Legenda opcional */}
            <div className="space-y-1">
              <Input
                value={mediaCaption}
                onChange={(e) => setMediaCaption(e.target.value)}
                placeholder="Adicionar legenda (opcional)..."
                className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* Ações */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedFile(null)}
                className="h-9 text-xs rounded-xl border-slate-200 dark:border-slate-800"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSendMedia}
                disabled={isSending}
                className="h-9 px-5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 gap-1.5"
              >
                {isSending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                <span>Enviar Mídia</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay Lightbox de Imagem Ampliada */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setLightboxUrl(null)}>
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setLightboxUrl(null)}
              className="absolute -top-10 right-0 text-white hover:bg-white/20 rounded-full"
            >
              <X className="h-6 w-6" />
            </Button>
            <img src={lightboxUrl} alt="Imagem Ampliada" className="max-h-[85vh] max-w-full rounded-2xl shadow-2xl object-contain" />
          </div>
        </div>
      )}

      <PairingCodeDialog
        open={pairingOpen}
        onOpenChange={setPairingOpen}
        onConnected={handleRefreshConnection}
      />
    </div>
  );
}
