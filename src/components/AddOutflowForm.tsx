import React, { useState, useEffect } from 'react';
import { Bank, Outflow, OutflowCategory } from '../types.ts';
import { ArrowDownRight, ArrowUpRight, Sparkles, Plus, Check } from 'lucide-react';

interface AddOutflowFormProps {
  banks: Bank[];
  onAddOutflow: (outflow: Omit<Outflow, 'id'>) => void;
  selectedBankId?: string;
}

interface CategoryItem {
  value: string;
  label: string;
  icon: string;
}

const DEFAULT_CATEGORIES: CategoryItem[] = [
  { value: 'Comida', label: 'Comida / Supermercado', icon: '🍔' },
  { value: 'Servicios', label: 'Servicios / Impuestos', icon: '🔌' },
  { value: 'Alquiler', label: 'Alquiler / Expensas', icon: '🏠' },
  { value: 'Transporte', label: 'Transporte / Nafta', icon: '🚗' },
  { value: 'Entretenimiento', label: 'Entretenimiento / Ocio', icon: '🎬' },
  { value: 'Salud', label: 'Salud / Farmacia', icon: '💊' },
  { value: 'Sueldo/Ingreso', label: 'Sueldo / Devolución', icon: '💵' },
  { value: 'Otros', label: 'Otros Gastos', icon: '📦' }
];

