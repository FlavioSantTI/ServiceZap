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
  Trash2,
  Square,
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
  clearWhatsAppHistoryAction,
} from '@/app/actions/whatsapp';
import { fetchClientsAction } from '@/app/actions/clients';
import { QuickRepliesModal } from '@/components/whatsapp/quick-replies-modal';
import { LabelsManagerModal } from '@/components/whatsapp/labels-manager-modal';
import { AppointmentModal } from '@/components/agenda/appointment-modal';
import {
  fetchLabelsAction,
  getAllContactsLabelsAction,
} from '@/app/actions/labels';
import { fetchQuickRepliesAction } from '@/app/actions/quick-replies';
import { LabelDocument, QuickReplyDocument } from '@/types/appwrite';
import { useSearchParams } from 'next/navigation';
import { Zap, Tag, Calendar } from 'lucide-react';

interface WhatsAppChatInterfaceProps {
  initialInstance: Partial<WhatsAppInstanceDocument>;
  clients: Partial<ClientDocument>[];
}

export function WhatsAppChatInterface({
  initialInstance,
  clients,
}: WhatsAppChatInterfaceProps) {
  const searchParams = useSearchParams();
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

  // Estados para Gravação de Áudio ao Vivo (Voice Notes / PTT)
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Estados de Rótulos (Labels)
  const [labelsList, setLabelsList] = useState<Partial<LabelDocument>[]>([]);
  const [contactsLabelsMap, setContactsLabelsMap] = useState<Record<string, string[]>>({});
  const [selectedLabelFilter, setSelectedLabelFilter] = useState<string | null>(null);
  const [labelsModalOpen, setLabelsModalOpen] = useState(false);
  const [labelsModalFocusClient, setLabelsModalFocusClient] = useState<Partial<ClientDocument> | null>(null);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);


  // Estados de Mensagens Rápidas (Quick Replies)
  const [quickRepliesOpen, setQuickRepliesOpen] = useState(false);
  const [allQuickReplies, setAllQuickReplies] = useState<Partial<QuickReplyDocument>[]>([]);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<Partial<QuickReplyDocument>[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);

  // Leitura de parâmetros de URL para redirecionamento da proposta comercial / cobrança
  useEffect(() => {
    const textParam = searchParams.get('text');
    const phoneParam = searchParams.get('phone');
    const clientIdParam = searchParams.get('clientId');
    const clientNameParam = searchParams.get('clientName');

    if (textParam) {
      setInputText(textParam);
    }

    if (clientIdParam || phoneParam) {
      const found = clientsList.find(
        (c) =>
          (clientIdParam && c.$id === clientIdParam) ||
          (phoneParam && c.phone && isSamePhone(c.phone, phoneParam))
      );

      if (found) {
        setSelectedClient(found);
      } else if (phoneParam) {
        const newTempClient: Partial<ClientDocument> = {
          $id: clientIdParam || `temp_${phoneParam}`,
          name: clientNameParam || `Cliente (${phoneParam})`,
          phone: phoneParam,
        };
        setSelectedClient(newTempClient);
        setClientsList((prev) => [
          newTempClient,
          ...prev.filter((p) => p.phone && !isSamePhone(p.phone, phoneParam)),
        ]);
      }
    }

    // 1. Verifica anexo pendente em memória global (instantâneo e 100% confiável)
    if (typeof window !== 'undefined' && (window as any).__SERVICEZAP_PENDING_ATTACHMENT__) {
      const pending = (window as any).__SERVICEZAP_PENDING_ATTACHMENT__;
      delete (window as any).__SERVICEZAP_PENDING_ATTACHMENT__;

      setSelectedFile({
        file: pending.file,
        type: pending.type || 'document',
        previewUrl: pending.previewUrl,
      });
      if (pending.caption) {
        setMediaCaption(pending.caption);
      }
    } else if (typeof window !== 'undefined') {
      // 2. Fallback via sessionStorage com decodificação síncrona
      try {
        const stored = sessionStorage.getItem('servicezap_pending_pdf_attachment');
        if (stored) {
          sessionStorage.removeItem('servicezap_pending_pdf_attachment');
          const parsed = JSON.parse(stored);
          if (parsed.dataUrl && parsed.name) {
            const parts = parsed.dataUrl.split(',');
            const mime = parsed.mimeType || 'application/pdf';
            const byteCharacters = atob(parts[1] || parts[0]);
            const byteArrays = new Uint8Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteArrays[i] = byteCharacters.charCodeAt(i);
            }
            const blob = new Blob([byteArrays], { type: mime });
            const file = new File([blob], parsed.name, { type: mime });
            const previewUrl = URL.createObjectURL(blob);

            setSelectedFile({
              file,
              type: parsed.type || 'document',
              previewUrl,
            });
            if (parsed.caption) {
              setMediaCaption(parsed.caption);
            }
          }
        }
      } catch (err) {
        console.warn('Erro ao restaurar anexo do PDF na mensageria:', err);
      }
    }
  }, [searchParams]);

  const loadLabelsAndReplies = async () => {
    try {
      const [labelsRes, mapRes, repliesRes] = await Promise.all([
        fetchLabelsAction(),
        getAllContactsLabelsAction(),
        fetchQuickRepliesAction(),
      ]);

      if (labelsRes.success && labelsRes.data) {
        setLabelsList(labelsRes.data);
      }
      if (mapRes.success && mapRes.data) {
        setContactsLabelsMap(mapRes.data);
      }
      if (repliesRes.success && repliesRes.data) {
        setAllQuickReplies(repliesRes.data);
      }
    } catch (err) {
      console.error('Erro ao carregar rótulos ou mensagens rápidas:', err);
    }
  };

  useEffect(() => {
    loadLabelsAndReplies();
  }, []);

  // Monitorar input para sugestões de atalhos "/"
  useEffect(() => {
    if (inputText.startsWith('/')) {
      const query = inputText.toLowerCase();
      const matched = allQuickReplies.filter(
        (qr) =>
          (qr.shortcut && qr.shortcut.toLowerCase().startsWith(query)) ||
          (qr.title && qr.title.toLowerCase().includes(query.replace('/', '')))
      );
      setAutocompleteSuggestions(matched);
      setSelectedSuggestionIndex(0);
    } else {
      setAutocompleteSuggestions([]);
    }
  }, [inputText, allQuickReplies]);



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

      const response = await fetch('/api/whatsapp/send-media', {
        method: 'POST',
        body: formData,
      });

      const res = await response.json();
      if (!response.ok || !res.success) {
        alert(res.error || 'Falha ao enviar arquivo de mídia.');
      }
      removeOptimisticMessage(tempId);
    } catch (err: any) {
      console.error('Falha ao enviar mídia:', err);
      removeOptimisticMessage(tempId);
      alert(err.message || 'Erro de conexão ao enviar arquivo de mídia.');
    } finally {
      setIsSending(false);
    }
  };

  // Funções do Gravador de Áudio ao Vivo (Voice Notes / PTT)
  const startAudioRecording = async () => {
    if (!activePhone || isSending) return;
    try {
      if (typeof window === 'undefined' || !navigator?.mediaDevices?.getUserMedia) {
        alert('Seu navegador não suporta captura de microfone.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      let mimeType = 'audio/webm;codecs=opus';
      if (typeof MediaRecorder !== 'undefined') {
        if (!MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
            mimeType = 'audio/ogg;codecs=opus';
          } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
            mimeType = 'audio/mp4';
          } else {
            mimeType = '';
          }
        }
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.start(100);
      setIsRecordingAudio(true);
      setRecordingSeconds(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Erro ao acessar microfone:', err);
      alert('Permissão de microfone negada ou nenhum microfone detectado.');
    }
  };

  const cancelAudioRecording = () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    audioChunksRef.current = [];
    setIsRecordingAudio(false);
    setRecordingSeconds(0);
  };

  const stopAndSendAudioRecording = async () => {
    if (!mediaRecorderRef.current || !activePhone || isSending) return;

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    const recorder = mediaRecorderRef.current;

    recorder.onstop = async () => {
      let tempId = '';
      try {
        setIsSending(true);
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/ogg',
        });

        if (audioBlob.size === 0) {
          alert('Nenhum áudio foi capturado.');
          return;
        }

        const ext = recorder.mimeType?.includes('webm')
          ? '.webm'
          : recorder.mimeType?.includes('ogg')
          ? '.ogg'
          : '.m4a';

        const audioFile = new File([audioBlob], `audio_${Date.now()}${ext}`, {
          type: recorder.mimeType || 'audio/ogg',
        });

        const previewUrl = URL.createObjectURL(audioBlob);
        tempId = `temp_audio_${Date.now()}`;

        const optimisticMsg: Partial<MessageDocument> & { $id: string } = {
          $id: tempId,
          $collectionId: 'messages',
          $databaseId: 'servicezap_db',
          $createdAt: new Date().toISOString(),
          $updatedAt: new Date().toISOString(),
          phone: activePhone,
          content: '',
          direction: 'outbound',
          status: 'pending',
          origin: 'app_ui',
          whatsapp_message_id: tempId,
          created_at: new Date().toISOString(),
          mediaType: 'audio',
          mediaUrl: previewUrl,
          mimeType: audioFile.type,
          fileName: audioFile.name,
        };

        addOptimisticMessage(optimisticMsg);

        const formData = new FormData();
        formData.append('phoneNumber', activePhone);
        formData.append('mediaType', 'audio');
        formData.append('caption', '');
        formData.append('file', audioFile);

        const response = await fetch('/api/whatsapp/send-media', {
          method: 'POST',
          body: formData,
        });

        const res = await response.json();
        if (!response.ok || !res.success) {
          alert(res.error || 'Falha ao enviar áudio.');
        }
        if (tempId) removeOptimisticMessage(tempId);
      } catch (err: any) {
        console.error('Erro ao enviar gravação de áudio:', err);
        if (tempId) removeOptimisticMessage(tempId);
        alert(err.message || 'Falha ao enviar áudio.');
      } finally {
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }
        setIsRecordingAudio(false);
        setRecordingSeconds(0);
        setIsSending(false);
      }
    };

    recorder.stop();
  };

  const formatRecordingTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  // Sincroniza props iniciais
  useEffect(() => {
    setClientsList(clients);
    if (!selectedClient && clients.length > 0) {
      setSelectedClient(clients[0]);
    }
  }, [clients]);

  // 1. Carrega e mescla contatos não cadastrados a partir do histórico recente de mensagens via Server Action (Apenas no mount)
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
                  updated.unshift({
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

          // Se nenhum cliente estiver selecionado, seleciona o contato da mensagem mais recente
          setSelectedClient((current) => {
            if (current) return current;
            const latestMsg = recentMsgs[recentMsgs.length - 1];
            if (latestMsg?.phone) {
              const cleanPhone = sanitizeWhatsAppJid(latestMsg.phone);
              const matched = clients.find((c) => isSamePhone(c.phone || '', cleanPhone));
              if (matched) return matched;
              return {
                $id: `auto_${cleanPhone}`,
                name: `Contato WA (${cleanPhone.slice(-8)})`,
                phone: cleanPhone,
                status: 'active',
              };
            }
            return clients.length > 0 ? clients[0] : null;
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
  const { messages, loading: messagesLoading, addOptimisticMessage, removeOptimisticMessage, refresh } = useWhatsAppMessagesRealtime({
    phone: activePhone,
    limit: 60,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
      block: 'nearest',
      inline: 'nearest',
    });
  };

  useEffect(() => {
    scrollToBottom(true);
  }, [messages.length, selectedClient?.$id]);

  const isConnected = status === 'connected';

  // Filtra clientes por nome, telefone e rótulo selecionado
  const filteredClients = clientsList.filter((c) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q));

    if (!matchesSearch) return false;

    if (!selectedLabelFilter) return true;

    const phone = sanitizeWhatsAppJid(c.phone || '');
    const clientLabelIds = contactsLabelsMap[phone] || [];
    return clientLabelIds.includes(selectedLabelFilter);
  });

  // Função unificada para recarregar contatos, conversas e status do tenant ativo
  const reloadContactsAndConversations = async () => {
    try {
      setIsRefreshing(true);

      // 1. Checa o estado da conexão e número do WhatsApp
      const res = await checkWhatsAppConnectionAction();
      setStatus(res.status);
      setInstance((prev) => ({
        ...prev,
        status: res.status,
        phone: res.phone || (res.status === 'disconnected' ? '' : prev.phone),
        instanceName: res.instanceName,
      }));

      // 2. Busca lista atualizada de clientes cadastrados do tenant
      const freshClients = await fetchClientsAction();

      // 3. Busca histórico recente de mensagens do tenant
      const recentMsgs = await getWhatsAppMessagesAction(undefined, 100);

      const updatedList: Partial<ClientDocument>[] = [...freshClients];

      if (recentMsgs && recentMsgs.length > 0) {
        for (const msg of recentMsgs) {
          if (msg.phone) {
            const cleanPhone = sanitizeWhatsAppJid(msg.phone);
            const exists = updatedList.some((c) => isSamePhone(c.phone || '', cleanPhone));
            if (!exists && cleanPhone) {
              updatedList.push({
                $id: `auto_${cleanPhone}`,
                name: `Contato WA (${cleanPhone.slice(-8)})`,
                phone: cleanPhone,
                status: 'active',
                notes: 'Contato detectado nas mensagens do WhatsApp',
              });
            }
          }
        }
      }

      setClientsList(updatedList);

      // Atualiza cliente selecionado se necessário
      setSelectedClient((curr) => {
        if (curr && updatedList.some((c) => (curr.$id && c.$id === curr.$id) || (curr.phone && c.phone && isSamePhone(curr.phone, c.phone)))) {
          return curr;
        }
        return updatedList.length > 0 ? updatedList[0] : null;
      });

      // 4. Força atualização do hook de realtime
      refresh();
    } catch (err) {
      console.warn('Erro ao atualizar contatos e conversas do WhatsApp:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefreshConnection = async () => {
    await reloadContactsAndConversations();
  };

  const handleDisconnect = async () => {
    if (confirm('Deseja realmente desconectar esta sessão do WhatsApp?')) {
      await disconnectWhatsAppAction();
      setStatus('disconnected');
      setInstance((prev) => ({
        ...prev,
        status: 'disconnected',
        phone: '',
      }));
      await reloadContactsAndConversations();
    }
  };

  const handleClearHistory = async () => {
    if (
      confirm(
        'Deseja limpar todo o histórico de mensagens desta sessão/empresa no aplicativo? Esta ação removerá as mensagens locais e sincronizadas no banco de dados.'
      )
    ) {
      setIsRefreshing(true);
      await clearWhatsAppHistoryAction();
      await reloadContactsAndConversations();
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
      removeOptimisticMessage(tempId);
    } catch (err) {
      console.error('Falha ao enviar mensagem:', err);
      removeOptimisticMessage(tempId);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Barra de Status da Instância */}
      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm rounded-2xl overflow-hidden shrink-0">
        <CardContent className="p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500/15 text-[#E8622C] border border-orange-500/20 shrink-0">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  Instância WhatsApp (Motor Embutido)
                </h3>
                <Badge
                  variant="outline"
                  className={
                    isConnected
                      ? 'border-orange-500/30 bg-orange-500/15 text-[#E8622C] text-[10px]'
                      : status === 'connecting'
                      ? 'border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px]'
                      : 'border-rose-500/30 bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[10px]'
                  }
                >
                  <span
                    className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                      isConnected ? 'bg-[#E8622C] animate-pulse' : status === 'connecting' ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                  />
                  {isConnected ? 'Conectado & Ativo' : status === 'connecting' ? 'Aguardando Pareamento' : 'Desconectado'}
                </Badge>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Sessão: <span className="font-medium text-zinc-700 dark:text-zinc-300 font-mono">{instance.instanceName || 'servicezap_main'}</span>
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
              className="h-8 gap-1.5 text-xs rounded-xl border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-[#E8622C]' : ''}`} />
              <span>Verificar</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleClearHistory}
              disabled={isRefreshing}
              title="Limpar histórico de mensagens da sessão/empresa ativa"
              className="h-8 gap-1.5 text-xs rounded-xl border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
            >
              <Trash2 className="h-3.5 w-3.5 text-zinc-500" />
              <span className="hidden sm:inline">Limpar Histórico</span>
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
                className="h-8 gap-2 text-xs font-bold rounded-xl bg-gradient-to-r from-[#F0806B] to-[#E8622C] hover:opacity-95 text-white shadow-md shadow-orange-500/20"
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>Conectar via Código (8 Dígitos)</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2. Layout Principal de Mensageria */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm grid grid-cols-1 lg:grid-cols-12 min-h-[420px] h-[calc(100vh-21rem)]">
        {/* Painel Esquerdo: Lista de Clientes / Conversas (4 colunas) */}
        <div className="lg:col-span-4 border-r border-zinc-200 dark:border-zinc-800 flex flex-col h-full min-h-0 bg-white dark:bg-zinc-900 overflow-hidden">
          {/* Header da lista */}
          <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 space-y-2.5 shrink-0 bg-zinc-50/80 dark:bg-zinc-950/60">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                <span>Conversas</span>
                <span className="text-[11px] bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2 py-0.5 rounded-full font-medium">
                  {filteredClients.length}
                </span>
              </h4>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setLabelsModalFocusClient(null);
                  setLabelsModalOpen(true);
                }}
                className="h-6 px-2 text-[11px] text-zinc-500 hover:text-[#E8622C] dark:hover:text-[#E8622C] gap-1"
                title="Gerenciar Rótulos"
              >
                <Tag className="h-3 w-3 text-[#E8622C]" />
                <span>Rótulos</span>
              </Button>
            </div>

            {/* Input de Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar cliente ou telefone..."
                className="pl-9 h-8 text-xs rounded-xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus-visible:ring-[#E8622C]"
              />
            </div>

            {/* Filtro por Rótulos (Pills horizontais) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-0.5">
              <button
                onClick={() => setSelectedLabelFilter(null)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-all shrink-0 ${
                  selectedLabelFilter === null
                    ? 'bg-[#2B2B2B] text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                    : 'bg-zinc-200/70 hover:bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
                }`}
              >
                Todos
              </button>

              {labelsList.map((lbl) => {
                const lblId = lbl.$id || '';
                const isSelected = selectedLabelFilter === lblId;
                const count = Object.values(contactsLabelsMap).filter((ids) =>
                  ids.includes(lblId)
                ).length;

                return (
                  <button
                    key={lblId || Math.random()}
                    onClick={() =>
                      setSelectedLabelFilter(isSelected ? null : (lbl.$id || null))
                    }
                    style={{
                      backgroundColor: isSelected ? `${lbl.color || '#E8622C'}25` : undefined,
                      borderColor: isSelected ? `${lbl.color || '#E8622C'}80` : undefined,
                      color: isSelected ? lbl.color : undefined,
                    }}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-all shrink-0 flex items-center gap-1 border ${
                      isSelected
                        ? 'font-semibold shadow-xs'
                        : 'bg-zinc-200/60 hover:bg-zinc-200 border-transparent text-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-300'
                    }`}
                  >
                    <span
                      style={{ backgroundColor: lbl.color || '#E8622C' }}
                      className="w-1.5 h-1.5 rounded-full inline-block"
                    />
                    <span>{lbl.name}</span>
                    {count > 0 && (
                      <span className="text-[10px] opacity-75 font-mono">({count})</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lista de Contatos */}
          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60 p-2 space-y-1">
            {filteredClients.length === 0 ? (
              <div className="p-8 text-center text-zinc-400 text-xs">
                Nenhum contato encontrado.
              </div>
            ) : (
              filteredClients.map((client) => {
                const isSelected = selectedClient?.$id === client.$id;
                const clientPhone = sanitizeWhatsAppJid(client.phone || '');
                const clientLabelIds = contactsLabelsMap[clientPhone] || [];
                const clientLabels = labelsList.filter((l) => l.$id && clientLabelIds.includes(l.$id));

                return (
                  <button
                    key={client.$id}
                    onClick={() => setSelectedClient(client)}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'bg-orange-500/10 border border-orange-500/30 text-zinc-900 dark:text-zinc-100 shadow-sm'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 border border-transparent'
                    }`}
                  >
                    <div
                      className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 transition-colors ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#F0806B] to-[#E8622C] text-white shadow-sm shadow-orange-500/30'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      {client.name ? client.name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs truncate text-zinc-900 dark:text-zinc-100">
                          {client.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate flex items-center gap-1 mt-0.5">
                        <Phone className="h-3 w-3 text-zinc-400" />
                        <span>{client.phone}</span>
                      </p>

                      {/* Badges de rótulo no card */}
                      {clientLabels.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap mt-1.5">
                          {clientLabels.map((lbl) => (
                            <span
                              key={lbl.$id}
                              style={{
                                backgroundColor: `${lbl.color}18`,
                                color: lbl.color,
                                borderColor: `${lbl.color}40`,
                              }}
                              className="px-1.5 py-0.5 rounded text-[10px] font-medium border leading-none flex items-center gap-1"
                            >
                              <span
                                style={{ backgroundColor: lbl.color }}
                                className="w-1 h-1 rounded-full inline-block"
                              />
                              {lbl.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Painel Direito: Janela de Chat em Tempo Real (8 colunas) */}
        <div className="lg:col-span-8 flex flex-col h-full min-h-0 bg-zinc-50/40 dark:bg-zinc-950/40 overflow-hidden">
          {selectedClient ? (
            <>
              {/* Header do Chat */}
              <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-orange-500/15 text-[#E8622C] border border-orange-500/25 flex items-center justify-center font-bold text-sm shrink-0">
                    {selectedClient.name ? selectedClient.name.charAt(0).toUpperCase() : 'C'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{selectedClient.name}</h4>
                      {/* Rótulos do Cliente Ativo no Header */}
                      {(() => {
                        const clientPhone = sanitizeWhatsAppJid(selectedClient.phone || '');
                        const clientLabelIds = contactsLabelsMap[clientPhone] || [];
                        const clientLabels = labelsList.filter((l) => l.$id && clientLabelIds.includes(l.$id));

                        return (
                          <div className="flex items-center gap-1">
                            {clientLabels.map((lbl) => (
                              <span
                                key={lbl.$id}
                                style={{
                                  backgroundColor: `${lbl.color}18`,
                                  color: lbl.color,
                                  borderColor: `${lbl.color}40`,
                                }}
                                className="px-2 py-0.5 rounded text-[10px] font-medium border leading-none"
                              >
                                {lbl.name}
                              </span>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                      <span>{selectedClient.phone}</span>
                      {selectedClient.document && (
                        <span className="text-zinc-400">• Doc: {selectedClient.document}</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAppointmentModalOpen(true)}
                    className="h-8 gap-1.5 text-xs rounded-xl border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                  >
                    <Calendar className="h-3.5 w-3.5 text-[#E8622C]" />
                    <span>Agendar</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setLabelsModalFocusClient(selectedClient);
                      setLabelsModalOpen(true);
                    }}
                    className="h-8 gap-1.5 text-xs rounded-xl border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                  >
                    <Tag className="h-3.5 w-3.5 text-[#E8622C]" />
                    <span>Etiquetar</span>
                  </Button>

                  <Badge variant="outline" className="border-orange-500/30 bg-orange-500/10 text-[#E8622C] text-[10px] gap-1">
                    <ShieldCheck className="h-3 w-3 text-[#E8622C]" />
                    <span>Realtime Ativo</span>
                  </Badge>
                </div>
              </div>

              {/* Área de Mensagens */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
                {messagesLoading && messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-400 space-y-2">
                    <RefreshCw className="h-5 w-5 animate-spin text-[#E8622C]" />
                    <span className="text-xs">Carregando histórico do WhatsApp...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-400 space-y-2 text-center p-6">
                    <MessageSquare className="h-9 w-9 text-zinc-300 dark:text-zinc-700" />
                    <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Nenhuma mensagem nesta conversa ainda</p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-sm">
                      Envie uma mensagem abaixo ou responda pelo próprio WhatsApp no celular. Todas as ações sincronizam automaticamente.
                    </p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, idx) => {
                      const isOutbound = msg?.direction === 'outbound';
                      const isNative = msg?.origin === 'whatsapp_native';

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

                      if (activeMediaUrl && !activeMediaType) {
                        const clean = activeMediaUrl.toLowerCase();
                        if (clean.match(/\.(jpe?g|png|webp|gif)($|\?)/)) {
                          activeMediaType = 'image';
                        } else if (clean.match(/\.(ogg|mp3|m4a|wav|aac|opus)($|\?)/)) {
                          activeMediaType = 'audio';
                        } else if (clean.match(/\.(mp4|mov|3gp)($|\?)/)) {
                          activeMediaType = 'video';
                        } else if (clean.match(/\.(webm)($|\?)/)) {
                          activeMediaType = msg.mimeType?.startsWith('audio/') ? 'audio' : 'video';
                        } else if (clean.match(/\.(pdf|docx?|xlsx?|txt|zip)($|\?)/)) {
                          activeMediaType = 'document';
                        } else if (msg.mimeType?.startsWith('image/')) {
                          activeMediaType = 'image';
                        } else if (msg.mimeType?.startsWith('video/')) {
                          activeMediaType = 'video';
                        } else if (msg.mimeType?.startsWith('audio/')) {
                          activeMediaType = 'audio';
                        } else {
                          activeMediaType = 'document';
                        }
                      }

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
                                ? 'bg-gradient-to-r from-[#F0806B] to-[#E8622C] text-white rounded-tr-none shadow-orange-500/15'
                                : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tl-none border border-zinc-200 dark:border-zinc-700/60'
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
                                    <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                      <Mic className="h-3.5 w-3.5 text-white" />
                                    </div>
                                    <audio
                                      src={activeMediaUrl}
                                      controls
                                      preload="metadata"
                                      className="w-44 sm:w-52 h-7 text-xs"
                                    />
                                  </div>
                                )}

                                {activeMediaType === 'document' && (
                                  <div className="flex items-center gap-2.5 p-2 rounded-xl bg-black/10 dark:bg-white/10 border border-black/10">
                                    <div className="h-8 w-8 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center shrink-0">
                                      <FileText className="h-4 w-4 text-zinc-700 dark:text-zinc-200" />
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
                                      className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors shrink-0"
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
                                isOutbound ? 'text-white/80' : 'text-zinc-400 dark:text-zinc-500'
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
              <form onSubmit={handleSendMessage} className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-2 shrink-0 relative">
                {/* Popup de Autocomplete ao Digitar "/" */}
                {autocompleteSuggestions.length > 0 && (
                  <div className="absolute bottom-full left-3 right-3 mb-2 z-40 bg-zinc-900/95 border border-zinc-700/80 rounded-2xl shadow-2xl p-2 space-y-1 backdrop-blur-md max-h-56 overflow-y-auto animate-in fade-in slide-in-from-bottom-2">
                    <div className="px-2 py-1 text-[11px] font-semibold text-zinc-400 flex items-center justify-between border-b border-zinc-800">
                      <span className="flex items-center gap-1.5 text-[#E8622C]">
                        <Zap className="w-3.5 h-3.5" />
                        Mensagens Rápidas sugeridas
                      </span>
                      <span className="text-[10px] text-zinc-500">Pressione Enter ou clique para usar</span>
                    </div>
                    {autocompleteSuggestions.map((sug, idx) => (
                      <div
                        key={sug.$id}
                        onClick={() => {
                          setInputText(sug.content || '');
                          setAutocompleteSuggestions([]);
                        }}

                        className={`p-2 rounded-xl cursor-pointer flex items-center justify-between gap-2 text-xs transition-colors ${
                          idx === selectedSuggestionIndex
                            ? 'bg-orange-500/20 text-[#E8622C] border border-orange-500/30'
                            : 'hover:bg-zinc-800 text-zinc-200 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-orange-500/20 text-[#E8622C] text-[11px]">
                            {sug.shortcut}
                          </span>
                          <span className="font-medium text-zinc-200 truncate">{sug.title}</span>
                          <span className="text-zinc-500 text-[11px] truncate max-w-xs">{sug.content}</span>
                        </div>
                        {sug.category && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 shrink-0">
                            {sug.category}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Botão de Mensagens Rápidas (Atalhos) */}
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => setQuickRepliesOpen(true)}
                  className="h-10 w-10 rounded-xl text-[#E8622C] hover:text-[#E8622C] hover:bg-orange-500/10 dark:hover:bg-orange-500/20 transition-colors shrink-0"
                  title="Mensagens Rápidas (/)"
                >
                  <Zap className="h-5 w-5" />
                </Button>

                {/* Menu de Anexos */}
                <div className="relative">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => setAttachmentMenuOpen(!attachmentMenuOpen)}
                    className="h-10 w-10 rounded-xl text-zinc-500 hover:text-[#E8622C] hover:bg-orange-50 dark:hover:bg-zinc-800 transition-colors shrink-0"
                    title="Anexar arquivo"
                  >
                    <Paperclip className="h-5 w-5" />
                  </Button>

                  {/* Popover de Seleção de Anexo */}
                  {attachmentMenuOpen && (
                    <div className="absolute bottom-12 left-0 z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl p-2 w-52 space-y-1 animate-in fade-in slide-in-from-bottom-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (fileInputRef.current) {
                            fileInputRef.current.accept = 'image/*,video/*';
                            fileInputRef.current.click();
                          }
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 transition-colors font-medium"
                      >
                        <div className="h-7 w-7 rounded-lg bg-orange-500/15 text-[#E8622C] flex items-center justify-center shrink-0">
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
                        className="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 transition-colors font-medium"
                      >
                        <div className="h-7 w-7 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
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
                        className="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 transition-colors font-medium"
                      >
                        <div className="h-7 w-7 rounded-lg bg-stone-500/15 text-stone-700 dark:text-stone-300 flex items-center justify-center shrink-0">
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

                {isRecordingAudio ? (
                  <div className="flex-1 flex items-center justify-between bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 rounded-xl px-3.5 py-1.5 text-xs animate-in fade-in duration-200">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                      </span>
                      <span className="font-semibold text-red-600 dark:text-red-400 text-xs">Gravando áudio</span>
                      <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200 ml-1 text-xs">
                        {formatRecordingTime(recordingSeconds)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={cancelAudioRecording}
                        className="h-8 px-2.5 rounded-lg text-red-600 hover:bg-red-500/20 text-xs gap-1"
                        title="Descartar gravação"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Descartar</span>
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        onClick={stopAndSendAudioRecording}
                        disabled={isSending}
                        className="h-8 px-3 rounded-lg bg-gradient-to-r from-[#F0806B] to-[#E8622C] hover:opacity-95 text-white font-bold text-xs gap-1 shadow-sm"
                        title="Enviar nota de voz"
                      >
                        {isSending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        <span>Enviar</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Input
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => {
                        if (autocompleteSuggestions.length > 0) {
                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setSelectedSuggestionIndex((prev) =>
                              (prev + 1) % autocompleteSuggestions.length
                            );
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setSelectedSuggestionIndex((prev) =>
                              (prev - 1 + autocompleteSuggestions.length) % autocompleteSuggestions.length
                            );
                          } else if (e.key === 'Enter' || e.key === 'Tab') {
                            e.preventDefault();
                            const chosen = autocompleteSuggestions[selectedSuggestionIndex];
                            if (chosen) {
                              setInputText(chosen.content || '');
                              setAutocompleteSuggestions([]);
                            }
                          } else if (e.key === 'Escape') {
                            setAutocompleteSuggestions([]);
                          }
                        }
                      }}
                      placeholder={`Mensagem para ${selectedClient.name || 'cliente'} (digite / para atalhos)...`}
                      className="flex-1 h-10 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus-visible:ring-[#E8622C]"
                    />

                    {inputText.trim() ? (
                      <Button
                        type="submit"
                        disabled={isSending}
                        className="h-10 px-4 rounded-xl bg-gradient-to-r from-[#F0806B] to-[#E8622C] hover:opacity-95 text-white font-bold shadow-md shadow-orange-500/20 text-xs gap-1.5 shrink-0"
                      >
                        {isSending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        <span className="hidden sm:inline">Enviar</span>
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={startAudioRecording}
                        disabled={isSending}
                        className="h-10 px-3.5 rounded-xl bg-zinc-100 hover:bg-orange-50 text-zinc-700 hover:text-[#E8622C] dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 font-semibold text-xs gap-1.5 shrink-0 border border-zinc-200 dark:border-zinc-700 transition-colors"
                        title="Gravar áudio de voz"
                      >
                        <Mic className="h-4 w-4 text-[#E8622C]" />
                        <span className="hidden sm:inline">Gravar</span>
                      </Button>
                    )}
                  </>
                )}
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400 space-y-2">
              <User className="h-10 w-10 text-zinc-300 dark:text-zinc-700" />
              <p className="text-xs">Selecione um contato na lista lateral para abrir o chat.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Pré-visualização de Mídia (antes de enviar) */}
      {selectedFile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden space-y-4 p-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-[#E8622C]" />
                <span>Enviar {selectedFile.type === 'image' ? 'Imagem' : selectedFile.type === 'video' ? 'Vídeo' : selectedFile.type === 'audio' ? 'Áudio' : 'Documento'}</span>
              </h3>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setSelectedFile(null)}
                className="h-8 w-8 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Container de Preview */}
            <div className="flex items-center justify-center bg-zinc-100 dark:bg-zinc-950 rounded-2xl p-4 min-h-[160px] max-h-72 overflow-hidden border border-zinc-200 dark:border-zinc-800">
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
                <div className="flex items-center gap-3 text-left w-full p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <FileText className="h-8 w-8 text-[#E8622C] shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs truncate text-zinc-900 dark:text-zinc-100">{selectedFile.file.name}</p>
                    <p className="text-[11px] text-zinc-400">{(selectedFile.file.size / 1024).toFixed(1)} KB</p>
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
                className="h-10 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus-visible:ring-[#E8622C]"
              />
            </div>

            {/* Ações */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedFile(null)}
                className="h-9 text-xs rounded-xl border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSendMedia}
                disabled={isSending}
                className="h-9 px-5 text-xs font-bold rounded-xl bg-gradient-to-r from-[#F0806B] to-[#E8622C] hover:opacity-95 text-white shadow-md shadow-orange-500/20 gap-1.5"
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

      {/* Modal de Gerenciamento e Seleção de Mensagens Rápidas */}
      <QuickRepliesModal
        isOpen={quickRepliesOpen}
        onClose={() => setQuickRepliesOpen(false)}
        onSelectReply={(content) => {
          setInputText(content);
        }}
        onSendDirectly={async (content) => {
          if (!activePhone || isSending) return;
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
            content,
            direction: 'outbound',
            status: 'pending',
            origin: 'app_ui',
            whatsapp_message_id: tempId,
            created_at: new Date().toISOString(),
          };
          addOptimisticMessage(optimisticMsg);
          try {
            await sendWhatsAppMessageDirectAction(activePhone, content);
            removeOptimisticMessage(tempId);
          } catch (err) {
            removeOptimisticMessage(tempId);
          } finally {
            setIsSending(false);
          }
        }}
      />

      {/* Modal de Gerenciamento e Seleção de Rótulos / Etiquetas */}
      <LabelsManagerModal
        isOpen={labelsModalOpen}
        onClose={() => {
          setLabelsModalOpen(false);
          setLabelsModalFocusClient(null);
        }}
        contactPhone={labelsModalFocusClient?.phone ? sanitizeWhatsAppJid(labelsModalFocusClient.phone) : null}
        contactName={labelsModalFocusClient?.name || null}
        onLabelsUpdated={loadLabelsAndReplies}
      />

      {/* Modal de Agendamento Rápido no Chat */}
      <AppointmentModal
        isOpen={appointmentModalOpen}
        onClose={() => setAppointmentModalOpen(false)}
        initialClient={selectedClient}
        initialDate={new Date().toISOString().split("T")[0]}
        clientsList={clientsList}
        onSuccess={(newApt) => {
          setAppointmentModalOpen(false);
        }}
      />
    </div>
  );
}

