import React, { useState } from 'react';
import { LogEntry, Bank, OutflowCategory } from '../types.ts';
import { formatCurrency, formatDate } from '../utils.ts';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowDownRight, 
  ArrowRightLeft, 
  Search, 
  Filter, 
  X, 
  Trash2, 
  Tag, 
  Calendar,
  Layers,
  AlertTriangle
} from 'lucide-react';

interface TransactionsTableProps {
  logs: LogEntry[];
  banks: Bank[];
  onDeleteLog: (logId: string) => void;
  selectedFilterBankId?: string;
  onClearBankFilter?: () => void;
}

export default function TransactionsTable({
  logs,
  banks,
  onDeleteLog,
  selectedFilterBankId,
  onClearBankFilter
}: TransactionsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'outflow' | 'transfer'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [bankFilter, setBankFilter] = useState<string>('all');
  const [logToDelete, setLogToDelete] = useState<LogEntry | null>(null);

  // Date range filters
  const [filterByDate, setFilterByDate] = useState(false);
  const [dateRangeType, setDateRangeType] = useState<'weekly' | 'monthly' | 'custom'>('weekly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Sync internal bankFilter state with external selectedFilterBankId when specified
  const activeBankId = selectedFilterBankId || bankFilter;

  // Filter logs list
  const filteredLogs = logs.filter(log => {
    // 1. Text Search
    const descText = log.description || '';
    const textMatch = 
      descText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.bankName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.relatedBankName && log.relatedBankName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.category && log.category.toLowerCase().includes(searchTerm.toLowerCase()));

    // 2. Type Filter
    const typeMatch = typeFilter === 'all' || log.type === typeFilter;

    // 3. Category Filter (only applicable to Outflows)
    const categoryMatch = 
      categoryFilter === 'all' || 
      (log.type === 'outflow' && log.category === categoryFilter);

    // 4. Bank Filter (either sending or receiving)
    const bankMatch = 
      activeBankId === 'all' || 
      log.bankId === activeBankId || 
      log.relatedBankId === activeBankId;

    // 5. Date Filter (Weekly, Monthly or Custom range)
    let dateMatch = true;
    if (filterByDate && log.date) {
      const logTime = new Date(log.date).getTime();
      if (!isNaN(logTime)) {
        if (dateRangeType === 'weekly') {
          // 7 days ago
          const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
          dateMatch = logTime >= cutoff;
        } else if (dateRangeType === 'monthly') {
          // 30 days ago
          const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
          dateMatch = logTime >= cutoff;
        } else if (dateRangeType === 'custom') {
          if (startDate) {
            const startMs = new Date(startDate + 'T00:00:00').getTime();
            if (!isNaN(startMs)) {
              dateMatch = dateMatch && logTime >= startMs;
            }
          }
          if (endDate) {
            const endMs = new Date(endDate + 'T23:59:59').getTime();
            if (!isNaN(endMs)) {
              dateMatch = dateMatch && logTime <= endMs;
            }
          }
        }
      }
    }

    return textMatch && typeMatch && categoryMatch && bankMatch && dateMatch;
  });

  const uniqueCategories = Array.from(
    new Set(logs.filter(l => l.category).map(l => l.category as string))
  );

  const resetAllFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setBankFilter('all');
    setFilterByDate(false);
    setDateRangeType('weekly');
    setStartDate('');
    setEndDate('');
    if (onClearBankFilter) {
      onClearBankFilter();
    }
  };

  return (
    <div id="transactions-section" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Header with quick count */}
      <div className="p-6 border-b border-slate-150 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold font-display text-slate-800 dark:text-slate-100">
            Registro Historial de Movimientos
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Se muestran <span className="font-semibold text-indigo-600 dark:text-indigo-400">{filteredLogs.length}</span> de {logs.length} movimientos en total
          </p>
        </div>

        {(searchTerm || typeFilter !== 'all' || categoryFilter !== 'all' || activeBankId !== 'all' || filterByDate || startDate || endDate) && (
          <button
            onClick={resetAllFilters}
            className="self-start md:self-center flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-3.5 py-2 rounded-lg transition hover:bg-indigo-100/60 cursor-pointer"
          >
            <X className="h-3 w-3" />
            Limpiar Filtros
          </button>
        )}
      </div>

      {/* Filters Pane */}
      <div className="p-6 bg-slate-50/50 dark:bg-slate-900/40 border-b border-slate-200/60 dark:border-slate-800 flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-450 dark:text-slate-500" />
            <input
              id="search-transactions"
              type="text"
              placeholder="Buscar por concepto o banco..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs bg-white dark:bg-slate-805 border border-slate-200 dark:border-slate-755 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400 text-slate-800 dark:text-white"
            />
          </div>

          {/* Type Filter dropdown */}
          <div className="relative">
            <Layers className="absolute left-3 top-3 h-4 w-4 text-slate-450 dark:text-slate-500" />
            <select
              id="filter-type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full pl-9 pr-4 py-2.5 text-xs bg-white dark:bg-slate-805 border border-slate-200 dark:border-slate-755 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400 text-slate-800 dark:text-white appearance-none"
            >
              <option value="all">Todos los Tipos</option>
              <option value="outflow">Salidas (Gastos/Ingresos)</option>
              <option value="transfer">Transferencias entre Cuentas</option>
            </select>
          </div>

          {/* Bank Filter dropdown */}
          <div className="relative">
            <Filter className="absolute left-3 top-3 h-4 w-4 text-slate-450 dark:text-slate-500" />
            <select
              id="filter-bank"
              value={activeBankId}
              onChange={(e) => {
                setBankFilter(e.target.value);
                if (onClearBankFilter && e.target.value === 'all') {
                  onClearBankFilter();
                }
              }}
              className="w-full pl-9 pr-4 py-2.5 text-xs bg-white dark:bg-slate-805 border border-slate-200 dark:border-slate-755 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400 text-slate-800 dark:text-white appearance-none"
            >
              <option value="all">Todos los Bancos</option>
              {banks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter dropdown */}
          <div className="relative">
            <Tag className="absolute left-3 top-3 h-4 w-4 text-slate-450 dark:text-slate-500" />
            <select
              id="filter-category"
              value={categoryFilter}
              disabled={typeFilter === 'transfer'}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs bg-white dark:bg-slate-805 border border-slate-200 dark:border-slate-755 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400 text-slate-800 dark:text-white disabled:opacity-50 disabled:bg-slate-100 appearance-none"
            >
              <option value="all">Todas las Categorías</option>
              {uniqueCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
        {/* Date Filter section */}
        <div className="border-t border-slate-200/50 dark:border-slate-800 pt-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setFilterByDate(!filterByDate)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  filterByDate
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-350 border-slate-200 @dark:border-slate-755'
                }`}
              >
                <Calendar className="h-3.5 w-3.5" />
                Filtrar por fecha
              </button>

              {filterByDate && (
                <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  {[
                    { value: 'weekly', label: 'Semanal' },
                    { value: 'monthly', label: 'Mensual' },
                    { value: 'custom', label: 'Elegir rango' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setDateRangeType(option.value as any);
                        if (option.value !== 'custom') {
                          setStartDate('');
                          setEndDate('');
                        }
                      }}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        dateRangeType === option.value
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Custom Inputs */}
            {filterByDate && dateRangeType === 'custom' && (
              <div className="flex flex-wrap items-center gap-2.5 bg-slate-100 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-200/50 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Desde:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-2 py-1 text-xs bg-white dark:bg-slate-805 border border-slate-200 dark:border-slate-755 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-455 text-slate-800 dark:text-white"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Hasta:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-2 py-1 text-xs bg-white dark:bg-slate-805 border border-slate-200 dark:border-slate-755 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-455 text-slate-800 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Logs Table Area */}
      {filteredLogs.length === 0 ? (
        <div className="py-16 text-center text-slate-500 dark:text-slate-400">
          <Calendar className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
          <p className="text-sm font-semibold font-display">No se encontraron movimientos registrados</p>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">Prueba cambiando los filtros de búsqueda o seleccionando otro banco</p>
        </div>
      ) : (
        <div className="overflow-hidden">
          {/* Desktop/Tablet Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-slate-800/40 text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
                  <th className="py-3.5 px-6">Fecha</th>
                  <th className="py-3.5 px-6">Tipo</th>
                  <th className="py-3.5 px-6">Cuentas Relacionadas</th>
                  <th className="py-3.5 px-6">Concepto / Categoría</th>
                  <th className="py-3.5 px-6 text-right">Monto</th>
                  <th className="py-3.5 px-6 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm">
                {filteredLogs.map((log) => {
                  const isOutflow = log.type === 'outflow';
                  const isIncomeCategory = !!log.isIncome || log.category === 'Sueldo/Ingreso';

                  return (
                    <tr 
                      key={log.id} 
                      id={`log-row-desktop-${log.id}`}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 bg-white dark:bg-slate-900 transition-colors"
                    >
                      {/* Date */}
                      <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono font-medium">
                        {formatDate(log.date)}
                      </td>

                      {/* Type Badge */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        {isOutflow ? (
                          isIncomeCategory ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">
                              Ingreso
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400">
                              <ArrowDownRight className="h-3 w-3" />
                              Gasto
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400">
                            <ArrowRightLeft className="h-3 w-3" />
                            Transferencia
                          </span>
                        )}
                      </td>

                      {/* Involved accounts */}
                      <td className="py-4 px-6 font-semibold text-slate-700 dark:text-slate-200">
                        {isOutflow ? (
                          <div className="flex items-center gap-2">
                            <span className="truncate max-w-[150px] font-sans">{log.bankName}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs">
                            <span className="font-bold truncate max-w-[100px] text-slate-800 dark:text-slate-300 font-sans">
                              {log.bankName}
                            </span>
                            <span className="text-slate-400 mx-1">→</span>
                            <span className="font-bold truncate max-w-[100px] text-slate-800 dark:text-slate-300 font-sans">
                              {log.relatedBankName}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Concept & Category */}
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1">
                          <span className="text-slate-900 dark:text-slate-100 font-bold line-clamp-1">
                            {log.description || (log.type === 'outflow' ? (log.category || (isIncomeCategory ? 'Ingreso' : 'Egreso')) : 'Transferencia de saldo')}
                          </span>
                          {log.category && (
                            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-450 dark:text-slate-400/80 flex items-center gap-1">
                              • {log.category}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-6 text-right whitespace-nowrap font-mono font-bold">
                        {isOutflow ? (
                          isIncomeCategory ? (
                            <span className="text-emerald-600 dark:text-emerald-400">+ {formatCurrency(log.amount)}</span>
                          ) : (
                            <span className="text-slate-850 dark:text-slate-105">- {formatCurrency(log.amount)}</span>
                          )
                        ) : (
                          <span className="text-indigo-600 dark:text-indigo-400">⚡ {formatCurrency(log.amount)}</span>
                        )}
                      </td>

                      {/* Action Revert / Delete */}
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => setLogToDelete(log)}
                          className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                          title="Revertir movimiento y ajustar saldos"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards List View */}
          <div className="block md:hidden p-4 space-y-3 max-h-[500px] overflow-y-auto bg-slate-50/20 dark:bg-slate-950/20">
            {filteredLogs.map((log) => {
              const isOutflow = log.type === 'outflow';
              const isIncomeCategory = !!log.isIncome || log.category === 'Sueldo/Ingreso';

              return (
                <div 
                  key={log.id} 
                  id={`log-card-mobile-${log.id}`}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col gap-2.5 transition active:scale-[0.99] duration-155"
                >
                  {/* Top line with date and badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 dark:text-slate-550 font-mono font-medium">
                      {formatDate(log.date)}
                    </span>
                    <div>
                      {isOutflow ? (
                        isIncomeCategory ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">
                            Ingreso
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400">
                            Gasto
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-705 dark:bg-indigo-950/20 dark:text-indigo-400">
                          Transfer
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body description */}
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                      {log.description || (log.type === 'outflow' ? (log.category || (isIncomeCategory ? 'Ingreso' : 'Egreso')) : 'Transferencia de saldo')}
                    </h4>
                    
                    {/* Accounts visual path */}
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-555 dark:text-slate-400">
                      {isOutflow ? (
                        <span className="truncate max-w-[200px] font-medium">{log.bankName}</span>
                      ) : (
                        <div className="flex items-center gap-1 truncate max-w-[200px]">
                          <span className="font-semibold">{log.bankName}</span>
                          <span className="text-slate-400">→</span>
                          <span className="font-semibold">{log.relatedBankName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom line: category & amount & delete */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-850 mt-1">
                    <div>
                      {log.category ? (
                        <span className="inline-flex items-center text-[10px] uppercase font-bold tracking-wider text-slate-450 dark:text-slate-400">
                          🛍️ {log.category}
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-450 dark:text-slate-500">
                          {log.type === 'outflow' ? '🏷️ Sin categoría' : '🔌 Transferencia'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono font-extrabold text-sm">
                        {isOutflow ? (
                          isIncomeCategory ? (
                            <span className="text-emerald-700 dark:text-emerald-400">+ {formatCurrency(log.amount)}</span>
                          ) : (
                            <span className="text-slate-850 dark:text-slate-100 font-extrabold">- {formatCurrency(log.amount)}</span>
                          )
                        ) : (
                          <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{formatCurrency(log.amount)}</span>
                        )}
                      </span>

                      <button
                        onClick={() => setLogToDelete(log)}
                        className="p-1 px-1.5 text-slate-400 hover:text-red-655 hover:bg-red-50 dark:hover:bg-rose-950/20 rounded border border-transparent hover:border-red-100 transition duration-150 cursor-pointer"
                        title="Revertir"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modern custom sliding Confirm Modal - bypass sandboxed iframe restrictions against javascript confirms */}
      <AnimatePresence>
        {logToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop Dimmer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLogToDelete(null)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            />
            {/* Modal Content Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-201 dark:border-slate-800 rounded-2xl p-6 shadow-2xl z-10 text-left"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-red-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl shrink-0">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-display font-black text-slate-850 dark:text-white text-base">
                    ¿Revertir esta operación?
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Esta acción restablecerá los saldos de tus cuentas asociadas al estado previo.
                  </p>
                </div>
              </div>

              <div className="my-4 bg-slate-50 dark:bg-slate-955 p-3.5 rounded-xl border border-slate-150 dark:border-slate-800 text-xs text-slate-650 dark:text-slate-300 font-mono space-y-2">
                <p><strong>Tipo:</strong> {logToDelete.type === 'outflow' ? (logToDelete.category === 'Sueldo/Ingreso' ? 'Ingreso' : 'Egreso') : 'Transferencia Interna'}</p>
                <p><strong>Concepto:</strong> {logToDelete.description || logToDelete.category || 'Sin descripción'}</p>
                <p><strong>Monto:</strong> {formatCurrency(logToDelete.amount)}</p>
                <p><strong>Cuenta:</strong> {logToDelete.bankName} {logToDelete.relatedBankName ? `→ ${logToDelete.relatedBankName}` : ''}</p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setLogToDelete(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs cursor-pointer transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    onDeleteLog(logToDelete.id);
                    setLogToDelete(null);
                  }}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 dark:bg-rose-600 dark:hover:bg-rose-700 text-white rounded-xl font-bold text-xs cursor-pointer transition shadow-sm"
                >
                  Sí, Revertir Balances
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
