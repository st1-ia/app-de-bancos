import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Bank } from '../types.ts';
import { formatCurrency, BANK_COLOR_THEMES } from '../utils.ts';
import { Landmark, TrendingUp, AlertTriangle, Trash2 } from 'lucide-react';

interface BankCardProps {
  key?: React.Key;
  bank: Bank;
  onDelete?: (id: string) => void;
  onSelect?: (id: string) => void;
  isSelected?: boolean;
}

export default function BankCard({ bank, onDelete, onSelect, isSelected = false }: BankCardProps) {
  const theme = BANK_COLOR_THEMES[bank.color] || BANK_COLOR_THEMES.indigo;
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={() => {
        if (!showConfirm) {
          onSelect?.(bank.id);
        }
      }}
      id={`bank-card-${bank.id}`}
      className={`relative overflow-hidden rounded-2xl p-6 shadow-md transition-all duration-300 cursor-pointer border ${
        isSelected 
          ? 'ring-4 ring-offset-2 ring-indigo-650 dark:ring-indigo-400 border-transparent shadow-xl' 
          : 'border-slate-205/30 dark:border-slate-800 shadow-sm'
      } bg-gradient-to-br ${theme.bgGradient} ${theme.glow}`}
    >
      {/* Custom overlay confirm dialogue inside card - bypass iframe context blocked alert/confirms */}
      {showConfirm && (
        <div 
          onClick={(e) => e.stopPropagation()} 
          className="absolute inset-0 bg-slate-950/95 flex flex-col justify-center items-center p-4 text-center z-10"
        >
          <AlertTriangle className="h-6 w-6 text-rose-500 mb-1.5" />
          <h4 className="text-white text-xs font-bold uppercase tracking-wider">¿Eliminar {bank.name}?</h4>
          <p className="text-[10px] text-slate-400 mt-1 mb-3.5 leading-normal px-2">
            Se borrarán permanentemente sus transacciones y saldos.
          </p>
          <div className="flex gap-2 w-full max-w-xs justify-center">
            <button
              onClick={() => setShowConfirm(false)}
              className="px-3.5 py-1.5 bg-slate-800 text-slate-300 hover:bg-slate-700 text-[11px] font-bold rounded-lg cursor-pointer transition hover:text-white"
            >
              Cancelar
            </button>
            <button
              id={`confirm-delete-bank-btn-${bank.id}`}
              onClick={() => {
                onDelete?.(bank.id);
                setShowConfirm(false);
              }}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg cursor-pointer transition"
            >
              Confirmar
            </button>
          </div>
        </div>
      )}

      {/* Decorative Card Features */}
      <div className="absolute right-0 top-0 -mr-6 -mt-6 h-28 w-28 rounded-full bg-white/5 blur-xl pointer-events-none" />
      <div className="absolute right-12 bottom-0 -mb-8 h-20 w-20 rounded-full bg-white/5 blur-lg pointer-events-none" />

      <div className="relative flex flex-col justify-between h-full min-h-[140px]">
        {/* Card Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-white/10 p-2 text-white">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-bold tracking-tight text-lg text-white">
                {bank.name}
              </h3>
              {bank.accountNumber && (
                <p className={`text-[11px] ${theme.textColor} font-mono tracking-wider mt-0.5`}>
                  N° {bank.accountNumber}
                </p>
              )}
            </div>
          </div>

          {onDelete && (
            <button
              id={`delete-bank-btn-${bank.id}`}
              onClick={(e) => {
                e.stopPropagation();
                setShowConfirm(true);
              }}
              className="rounded-lg p-2 text-white/40 hover:text-white hover:bg-white/10 transition-colors duration-200"
              title="Eliminar banco"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Card Body & Balance */}
        <div className="mt-6">
          <p className={`text-[10px] ${theme.textColor} uppercase tracking-wider font-bold`}>
            Saldo Actual
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold font-display tracking-tight text-white">
              {formatCurrency(bank.currentBalance)}
            </span>
          </div>
        </div>

        {/* Bottom Details */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10 text-xs">
          <div className="flex items-center gap-1.5 text-white/75">
            <span className="opacity-70 font-sans">Saldo Inicial:</span>
            <span className="font-semibold font-mono">{formatCurrency(bank.initialBalance)}</span>
          </div>
          
          <div className="flex items-center gap-1">
            {bank.currentBalance < 0 ? (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-200 font-medium">
                <AlertTriangle className="h-3 w-3" />
                Negativo
              </span>
            ) : bank.currentBalance > bank.initialBalance ? (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 font-medium">
                <TrendingUp className="h-3 w-3" />
                Superávit
              </span>
            ) : (
              <span className="opacity-70 px-2 py-0.5 rounded-full bg-white/10 text-white font-medium">
                Estable
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
