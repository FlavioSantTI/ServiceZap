"use client";

import React, { useState, useEffect } from "react";
import { QuickReplyDocument } from "@/types/appwrite";
import {
  fetchQuickRepliesAction,
  createQuickReplyAction,
  updateQuickReplyAction,
  deleteQuickReplyAction,
} from "@/app/actions/quick-replies";
import {
  Zap,
  Search,
  Plus,
  Trash2,
  Edit2,
  X,
  Check,
  Folder,
  Send,
  Sparkles,
  Command,
} from "lucide-react";

interface QuickRepliesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectReply: (content: string) => void;
  onSendDirectly?: (content: string) => void;
}

export const QuickRepliesModal: React.FC<QuickRepliesModalProps> = ({
  isOpen,
  onClose,
  onSelectReply,
  onSendDirectly,
}) => {
  const [replies, setReplies] = useState<Partial<QuickReplyDocument>[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");


  // Form states (create / edit)
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    shortcut: "",
    category: "Geral",
    content: "",
  });
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      loadReplies();
    }
  }, [isOpen]);

  const loadReplies = async () => {
    setLoading(true);
    const res = await fetchQuickRepliesAction();
    if (res.success && res.data) {
      setReplies(res.data);
    }
    setLoading(false);
  };

  const handleStartCreate = () => {
    setEditingId(null);
    setFormData({
      title: "",
      shortcut: "/",
      category: "Geral",
      content: "",
    });
    setIsEditing(true);
  };

  const handleStartEdit = (reply: Partial<QuickReplyDocument>) => {
    if (!reply.$id) return;
    setEditingId(reply.$id);
    setFormData({
      title: reply.title || "",
      shortcut: reply.shortcut || "",
      category: reply.category || "Geral",
      content: reply.content || "",
    });
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.shortcut.trim() || !formData.content.trim()) {
      return;
    }

    setSaving(true);
    if (editingId) {
      const res = await updateQuickReplyAction(editingId, formData);
      if (res.success && res.data) {
        setReplies((prev) =>
          prev.map((item) => (item.$id === editingId ? res.data! : item))
        );
        setIsEditing(false);
      }
    } else {
      const res = await createQuickReplyAction(formData);
      if (res.success && res.data) {
        setReplies((prev) => [res.data!, ...prev]);
        setIsEditing(false);
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Tem certeza que deseja excluir esta resposta rápida?")) return;

    const res = await deleteQuickReplyAction(id);
    if (res.success) {
      setReplies((prev) => prev.filter((item) => item.$id !== id));
      if (editingId === id) setIsEditing(false);
    }
  };

  if (!isOpen) return null;

  // Categories extraction
  const categories = ["all", ...Array.from(new Set(replies.map((r) => r.category || "Geral")))];

  // Filtered replies
  const filteredReplies = replies.filter((reply) => {
    const matchesSearch =
      (reply.title && reply.title.toLowerCase().includes(search.toLowerCase())) ||
      (reply.shortcut && reply.shortcut.toLowerCase().includes(search.toLowerCase())) ||
      (reply.content && reply.content.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      selectedCategory === "all" || (reply.category || "Geral") === selectedCategory;

    return matchesSearch && matchesCategory;
  });


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500/15 text-[#E8622C] border border-orange-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-100 text-lg flex items-center gap-2">
                Mensagens Rápidas
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-normal">
                  {replies.length}
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Atalhos rápidos para agilizar seu atendimento no WhatsApp
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={handleStartCreate}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#F0806B] to-[#E8622C] hover:opacity-95 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-500/20"
              >
                <Plus className="w-4 h-4" />
                Novo Atalho
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Modal View */}
        {isEditing ? (
          <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h4 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#E8622C]" />
                {editingId ? "Editar Mensagem Rápida" : "Criar Nova Mensagem Rápida"}
              </h4>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-xs text-zinc-400 hover:text-zinc-200"
              >
                Voltar à lista
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Título identificador
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Saudação Inicial, Chave PIX"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700/60 rounded-xl text-zinc-100 text-sm focus:outline-none focus:border-[#E8622C] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Atalho de acionamento (inicia com /)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-zinc-400 text-sm font-mono">/</span>
                  <input
                    type="text"
                    required
                    placeholder="ola"
                    value={formData.shortcut.replace(/^\//, "")}
                    onChange={(e) =>
                      setFormData({ ...formData, shortcut: `/${e.target.value.trim().toLowerCase()}` })
                    }
                    className="w-full pl-7 pr-3 py-2 bg-zinc-800/80 border border-zinc-700/60 rounded-xl text-zinc-100 text-sm focus:outline-none focus:border-[#E8622C] transition-colors font-mono"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Categoria
              </label>
              <input
                type="text"
                placeholder="Ex: Geral, Vendas, Financeiro, Suporte"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700/60 rounded-xl text-zinc-100 text-sm focus:outline-none focus:border-[#E8622C] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Conteúdo da mensagem
              </label>
              <textarea
                required
                rows={4}
                placeholder="Digite a mensagem completa que será inserida no chat..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700/60 rounded-xl text-zinc-100 text-sm focus:outline-none focus:border-[#E8622C] transition-colors resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#F0806B] to-[#E8622C] hover:opacity-95 text-white text-xs font-bold transition-all shadow-md shadow-orange-500/20 disabled:opacity-50"
              >
                {saving ? "Salvando..." : editingId ? "Salvar Alterações" : "Criar Atalho"}
              </button>
            </div>
          </form>
        ) : (
          /* List View */
          <div className="flex flex-col flex-1 min-h-0">
            {/* Search & Categories */}
            <div className="p-4 border-b border-zinc-800/70 space-y-3 bg-zinc-900/30">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Pesquisar por título, atalho (/ola) ou texto..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-zinc-800/70 border border-zinc-700/60 rounded-xl text-zinc-200 text-xs focus:outline-none focus:border-[#E8622C] transition-colors placeholder:text-zinc-500"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === cat
                        ? "bg-orange-500/20 text-[#E8622C] border border-orange-500/30"
                        : "bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent"
                    }`}
                  >
                    {cat === "all" ? "Todas as Categorias" : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Replies List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-zinc-800/40">
              {loading ? (
                <div className="py-12 text-center text-zinc-500 text-xs animate-pulse">
                  Carregando atalhos rápidos...
                </div>
              ) : filteredReplies.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-10 h-10 mx-auto rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500">
                    <Zap className="w-5 h-5" />
                  </div>
                  <p className="text-zinc-400 text-xs">Nenhuma resposta rápida encontrada.</p>
                  <button
                    onClick={handleStartCreate}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Criar primeiro atalho
                  </button>
                </div>
              ) : (
                filteredReplies.map((reply) => {
                  const replyId = reply.$id || "";
                  const content = reply.content || "";
                  return (
                    <div
                      key={replyId || Math.random()}
                      onClick={() => {
                        onSelectReply(content);
                        onClose();
                      }}
                      className="group pt-2.5 first:pt-0 cursor-pointer p-3 rounded-xl hover:bg-zinc-800/50 border border-transparent hover:border-zinc-700/50 transition-all flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-orange-500/15 text-[#E8622C] border border-orange-500/20">
                            {reply.shortcut}
                          </span>
                          <h4 className="text-xs font-semibold text-zinc-200 truncate">
                            {reply.title}
                          </h4>
                          {reply.category && (
                            <span className="text-[10px] text-zinc-500 px-1.5 py-0.5 rounded bg-zinc-800/80">
                              {reply.category}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                          {content}
                        </p>
                      </div>

                      {/* Actions on hover */}
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        {onSendDirectly && (
                          <button
                            title="Enviar imediatamente"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSendDirectly(content);
                              onClose();
                            }}
                            className="p-1.5 rounded-lg bg-orange-500/15 text-[#E8622C] hover:bg-[#E8622C] hover:text-white transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          title="Editar atalho"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(reply);
                          }}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          title="Excluir atalho"
                          onClick={(e) => {
                            if (replyId) handleDelete(replyId, e);
                          }}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer tip */}
            <div className="px-6 py-3 bg-zinc-950/60 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px]">
                  /
                </kbd>
                Dica: Digite barra no chat para acionar atalhos sem abrir esta janela
              </span>
              <span>Clique no card para inserir no campo de texto</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
