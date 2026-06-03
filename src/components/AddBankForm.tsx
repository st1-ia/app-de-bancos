import React, { useState } from 'react';
import { Bank } from '../types.ts';
import { PlusCircle, Landmark } from 'lucide-react';

interface AddBankFormProps {
  onAddBank: (bank: Omit<Bank, 'id' | 'currentBalance'>) => void;
}

const AVAILABLE_COLORS = [
  { id: 'indigo', label: 'Indigo', bg: 'bg-indigo-600' },
  { id: 'emerald', label: 'Esmeralda', bg: 'bg-emerald-600' },
  { id: 'blue', label: 'Azul', bg: 'bg-blue-600' },
  { id: 'rose', label: 'Rosa Oscuro', bg: 'bg-rose-600' },
  { id: 'amber', label: 'Ambar', bg: 'bg-amber-500' },
  { id: 'violet', label: 'Violeta', bg: 'bg-violet-600' },
  { id: 'dark', label: 'Carbono', bg: 'bg-zinc-800' }
];

export default function AddBankForm({ onAddBank }: AddBankFormProps) {
  const [name, setName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [initialBalanceString, setInitialBalanceString] = useState('');
  const [color, setColor] = useState('indigo');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('El nombre del banco es obligatorio.');
      return;
    }

    const initialBalance = parseFloat(initialBalanceString);
    if (isNaN(initialBalance) || initialBalance < 0) {
      setError('El saldo inicial debe ser un número igual o mayor a 0.');
      return;
    }

    onAddBank({
      name: name.trim(),
      accountNumber: accountNumber.trim() || undefined,
      initialBalance,
      color
    });

    // Reset inputs
    setName('');
    setAccountNumber('');
    setInitialBalanceString('');
    setColor('indigo');
  };

  return (
    <div id="add-bank-form-container" className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400">
          <Landmark className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-bold font-display text-slate-800 dark:text-slate-100">
          Agregar Nuevo Banco
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="text-xs font-semibold p-3 text-red-700 bg-red-50 dark:bg-red-950/30 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            Nombre del Banco *
          </label>
          <input
            id="input-bank-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Galicia, Santander, Mercado Pago"
            className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400 text-slate-900 dark:text-white transition"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Saldo Inicial ($) *
            </label>
            <input
              id="input-bank-balance"
              type="number"
              step="any"
              min="0"
              required
              value={initialBalanceString}
              onChange={(e) => setInitialBalanceString(e.target.value)}
              placeholder="Ej. 150000"
              className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400 text-slate-900 dark:text-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              N° de Cuenta / CBU (Opcional)
            </label>
            <input
              id="input-bank-account"
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Ej. CVU 00000031..."
              className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400 text-slate-900 dark:text-white transition"
            />
          </div>
        </div>

        {/* Color Picker */}
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Diseño / Color del Banco
          </label>
          <div className="flex flex-wrap gap-2.5">
            {AVAILABLE_COLORS.map((item) => (
              <button
                key={item.id}
                id={`btn-color-${item.id}`}
                type="button"
                onClick={() => setColor(item.id)}
                className={`w-7 h-7 rounded-full ${item.bg} relative transition-transform duration-200 focus:outline-none ${
                  color === item.id 
                    ? 'ring-2 ring-offset-2 ring-indigo-600 dark:ring-indigo-400 scale-110 shadow-md' 
                    : 'hover:scale-110 opacity-80 hover:opacity-100'
                }`}
                title={item.label}
              >
                {color === item.id && (
                  <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                    ✓
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <button
          id="submit-add-bank"
          type="submit"
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition duration-200 shadow-md shadow-indigo-100 dark:shadow-none hover:shadow-indigo-200 mt-3 cursor-pointer"
        >
          <PlusCircle className="h-4 w-4" />
          Registrar Banco
        </button>
      </form>
    </div>
  );
}
