import React, { useState, useEffect } from 'react';
import { Bank, Transfer } from '../types.ts';
import { ArrowRightLeft, ArrowRight, Wallet } from 'lucide-react';
import { formatCurrency } from '../utils.ts';

interface TransferFormProps {
  banks: Bank[];
  onAddTransfer: (transfer: Omit<Transfer, 'id'>) => void;
  selectedBankId?: string;
}

export default function TransferForm({ banks, onAddTransfer, selectedBankId }: TransferFormProps) {
  const [fromBankId, setFromBankId] = useState('');
  const [toBankId, setToBankId] = useState('');
  const [amountString, setAmountString] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Setup initial values or respond to selected bankcard
  useEffect(() => {
    if (banks.length >= 2) {
      if (selectedBankId) {
        setFromBankId(selectedBankId);
        // Find first different bank for destination
        const diffBank = banks.find(b => b.id !== selectedBankId);
        if (diffBank) {
          setToBankId(diffBank.id);
        }
      } else {
        if (!fromBankId) setFromBankId(banks[0].id);
        if (!toBankId) setToBankId(banks[1].id);
      }
    } else if (banks.length === 1) {
      setFromBankId(banks[0].id);
    }
  }, [banks, selectedBankId]);

  // Set default date when component mounts
  useEffect(() => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(Date.now() - tzOffset)).toISOString().slice(0, 16);
    setDate(localISOTime);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!fromBankId || !toBankId) {
      setError('Debés ingresar un banco de origen y un banco de destino.');
      return;
    }

    if (fromBankId === toBankId) {
      setError('El banco de origen y destino no pueden ser el mismo.');
      return;
    }

    const amount = parseFloat(amountString);
    if (isNaN(amount) || amount <= 0) {
      setError('El monto de transferencia debe ser mayor a 0.');
      return;
    }

    const fromBankObj = banks.find(b => b.id === fromBankId);
    if (fromBankObj && fromBankObj.currentBalance < amount) {
      // Allow transfer but warn them
    }

    onAddTransfer({
      fromBankId,
      toBankId,
      amount,
      description: description.trim() || 'Transferencia de saldo',
      date: date || new Date().toISOString()
    });

    // Reset fields
    setAmountString('');
    setDescription('');
    setSuccessMsg('Transferencia registrada exitosamente.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  if (banks.length < 2) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Registrá al menos 2 bancos diferentes para habilitar las transferencias entre cuentas.
        </p>
      </div>
    );
  }

  const selectedFromBank = banks.find(b => b.id === fromBankId);
  const selectedToBank = banks.find(b => b.id === toBankId);

  return (
    <div id="transfer-form-container" className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
      <div className="flex items-center gap-2.5 mb-5 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-bold">
          <ArrowRightLeft className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold font-display text-slate-850 dark:text-slate-100">
            Transferir entre Bancos
          </h2>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5">Disminuye emisor e incrementa receptor</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="text-xs font-semibold p-3 text-red-700 bg-red-50 dark:bg-red-950/30 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="text-xs font-semibold p-3 text-green-700 bg-green-50 dark:bg-green-950/30 dark:text-green-400 rounded-lg">
            {successMsg}
          </div>
        )}

        {/* Dynamic visual path of transfer */}
        <div className="bg-slate-50 dark:bg-slate-800/20 rounded-xl p-3.5 flex items-center justify-around text-xs border border-slate-100 dark:border-slate-850 shadow-inner">
          <div className="text-center flex-1 max-w-[40%]">
            <span className="block text-[10px] uppercase font-bold tracking-wider opacity-60 text-slate-600 dark:text-slate-400">Origen</span>
            <span className="block font-bold truncate text-slate-800 dark:text-slate-200 mt-1">
              {selectedFromBank ? selectedFromBank.name : 'Seleccione'}
            </span>
            <span className="block font-mono text-indigo-600 dark:text-indigo-400 font-semibold text-xs mt-0.5">
              {selectedFromBank ? formatCurrency(selectedFromBank.currentBalance) : '$0,00'}
            </span>
          </div>

          <div className="text-slate-350 dark:text-slate-650 animate-pulse bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2.5 rounded-full shadow-sm">
            <ArrowRight className="h-4 w-4 text-indigo-500" />
          </div>

          <div className="text-center flex-1 max-w-[40%]">
            <span className="block text-[10px] uppercase font-bold tracking-wider opacity-60 text-slate-600 dark:text-slate-400">Destino</span>
            <span className="block font-bold truncate text-slate-800 dark:text-slate-200 mt-1">
              {selectedToBank ? selectedToBank.name : 'Seleccione'}
            </span>
            <span className="block font-mono text-emerald-600 dark:text-emerald-400 font-semibold text-xs mt-0.5">
              {selectedToBank ? formatCurrency(selectedToBank.currentBalance) : '$0,00'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 font-display">
              Desde el Banco (Origen) *
            </label>
            <select
              id="select-transfer-from"
              required
              value={fromBankId}
              onChange={(e) => {
                setFromBankId(e.target.value);
                if (e.target.value === toBankId) {
                  // Swap if same or set to different
                  const other = banks.find(b => b.id !== e.target.value);
                  if (other) setToBankId(other.id);
                }
              }}
              className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400 text-slate-900 dark:text-white transition"
            >
              {banks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} (${b.currentBalance.toLocaleString('es-AR')})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 font-display">
              Al Banco (Destino) *
            </label>
            <select
              id="select-transfer-to"
              required
              value={toBankId}
              onChange={(e) => {
                setToBankId(e.target.value);
                if (e.target.value === fromBankId) {
                  const other = banks.find(b => b.id !== e.target.value);
                  if (other) setFromBankId(other.id);
                }
              }}
              className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400 text-slate-900 dark:text-white transition"
            >
              {banks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} (${b.currentBalance.toLocaleString('es-AR')})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 font-display">
              Monto a Transferir ($) *
            </label>
            <input
              id="input-transfer-amount"
              type="number"
              step="any"
              min="0.01"
              required
              value={amountString}
              onChange={(e) => setAmountString(e.target.value)}
              placeholder="Ej. 1500"
              className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400 text-slate-900 dark:text-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 font-display">
              Fecha y Hora *
            </label>
            <input
              id="input-transfer-date"
              type="datetime-local"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400 text-slate-900 dark:text-white transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 font-display">
            Motivo / Comentario (Opcional)
          </label>
          <input
            id="input-transfer-desc"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej. Rebalanceo de fondos, Transferencia de seguridad"
            className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400 text-slate-900 dark:text-white transition"
          />
        </div>

        <button
          id="submit-add-transfer"
          type="submit"
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition duration-205 shadow-md shadow-indigo-100 dark:shadow-none hover:shadow-indigo-200 mt-2 hover:cursor-pointer"
        >
          <Wallet className="h-4 w-4" />
          Realizar Transferencia
        </button>
      </form>
    </div>
  );
}