export default function AddOutflowForm({ banks, onAddOutflow, selectedBankId }: AddOutflowFormProps) {
  const [bankId, setBankId] = useState('');
  const [amountString, setAmountString] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<OutflowCategory>('');
  const [movementType, setMovementType] = useState<'expense' | 'income'>('expense');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');

  // Custom Category States
  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>([]);
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false);
  const [customCategoryLabel, setCustomCategoryLabel] = useState('');
  const [customCategoryIcon, setCustomCategoryIcon] = useState('🏷️');

  // Load categories list on mount
  useEffect(() => {
    const stored = localStorage.getItem('gestor_bancos_categories_v3');
    if (stored) {
      try {
        setCategoriesList(JSON.parse(stored));
      } catch (e) {
        setCategoriesList(DEFAULT_CATEGORIES);
      }
    } else {
      setCategoriesList(DEFAULT_CATEGORIES);
      localStorage.setItem('gestor_bancos_categories_v3', JSON.stringify(DEFAULT_CATEGORIES));
    }
  }, []);

  // Sincronizar el ID del banco seleccionado desde las tarjetas
  useEffect(() => {
    if (selectedBankId) {
      setBankId(selectedBankId);
    } else if (banks.length > 0 && !bankId) {
      setBankId(banks[0].id);
    }
  }, [selectedBankId, banks]);

  // Set default date when component mounts
  useEffect(() => {
    const now = new Date();
    // Format to yyyy-MM-ddThh:mm
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(Date.now() - tzOffset)).toISOString().slice(0, 16);
    setDate(localISOTime);
  }, []);

  const handleSaveCustomCategory = () => {
    setError('');
    const trimmedLabel = customCategoryLabel.trim();
    if (!trimmedLabel) {
      setError('Por favor, ingresá un nombre para la categoría personalizada.');
      return;
    }

    // Double check it doesn't already exist
    const alreadyExists = categoriesList.some(
      cat => cat.value.toLowerCase() === trimmedLabel.toLowerCase() || cat.label.toLowerCase() === trimmedLabel.toLowerCase()
    );
    if (alreadyExists) {
      setError('Esta categoría ya existe.');
      return;
    }

    const newCat: CategoryItem = {
      value: trimmedLabel,
      label: trimmedLabel,
      icon: customCategoryIcon.trim() || '🏷️'
    };

    const nextCategories = [...categoriesList, newCat];
    setCategoriesList(nextCategories);
    localStorage.setItem('gestor_bancos_categories_v3', JSON.stringify(nextCategories));

    // Auto set and reset subform
    setCategory(newCat.value);
    setIsAddingCustomCategory(false);
    setCustomCategoryLabel('');
    setCustomCategoryIcon('🏷️');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!bankId) {
      setError('Tenés que seleccionar un banco de origen.');
      return;
    }

    const amount = parseFloat(amountString);
    if (isNaN(amount) || amount <= 0) {
      setError('El monto debe ser un número mayor a 0.');
      return;
    }

    const targetBank = banks.find(b => b.id === bankId);
    if (targetBank && targetBank.currentBalance < amount && category !== 'Sueldo/Ingreso') {
      // Just a warning or notification - let's allow it but warn them
    }

    onAddOutflow({
      bankId,
      amount,
      description: description.trim() || undefined,
      category: category || undefined,
      date: date || new Date().toISOString(),
      isIncome: movementType === 'income',
    });

    // Reset fields except Selected Bank & Category (to speed up multiple inputs)
    setAmountString('');
    setDescription('');
  };

  if (banks.length === 0) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Registrá al menos un banco para poder registrar salidas de dinero.
        </p>
      </div>
    );
  }

  return (
    <div id="add-outflow-form-container" className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
      <div className="flex items-center gap-2.5 mb-5 border-b border-slate-100 dark:border-slate-800 pb-4">
        {movementType === 'expense' ? (
          <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400">
            <ArrowDownRight className="h-5 w-5" />
          </div>
        ) : (
          <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400">
            <ArrowUpRight className="h-5 w-5" />
          </div>
        )}
        <div>
          <h2 className="text-lg font-bold font-display text-slate-850 dark:text-slate-100">
            {movementType === 'expense' ? 'Cargar Salida / Egreso' : 'Cargar Ingreso'}
          </h2>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5">
            {movementType === 'expense' ? 'Disminuye el saldo de la cuenta elegida' : 'Aumenta el saldo de la cuenta elegida'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="text-xs font-semibold p-3 text-red-700 bg-red-50 dark:bg-red-950/30 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        {/* Tipo de Transacción Selector Tuple */}
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Tipo de Transacción *
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setMovementType('income')}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                movementType === 'income'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-900/40 dark:text-emerald-455 font-extrabold ring-2 ring-emerald-500/20'
                  : 'bg-white border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-755'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${movementType === 'income' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              Ingreso (+)
            </button>
            <button
              type="button"
              onClick={() => setMovementType('expense')}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                movementType === 'expense'
                  ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/30 dark:border-rose-900/40 dark:text-rose-455 font-extrabold ring-2 ring-rose-500/20'
                  : 'bg-white border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-750'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${movementType === 'expense' ? 'bg-rose-500' : 'bg-slate-400'}`} />
              Egreso (Gasto)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Cuenta Bancaria *
            </label>
            <select
              id="select-outflow-bank"
              required
              value={bankId}
              onChange={(e) => setBankId(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400 text-slate-900 dark:text-white transition"
            >
              {banks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} (Disponibles: ${b.currentBalance.toLocaleString('es-AR')})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Categoría (Opcional)
              </label>
              <button
                type="button"
                onClick={() => setIsAddingCustomCategory(!isAddingCustomCategory)}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold focus:outline-none flex items-center gap-1 cursor-pointer"
              >
                {isAddingCustomCategory ? 'Ver Lista' : '➕ Crear Categoría'}
              </button>
            </div>
            
            {isAddingCustomCategory ? (
              <div className="p-2 border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/30 rounded-xl space-y-1.5">
                <span className="block text-[9px] uppercase tracking-wider text-indigo-600 font-bold dark:text-indigo-455">NUEVA CATEGORÍA</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customCategoryIcon}
                    onChange={(e) => setCustomCategoryIcon(e.target.value)}
                    placeholder="🏷️"
                    className="w-12 px-2 py-1.5 text-center text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    maxLength={3}
                  />
                  <input
                    type="text"
                    value={customCategoryLabel}
                    onChange={(e) => setCustomCategoryLabel(e.target.value)}
                    placeholder="Ej. Gimnasio, Mascotas"
                    className="flex-1 min-w-0 px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleSaveCustomCategory}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shrink-0 cursor-pointer"
                  >
                    OK
                  </button>
                </div>
              </div>
            ) : (
              <select
                id="select-outflow-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as OutflowCategory)}
                className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400 text-slate-900 dark:text-white transition"
              >
                <option value="">🏷️ Sin categoría (Opcional)</option>
                {categoriesList.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Monto ($) *
            </label>
            <input
              id="input-outflow-amount"
              type="number"
              step="any"
              min="0.01"
              required
              value={amountString}
              onChange={(e) => setAmountString(e.target.value)}
              placeholder="Ej. 1850"
              className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400 text-slate-900 dark:text-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Fecha y Hora *
            </label>
            <input
              id="input-outflow-date"
              type="datetime-local"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400 text-slate-900 dark:text-white transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            Detalle / Descripción del Concepto (Opcional)
          </label>
          <input
            id="input-outflow-desc"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej. Supermercado Chino, Pago de Luz (Opcional)"
            className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400 text-slate-900 dark:text-white transition"
          />
        </div>

        <button
          id="submit-add-outflow"
          type="submit"
          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 text-white text-sm font-semibold rounded-xl transition duration-200 shadow-md mt-2 hover:cursor-pointer ${
            movementType === 'expense'
              ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-100 hover:shadow-rose-200 dark:shadow-none'
              : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100 hover:shadow-emerald-200 dark:shadow-none'
          }`}
        >
          {movementType === 'expense' ? (
            <>
              <ArrowDownRight className="h-4 w-4" />
              <span>Registrar Egreso / Gasto</span>
            </>
          ) : (
            <>
              <ArrowUpRight className="h-4 w-4" />
              <span>Registrar Ingreso</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
