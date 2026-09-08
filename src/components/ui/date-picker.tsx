'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DatePreset {
  label: string;
  daysOffset: number; // 0 = hoje, 1 = amanhã, 7 = +7d, etc.
}

interface DatePickerProps {
  value?: string; // Formato YYYY-MM-DD
  onChange: (isoDate: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  required?: boolean;
  presets?: DatePreset[];
  showShortcuts?: boolean;
}

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const WEEK_DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

/**
 * Converte YYYY-MM-DD para DD/MM/AAAA
 */
function isoToPtBr(isoStr?: string): string {
  if (!isoStr || !/^\d{4}-\d{2}-\d{2}$/.test(isoStr)) return '';
  const [year, month, day] = isoStr.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * Converte DD/MM/AAAA para YYYY-MM-DD (se válido)
 */
function ptBrToIso(ptBrStr: string): string | null {
  const clean = ptBrStr.replace(/\D/g, '');
  if (clean.length !== 8) return null;

  const day = parseInt(clean.substring(0, 2), 10);
  const month = parseInt(clean.substring(2, 4), 10);
  const year = parseInt(clean.substring(4, 8), 10);

  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  if (year < 1900 || year > 2100) return null;

  // Valida dia de acordo com o mês/ano
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day > daysInMonth) return null;

  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${year}-${pad(month)}-${pad(day)}`;
}

/**
 * Formata digitação livre adicionando barras automaticamente
 */
function formatMask(inputVal: string): string {
  const digits = inputVal.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}

export function DatePicker({
  value = '',
  onChange,
  placeholder = 'DD/MM/AAAA',
  disabled = false,
  className,
  id,
  name,
  required,
  presets,
  showShortcuts = false,
}: DatePickerProps) {
  const [displayValue, setDisplayValue] = useState<string>(isoToPtBr(value));
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date();
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Sincroniza se o valor externo mudar
  useEffect(() => {
    setDisplayValue(isoToPtBr(value));
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-').map(Number);
      setCurrentMonth(new Date(y, m - 1, d));
    }
  }, [value]);

  // Fecha o popup ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Edição direta via Teclado
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const formatted = formatMask(rawVal);
    setDisplayValue(formatted);

    const iso = ptBrToIso(formatted);
    if (iso) {
      onChange(iso);
      const [y, m, d] = iso.split('-').map(Number);
      setCurrentMonth(new Date(y, m - 1, d));
    } else if (formatted === '') {
      onChange('');
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDisplayValue('');
    onChange('');
  };

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleSelectDay = (dayNum: number) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    const pad = (n: number) => n.toString().padStart(2, '0');
    const iso = `${year}-${pad(month)}-${pad(dayNum)}`;

    setDisplayValue(isoToPtBr(iso));
    onChange(iso);
    setIsOpen(false);
  };

  const handleApplyPreset = (daysOffset: number) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysOffset);
    const iso = targetDate.toISOString().split('T')[0];

    setDisplayValue(isoToPtBr(iso));
    onChange(iso);
    setCurrentMonth(targetDate);
    setIsOpen(false);
  };

  // Renderização dos dias do calendário
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();

  const daysArray: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    daysArray.push(null);
  }
  for (let i = 1; i <= daysInCurrentMonth; i++) {
    daysArray.push(i);
  }

  // Verifica hoje e selecionado
  const today = new Date();
  const isToday = (dayNum: number) =>
    today.getDate() === dayNum &&
    today.getMonth() === month &&
    today.getFullYear() === year;

  const isSelected = (dayNum: number) => {
    if (!value) return false;
    const [selY, selM, selD] = value.split('-').map(Number);
    return selY === year && selM === month + 1 && selD === dayNum;
  };

  const defaultPresets: DatePreset[] = presets || [
    { label: 'Hoje', daysOffset: 0 },
    { label: 'Amanhã', daysOffset: 1 },
    { label: '+7 dias', daysOffset: 7 },
    { label: '+15 dias', daysOffset: 15 },
    { label: '+30 dias', daysOffset: 30 },
  ];

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <input
          id={id}
          name={name}
          type="text"
          inputMode="numeric"
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          value={displayValue}
          onChange={handleInputChange}
          className={cn(
            'w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[#2B2B2B] dark:text-[#FAF6F2] rounded-xl h-9 pl-3 pr-16 text-xs font-mono focus:outline-none focus:border-[#E8622C] focus:ring-1 focus:ring-[#E8622C] transition-colors disabled:opacity-50',
            className
          )}
        />

        <div className="absolute right-1.5 flex items-center gap-1">
          {displayValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors rounded-md"
              title="Limpar data"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            disabled={disabled}
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 text-neutral-400 hover:text-[#E8622C] dark:hover:text-[#F0806B] transition-colors rounded-lg hover:bg-orange-50 dark:hover:bg-neutral-800"
            title="Abrir calendário"
          >
            <CalendarIcon className="w-4 h-4 text-[#E8622C]" />
          </button>
        </div>
      </div>

      {/* Popover do Calendário */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-warm-md w-[260px] text-[#2B2B2B] dark:text-[#FAF6F2] animate-in fade-in zoom-in-95 duration-100">
          {/* Navegação Mês/Ano */}
          <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-bold text-[#2B2B2B] dark:text-[#FAF6F2]">
              {MONTH_NAMES[month]} {year}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Dias da Semana */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {WEEK_DAYS.map((wd, i) => (
              <span key={i} className="text-[10px] font-bold text-neutral-400">
                {wd}
              </span>
            ))}
          </div>

          {/* Grid de Dias */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {daysArray.map((dayNum, idx) => {
              if (dayNum === null) {
                return <div key={`empty_${idx}`} className="h-6 w-6" />;
              }

              const selected = isSelected(dayNum);
              const currentDay = isToday(dayNum);

              return (
                <button
                  key={`day_${dayNum}`}
                  type="button"
                  onClick={() => handleSelectDay(dayNum)}
                  className={cn(
                    'h-6 w-6 mx-auto rounded-lg text-[11px] font-semibold flex items-center justify-center transition-all',
                    selected
                      ? 'bg-gradient-to-r from-[#F0806B] to-[#E8622C] text-white font-bold shadow-md shadow-orange-500/30'
                      : currentDay
                      ? 'bg-orange-500/20 text-[#E8622C] border border-orange-500/40 font-bold'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-orange-50 dark:hover:bg-neutral-800 hover:text-[#E8622C]'
                  )}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          {/* Atalhos Rápidos no Popover */}
          <div className="mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap gap-1">
            {defaultPresets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleApplyPreset(preset.daysOffset)}
                className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#FAF6F2] dark:bg-neutral-800 hover:bg-orange-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Atalhos Rápidos Externos (Opcional) */}
      {showShortcuts && (
        <div className="flex items-center gap-1.5 pt-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[10px] text-neutral-400">Atalhos:</span>
          {defaultPresets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => handleApplyPreset(preset.daysOffset)}
              className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 hover:bg-orange-50 text-neutral-600 dark:text-neutral-300 font-medium transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
