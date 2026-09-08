"use client";

import React, { useState, useEffect } from "react";
import { LabelDocument } from "@/types/appwrite";
import {
  fetchLabelsAction,
  createLabelAction,
  updateLabelAction,
  deleteLabelAction,
  updateContactLabelsAction,
  getContactLabelsAction,
} from "@/app/actions/labels";
import {
  Tag,
  Plus,
  Trash2,
  Edit2,
  X,
  Check,
  Palette,
  Sparkles,
  Layers,
} from "lucide-react";

interface LabelsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactPhone?: string | null;
  contactName?: string | null;
  onLabelsUpdated?: () => void;
}

const PRESET_COLORS = [
  "#E8622C", // Warm Orange
  "#F0806B", // Coral
  "#D97706", // Amber
  "#E11D48", // Rose Red
  "#059669", // Sage Green
  "#0D9488", // Teal
  "#B45309", // Warm Ochre
  "#78716C", // Warm Stone
  "#2B2B2B", // Charcoal
  "#64748B", // Slate
];

export const LabelsManagerModal: React.FC<LabelsManagerModalProps> = ({
  isOpen,
  onClose,
  contactPhone,
  contactName,
  onLabelsUpdated,
}) => {
  const [labels, setLabels] = useState<Partial<LabelDocument>[]>([]);
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);


  // Form states (create / edit label)
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState<string>("");
  const [color, setColor] = useState<string>("#E8622C");
  const [description, setDescription] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, contactPhone]);

  const loadData = async () => {
    setLoading(true);
    const labelsRes = await fetchLabelsAction();
    if (labelsRes.success && labelsRes.data) {
      setLabels(labelsRes.data);
    }

    if (contactPhone) {
      const contactLabelsRes = await getContactLabelsAction(contactPhone);
      if (contactLabelsRes.success) {
        setSelectedLabelIds(contactLabelsRes.data);
      }
    }
    setLoading(false);
  };

  const handleToggleContactLabel = async (labelId: string) => {
    if (!contactPhone) return;

    let updated: string[];
    if (selectedLabelIds.includes(labelId)) {
      updated = selectedLabelIds.filter((id) => id !== labelId);
    } else {
      updated = [...selectedLabelIds, labelId];
    }
    setSelectedLabelIds(updated);

    await updateContactLabelsAction(contactPhone, updated);
    if (onLabelsUpdated) {
      onLabelsUpdated();
    }
  };

  const handleStartCreate = () => {
    setEditingId(null);
    setName("");
    setColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
    setDescription("");
    setIsEditing(true);
  };

  const handleStartEdit = (label: Partial<LabelDocument>) => {
    if (!label.$id) return;
    setEditingId(label.$id);
    setName(label.name || "");
    setColor(label.color || "#E8622C");
    setDescription(label.description || "");
    setIsEditing(true);
  };


  const handleSaveLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    if (editingId) {
      const res = await updateLabelAction(editingId, { name, color, description });
      if (res.success && res.data) {
        setLabels((prev) =>
          prev.map((item) => (item.$id === editingId ? res.data! : item))
        );
        setIsEditing(false);
      }
    } else {
      const res = await createLabelAction({ name, color, description });
      if (res.success && res.data) {
        setLabels((prev) => [...prev, res.data!]);
        setIsEditing(false);
      }
    }
    setSaving(false);
    if (onLabelsUpdated) onLabelsUpdated();
  };

  const handleDeleteLabel = async (id: string) => {
    if (!confirm("Excluir este rótulo? Ele será removido de todos os contatos vinculados.")) return;

    const res = await deleteLabelAction(id);
    if (res.success) {
      setLabels((prev) => prev.filter((item) => item.$id !== id));
      setSelectedLabelIds((prev) => prev.filter((item) => item !== id));
      if (editingId === id) setIsEditing(false);
      if (onLabelsUpdated) onLabelsUpdated();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500/15 text-[#E8622C] border border-orange-500/20">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-100 text-base flex items-center gap-2">
                Gerenciar Rótulos
                {contactPhone && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/15 text-[#E8622C] border border-orange-500/20 font-normal">
                    {contactName || contactPhone}
                  </span>
                )}
              </h3>
              <p className="text-xs text-zinc-400">
                {contactPhone
                  ? "Selecione os rótulos para etiquetar este cliente"
                  : "Organize seus contatos com etiquetas coloridas personalizadas"}
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
                Novo Rótulo
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

        {/* Edit / Create Form */}
        {isEditing ? (
          <form onSubmit={handleSaveLabel} className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h4 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                <Palette className="w-4 h-4 text-[#E8622C]" />
                {editingId ? "Editar Rótulo" : "Criar Novo Rótulo"}
              </h4>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-xs text-zinc-400 hover:text-zinc-200"
              >
                Voltar
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Nome do Rótulo
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Novo Lead, Proposta Enviada, VIP"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700/60 rounded-xl text-zinc-100 text-sm focus:outline-none focus:border-[#E8622C] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-2">
                Cor da Etiqueta
              </label>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center ${
                      color === c ? "scale-110 ring-2 ring-white" : "opacity-80 hover:opacity-100"
                    }`}
                  >
                    {color === c && <Check className="w-4 h-4 text-white drop-shadow" />}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#6366f1"
                  className="flex-1 px-3 py-1.5 bg-zinc-800/80 border border-zinc-700/60 rounded-xl text-zinc-100 text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Descrição (opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: Clientes que solicitaram orçamento esta semana"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700/60 rounded-xl text-zinc-100 text-sm focus:outline-none focus:border-[#E8622C] transition-colors"
              />
            </div>

            {/* Preview */}
            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 flex items-center justify-between">
              <span className="text-xs text-zinc-400">Prévia visual:</span>
              <span
                style={{
                  backgroundColor: `${color}18`,
                  color: color,
                  borderColor: `${color}40`,
                }}
                className="px-2.5 py-1 rounded-md text-xs font-medium border flex items-center gap-1.5"
              >
                <span
                  style={{ backgroundColor: color }}
                  className="w-2 h-2 rounded-full inline-block"
                />
                {name || "Nome do Rótulo"}
              </span>
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
                {saving ? "Salvando..." : editingId ? "Atualizar Rótulo" : "Salvar Rótulo"}
              </button>
            </div>
          </form>
        ) : (
          /* Labels List View */
          <div className="flex-1 overflow-y-auto p-5 space-y-2">
            {loading ? (
              <div className="py-12 text-center text-zinc-500 text-xs animate-pulse">
                Carregando rótulos...
              </div>
            ) : labels.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-10 h-10 mx-auto rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500">
                  <Tag className="w-5 h-5" />
                </div>
                <p className="text-zinc-400 text-xs">Nenhum rótulo cadastrado ainda.</p>
                <button
                  onClick={handleStartCreate}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Criar primeiro rótulo
                </button>
              </div>
            ) : (
              labels.map((label) => {
                const labelId = label.$id || "";
                const isChecked = labelId ? selectedLabelIds.includes(labelId) : false;
                return (
                  <div
                    key={labelId || Math.random()}
                    onClick={() => {
                      if (contactPhone && labelId) {
                        handleToggleContactLabel(labelId);
                      }
                    }}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      contactPhone
                        ? isChecked
                          ? "bg-orange-500/10 border-orange-500/40 cursor-pointer shadow-sm"
                          : "bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-800/40 cursor-pointer"
                        : "bg-zinc-900/40 border-zinc-800/80"
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {contactPhone && (
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                            isChecked
                              ? "bg-[#E8622C] border-[#E8622C] text-white"
                              : "border-zinc-700 bg-zinc-800/80"
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5" />}
                        </div>
                      )}

                      <span
                        style={{
                          backgroundColor: `${label.color || "#E8622C"}18`,
                          color: label.color || "#E8622C",
                          borderColor: `${label.color || "#E8622C"}40`,
                        }}
                        className="px-2.5 py-1 rounded-md text-xs font-semibold border flex items-center gap-1.5 whitespace-nowrap shadow-xs"
                      >
                        <span
                          style={{ backgroundColor: label.color || "#E8622C" }}
                          className="w-2 h-2 rounded-full inline-block"
                        />
                        {label.name}
                      </span>

                      {label.description && (
                        <span className="text-xs text-zinc-400 truncate">
                          {label.description}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        title="Editar rótulo"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit(label);
                        }}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        title="Excluir rótulo"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (labelId) handleDeleteLabel(labelId);
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
        )}

        {/* Footer info */}
        <div className="px-6 py-3 bg-zinc-950/60 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
          <span>
            {contactPhone
              ? "Clique para marcar ou desmarcar rótulos para este contato"
              : "Rótulos organizam seus atendimentos e permitem filtragem rápida"}
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition-colors"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
