/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bank, Outflow, Transfer, LogEntry } from './types.ts';
import { formatCurrency } from './utils.ts';
import BankCard from './components/BankCard.tsx';
import AddBankForm from './components/AddBankForm.tsx';
import AddOutflowForm from './components/AddOutflowForm.tsx';
import TransferForm from './components/TransferForm.tsx';
import TransactionsTable from './components/TransactionsTable.tsx';
import { 
  Landmark, 
  Plus, 
  ArrowRightLeft, 
  TrendingUp, 
  TrendingDown, 
  Sun, 
  Moon, 
  Info, 
  DollarSign,
  Briefcase,
  Menu,
  X,
  History,
  CreditCard,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

export default function App() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'outflow' | 'transfer' | 'new-bank'>('outflow');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeView, setActiveView] = useState<'dashboard' | 'accounts' | 'operations' | 'history'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Initialize data from localStorage or empty states on mount
  useEffect(() => {
    const storedBanks = localStorage.getItem('gestor_bancos_banks');
    const storedLogs = localStorage.getItem('gestor_bancos_logs');
    const storedTheme = localStorage.getItem('gestor_bancos_theme');

    // Load banks - default to empty slate, clear if defaults are detected
    if (storedBanks) {
      const parsed = JSON.parse(storedBanks);
      if (parsed.length === 3 && parsed[0].id === 'b-1' && parsed[1].id === 'b-2' && parsed[2].id === 'b-3') {
        setBanks([]);
        localStorage.setItem('gestor_bancos_banks', JSON.stringify([]));
      } else {
        setBanks(parsed);
      }
    } else {
      setBanks([]);
      localStorage.setItem('gestor_bancos_banks', JSON.stringify([]));
    }

    // Load logs - default to empty slate, clear if defaults are detected
    if (storedLogs) {
      const parsedLogs = JSON.parse(storedLogs);
      if (parsedLogs.length === 3 && parsedLogs[0].id === 'l-1' && parsedLogs[1].id === 'l-2' && parsedLogs[2].id === 'l-3') {
        setLogs([]);
        localStorage.setItem('gestor_bancos_logs', JSON.stringify([]));
      } else {
        setLogs(parsedLogs);
      }
    } else {
      setLogs([]);
      localStorage.setItem('gestor_bancos_logs', JSON.stringify([]));
    }

    // Load Theme Preference and sync both documentElement and document.body
    if (storedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, []);

  // Set initial selectedBank once banks list is ready
  useEffect(() => {
    if (banks.length > 0 && !selectedBankId) {
      // Allow general filters first
    }
  }, [banks]);

  // Utility to handle dark mode toggle
  const toggleTheme = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      localStorage.setItem('gestor_bancos_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      localStorage.setItem('gestor_bancos_theme', 'light');
    }
  };

  // 1. ADD NEW BANK REST ACTION
  const handleAddBank = (bankData: Omit<Bank, 'id' | 'currentBalance'>) => {
    const newBank: Bank = {
      ...bankData,
      id: `b-${Date.now()}`,
      currentBalance: bankData.initialBalance
    };

    const nextBanks = [...banks, newBank];
    setBanks(nextBanks);
    localStorage.setItem('gestor_bancos_banks', JSON.stringify(nextBanks));
    
    // Auto shift to dashboard so they immediately see the bank card
    setActiveView('dashboard');
  };

  // 2. DELETE BANK REST ACTION
  const handleDeleteBank = (bankId: string) => {
    const nextBanks = banks.filter(b => b.id !== bankId);
    setBanks(nextBanks);
    localStorage.setItem('gestor_bancos_banks', JSON.stringify(nextBanks));

    // Clear logs associated with this deleted bank
    const nextLogs = logs.filter(l => l.bankId !== bankId && l.relatedBankId !== bankId);
    setLogs(nextLogs);
    localStorage.setItem('gestor_bancos_logs', JSON.stringify(nextLogs));

    // Reset selection if deleted
    if (selectedBankId === bankId) {
      setSelectedBankId(undefined);
    }
  };

  // 3. REGISTER NEW OUTFLOW
  const handleAddOutflow = (outflowData: Omit<Outflow, 'id'>) => {
    const targetBank = banks.find(b => b.id === outflowData.bankId);
    if (!targetBank) return;

    // Calculate next currentBalance
    const isIncome = !!outflowData.isIncome || outflowData.category === 'Sueldo/Ingreso';
    const updatedBalance = isIncome 
      ? targetBank.currentBalance + outflowData.amount
      : targetBank.currentBalance - outflowData.amount;

    // Update bank's state
    const nextBanks = banks.map(b => 
      b.id === targetBank.id 
        ? { ...b, currentBalance: updatedBalance }
        : b
    );
    setBanks(nextBanks);
    localStorage.setItem('gestor_bancos_banks', JSON.stringify(nextBanks));

    // Log the transaction
    const newLog: LogEntry = {
      id: `l-${Date.now()}`,
      date: outflowData.date,
      type: 'outflow',
      bankId: outflowData.bankId,
      bankName: targetBank.name,
      amount: outflowData.amount,
      description: outflowData.description,
      category: outflowData.category,
      isIncome: isIncome
    };

    const nextLogs = [newLog, ...logs];
    setLogs(nextLogs);
    localStorage.setItem('gestor_bancos_logs', JSON.stringify(nextLogs));

    // After adding outflow, redirect back to see records
    setActiveView('dashboard');
  };

  // 4. REGISTER NEW INTERNAL BANK TRANSFER
  const handleAddTransfer = (transferData: Omit<Transfer, 'id'>) => {
    const fromBank = banks.find(b => b.id === transferData.fromBankId);
    const toBank = banks.find(b => b.id === transferData.toBankId);
    if (!fromBank || !toBank) return;

    // Update balances
    const nextBanks = banks.map(b => {
      if (b.id === fromBank.id) {
        return { ...b, currentBalance: b.currentBalance - transferData.amount };
      }
      if (b.id === toBank.id) {
        return { ...b, currentBalance: b.currentBalance + transferData.amount };
      }
      return b;
    });
    setBanks(nextBanks);
    localStorage.setItem('gestor_bancos_banks', JSON.stringify(nextBanks));

    // Create log entry for the transfer
    const newLog: LogEntry = {
      id: `l-${Date.now()}`,
      date: transferData.date,
      type: 'transfer',
      bankId: transferData.fromBankId,
      relatedBankId: transferData.toBankId,
      bankName: fromBank.name,
      relatedBankName: toBank.name,
      amount: transferData.amount,
      description: transferData.description
    };

    const nextLogs = [newLog, ...logs];
    setLogs(nextLogs);
    localStorage.setItem('gestor_bancos_logs', JSON.stringify(nextLogs));

    // Redirect to see details
    setActiveView('dashboard');
  };

  // 5. REVERT/DELETE TRANSACTION (ROLLBACK OPERATION ON BALANCES)
  const handleDeleteLog = (logId: string) => {
    const targetLog = logs.find(l => l.id === logId);
    if (!targetLog) return;

    let nextBanks = [...banks];

    if (targetLog.type === 'outflow') {
      const isIncome = !!targetLog.isIncome || targetLog.category === 'Sueldo/Ingreso';
      nextBanks = banks.map(b => {
        if (b.id === targetLog.bankId) {
          // Revert: if it was income, deduct it. If it was outlay/expense, add it back.
          const balanceAdjustment = isIncome ? -targetLog.amount : targetLog.amount;
          return { ...b, currentBalance: b.currentBalance + balanceAdjustment };
        }
        return b;
      });
    } else if (targetLog.type === 'transfer') {
      nextBanks = banks.map(b => {
        if (b.id === targetLog.bankId) {
          // Revert transfer: sender gains money back
          return { ...b, currentBalance: b.currentBalance + targetLog.amount };
        }
        if (b.id === targetLog.relatedBankId) {
          // Revert transfer: receiver returns money
          return { ...b, currentBalance: b.currentBalance - targetLog.amount };
        }
        return b;
      });
    }

    setBanks(nextBanks);
    localStorage.setItem('gestor_bancos_banks', JSON.stringify(nextBanks));

    const nextLogs = logs.filter(l => l.id !== logId);
    setLogs(nextLogs);
    localStorage.setItem('gestor_bancos_logs', JSON.stringify(nextLogs));
  };

  // Dashboard Stats Calculations
  const totalFunds = banks.reduce((sum, b) => sum + b.currentBalance, 0);
  const totalInitialFunds = banks.reduce((sum, b) => sum + b.initialBalance, 0);
  
  // Total Spent (only genuine outflows, excluding wages/salary category or when isIncome=true)
  const totalSpent = logs
    .filter(l => l.type === 'outflow' && !l.isIncome && l.category !== 'Sueldo/Ingreso')
    .reduce((sum, l) => sum + l.amount, 0);

  // Total Income (uniquely category 'Sueldo/Ingreso' or explicitly which isIncome is true)
  const totalIncome = logs
    .filter(l => l.type === 'outflow' && (l.isIncome || l.category === 'Sueldo/Ingreso'))
    .reduce((sum, l) => sum + l.amount, 0);

  // Sidebar Menu Items Definition
  interface MenuItem {
    id: 'dashboard' | 'accounts' | 'operations' | 'history';
    label: string;
    icon: typeof Briefcase;
    desc: string;
    count?: number;
  }

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Inicio', icon: Briefcase, desc: 'Resumen general y balances' },
    { id: 'accounts', label: 'Mis Bancos', icon: Landmark, desc: 'Tus cuentas bancarias', count: banks.length },
    { id: 'operations', label: 'Operar', icon: ArrowRightLeft, desc: 'Gastos y transferencias' },
    { id: 'history', label: 'Ver Historial', icon: History, desc: 'Registro de movimientos', count: logs.length }
  ];

  return (
    <div id="app-viewport-container" className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300 flex flex-col md:flex-row text-slate-900 dark:text-slate-100">
      
      {/* ----------------- DESKTOP SIDEBAR ----------------- */}
      <aside id="desktop-sidebar" className="hidden md:flex flex-col w-72 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 sticky h-screen top-0 p-6 overflow-y-auto justify-between">
        <div className="space-y-8">
          {/* Brand Logo Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-100 dark:shadow-none">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight font-display text-slate-805 dark:text-white leading-none">
                OmniBank <span className="text-indigo-600 dark:text-indigo-400">Flow</span>
              </h1>
              <p className="text-[10px] font-mono tracking-wider text-slate-400 dark:text-slate-500 uppercase mt-1">
                Finanzas Multicuenta
              </p>
            </div>
          </div>

          {/* Consolidated Overview Balance box in Sidebar */}
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-150 dark:border-slate-850">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Total Consolidado
            </span>
            <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 font-display mt-0.5">
              {formatCurrency(totalFunds)}
            </p>
            <div className="mt-2.5 pt-2 border-t border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between text-[11px] text-slate-400">
              <span>Saldos de {banks.length} cuentas</span>
            </div>
          </div>

          {/* Sidebar Navigation Links List */}
          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  onClick={() => {
                    setActiveView(item.id);
                  }}
                  className={`w-full group px-4 py-3 text-sm font-semibold rounded-xl flex items-center justify-between transition-all duration-200 text-left cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-none font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                    <div>
                      <span className="block leading-none">{item.label}</span>
                      <span className={`text-[10px] font-normal leading-none mt-1 block ${isActive ? 'text-indigo-200' : 'text-slate-400 group-hover:text-slate-500'}`}>
                        {item.desc}
                      </span>
                    </div>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-mono font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-850 text-slate-500'}`}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Desktop Theme Switcher & Footer */}
        <div className="border-t border-slate-150 dark:border-slate-800/60 pt-4 mt-4 space-y-4">
          <button
            onClick={toggleTheme}
            id="desktop-theme-toggle"
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-850/80 rounded-xl text-slate-650 dark:text-slate-350 transition text-xs font-semibold cursor-pointer border border-slate-150 dark:border-slate-850"
          >
            <span className="flex items-center gap-2">
              {isDarkMode ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-indigo-500" />}
              <span>{isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
            </span>
            <span className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded text-slate-450">
              {isDarkMode ? 'Oscuro' : 'Claro'}
            </span>
          </button>

          <div className="flex items-center gap-3 px-1">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-xs select-none shadow-sm">
              UX
            </div>
            <div className="text-[11px]">
              <p className="font-bold text-slate-700 dark:text-slate-300">Sesión Local</p>
              <p className="text-slate-400 font-mono">Offline Protegido</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ----------------- MOBILE TOP BAR ----------------- */}
      <header id="mobile-top-bar" className="flex md:hidden sticky top-0 z-20 items-center justify-between p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-150 dark:border-slate-850 shadow-sm">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          id="mobile-hamburger"
          className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-855 rounded-xl text-slate-600 dark:text-slate-300 cursor-pointer"
          aria-label="Abrir menú"
        >
          <Menu className="h-5.5 w-5.5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm shadow-indigo-100">
            <Landmark className="h-4.5 w-4.5" />
          </div>
          <span className="font-display font-extrabold text-sm text-slate-800 dark:text-white">
            OmniBank <span className="text-indigo-600 dark:text-indigo-400">Flow</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleTheme}
            id="mobile-theme-toggle"
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-855 rounded-xl text-slate-600 dark:text-slate-300 cursor-pointer"
            title={isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
          >
            {isDarkMode ? <Sun className="h-4.5 w-4.5 text-amber-500" /> : <Moon className="h-4.5 w-4.5 text-indigo-500" />}
          </button>
        </div>
      </header>

      {/* ----------------- MOBILE SLIDING DRAWER MENU ----------------- */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div id="mobile-drawer-overlay" className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop Dimmer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Sliding Drawer Container */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-80 max-w-[85vw] h-full bg-white dark:bg-slate-900 p-6 flex flex-col justify-between shadow-2xl z-10 border-r border-slate-150 dark:border-slate-800 overflow-y-auto"
            >
              <div className="space-y-8">
                {/* Header inside drawer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                      <Landmark className="h-4.5 w-4.5" />
                    </div>
                    <span className="font-display font-extrabold text-slate-805 dark:text-white text-base">
                      OmniBank
                    </span>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
                    aria-label="Cerrar menú"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Account consolidated brief in mobile drawer */}
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-850">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">
                    Fondos Consolidados
                  </span>
                  <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-display mt-0.5">
                    {formatCurrency(totalFunds)}
                  </p>
                </div>

                {/* Nav Links */}
                <nav className="space-y-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveView(item.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full px-4 py-3 rounded-xl flex items-center justify-between text-left transition text-sm font-bold cursor-pointer ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow shadow-indigo-100'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          <div>
                            <span className="block leading-tight">{item.label}</span>
                            <span className={`text-[10px] font-normal leading-none mt-0.5 block ${isActive ? 'text-indigo-200' : 'text-slate-400'}`}>
                              {item.desc}
                            </span>
                          </div>
                        </div>
                        {item.count !== undefined && item.count > 0 && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                            {item.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Drawer footer */}
              <div className="border-t border-slate-150 dark:border-slate-800 pt-4 mt-12 space-y-4">
                <button
                  onClick={() => {
                    toggleTheme();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  <span className="flex items-center gap-2">
                    {isDarkMode ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-indigo-500" />}
                    <span>{isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
                  </span>
                  <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded">
                    Cambiar
                  </span>
                </button>

                <p className="text-[10px] text-slate-400 text-center font-mono">
                  OmniBank • Datos en LocalStorage
                </p>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* ----------------- CORE VIEWS RENDERING AND CONTENT ----------------- */}
      <main id="main-scrollable-content-area" className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 space-y-6 md:space-y-8 max-w-7xl mx-auto w-full">
        
        {/* VIEW 1: DASHBOARD RESUMEN */}
        {activeView === 'dashboard' && (
          <div id="view-dashboard-container" className="space-y-6 md:space-y-8">
            {/* Title Block with dynamic calendar status greeting */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-850 dark:text-white font-display">
                  Resumen de Finanzas
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Revisión instantánea y agregada de tus cuentas y egresos.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 p-2.5 px-4 rounded-xl border border-indigo-150/40 font-semibold self-start sm:self-center uppercase tracking-wide">
                <span>🗓️ Estado actualizado</span>
              </div>
            </div>

            {/* Total Consolidation Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {/* Card 1: Total Liquid Assets */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                    Fondos Totales
                  </span>
                  <h3 className="text-2xl md:text-3xl font-black font-display tracking-tight text-slate-850 dark:text-white mt-1">
                    {formatCurrency(totalFunds)}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Saldo total inicial: {formatCurrency(totalInitialFunds)}
                  </p>
                </div>
                <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-450 rounded-xl shrink-0">
                  <DollarSign className="h-6 w-6" />
                </div>
              </div>

              {/* Card 2: Cumulative Expenditures */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                    Egresos Totales
                  </span>
                  <h3 className="text-2xl md:text-3xl font-black font-display tracking-tight text-rose-600 dark:text-rose-400 mt-1 font-mono">
                    {formatCurrency(totalSpent)}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                    <TrendingDown className="h-3 w-3 text-rose-500 shrink-0" />
                    Baja directa de saldos
                  </p>
                </div>
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-405 rounded-xl shrink-0">
                  <TrendingDown className="h-6 w-6" />
                </div>
              </div>

              {/* Card 3: Salary and Incomes */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                    Ingresos Totales
                  </span>
                  <h3 className="text-2xl md:text-3xl font-black font-display tracking-tight text-emerald-600 dark:text-emerald-450 mt-1 font-mono">
                    {formatCurrency(totalIncome)}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-emerald-500 shrink-0" />
                    Sueldos y reintegros
                  </p>
                </div>
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 rounded-xl shrink-0">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
            </div>

            {/* Quick action buttons row for extreme mobile access */}
            <div className="bg-gradient-to-br from-indigo-50/40 via-white to-slate-100/50 dark:from-slate-900/40 dark:via-slate-900 dark:to-slate-950 rounded-2xl p-4 border border-slate-205/40 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-950 rounded-lg text-indigo-650 dark:text-indigo-400">
                  <Info className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-705 dark:text-slate-200">¿Deseas realizar una transacción?</h4>
                  <p className="text-[11px] text-slate-450 dark:text-slate-400 mt-0.5">Accede de manera directa a los formularios de carga.</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setActiveView('operations');
                    setActiveTab('outflow');
                  }}
                  className="flex-1 sm:flex-initial text-center justify-center inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 dark:bg-rose-600 dark:hover:bg-rose-700 text-white transition cursor-pointer"
                >
                  <TrendingDown className="h-3 w-3" />
                  Cargar Salida
                </button>
                <button
                  onClick={() => {
                    setActiveView('operations');
                    setActiveTab('transfer');
                  }}
                  className="flex-1 sm:flex-initial text-center justify-center inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition cursor-pointer"
                >
                  <ArrowRightLeft className="h-3 w-3" />
                  Transferir Plata
                </button>
              </div>
            </div>

            {/* Bank Card Swipe lists */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-display">
                  Saldos en Cuentas Bancarias
                </h3>
                <button
                  onClick={() => setActiveView('accounts')}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  Gestionar Bancos
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {banks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                  <AlertCircle className="h-8 w-8 text-slate-350 dark:text-slate-655 mb-2.5" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Ningún banco registrado</p>
                  <p className="text-xs text-slate-500 dark:text-slate-450 mt-1 max-w-sm">No has ingresado ningún banco. Crea uno para comenzar a ingresar salidas y transferir dinero.</p>
                  <button
                    onClick={() => setActiveView('accounts')}
                    className="mt-4 px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
                  >
                    Agregar Banco
                  </button>
                </div>
              ) : (
                /* Interactive Scroll Swipe layout for mobile */
                <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 overflow-x-auto md:overflow-visible pb-4 md:pb-0 gap-4 md:gap-6 snap-x snap-mandatory scrollbar-none">
                  {banks.map((bank) => (
                    <div 
                      key={bank.id} 
                      className="min-w-[290px] md:min-w-0 snap-center shrink-0 w-[85vw] md:w-auto"
                    >
                      <BankCard
                        bank={bank}
                        isSelected={selectedBankId === bank.id}
                        onSelect={(id) => {
                          setSelectedBankId(selectedBankId === id ? undefined : id);
                          // Auto shift filter view to see transaction logs of that bank card
                          setActiveView('history');
                        }}
                        onDelete={handleDeleteBank}
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Recent Activity Mini Ledger */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-display">
                  Movimientos Recientes
                </h3>
                <button
                  onClick={() => {
                    setSelectedBankId(undefined);
                    setActiveView('history');
                  }}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  Ver Todo el Historial
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {logs.length === 0 ? (
                <div className="py-12 bg-white dark:bg-slate-900 border border-slate-201/80 dark:border-slate-800 rounded-2xl text-center text-slate-500">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Sin movimientos previos de saldos</p>
                  <p className="text-xs text-slate-450 dark:text-slate-450 mt-1">Sube salidas de dinero o haz rebalanceos de saldos.</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="p-3 md:p-4 bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-150 dark:border-slate-850 flex justify-between items-center px-6">
                    <span className="text-[11px] font-bold text-slate-450 uppercase">Últimas operaciones cargadas</span>
                    <span className="text-[11px] font-mono text-indigo-600 font-semibold">{logs.length} en total</span>
                  </div>
                  
                  {/* Reuse the high-performance desktop table / mobile cards but cut to max 5 in this view */}
                  <TransactionsTable
                    logs={logs.slice(0, 5)}
                    banks={banks}
                    onDeleteLog={handleDeleteLog}
                  />
                </div>
              )}
            </section>
          </div>
        )}

        {/* VIEW 2: ACCOUNTS MANAGEMENT (MIS BANCOS) */}
        {activeView === 'accounts' && (
          <div id="view-accounts-container" className="space-y-6 md:space-y-8">
            <div>
              <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-850 dark:text-white font-display">
                Mis Cuentas Bancarias
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Registra fondos, visualiza códigos de CVU/CBU y anula entidades según tu conveniencia.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
              {/* Left Column: Registered Card lists */}
              <div className="lg:col-span-7 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-display">
                  Saldos Liquidados ({banks.length})
                </h3>

                {banks.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200/80 dark:border-slate-800">
                    <Briefcase className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-4 animate-pulse" />
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Menú vacío de cuentas</p>
                    <p className="text-xs text-slate-450 mt-1 max-w-sm mx-auto">No hay bancos registrados para iniciar tus ingresos y egresos. Configura tu primer banco ingresando su nombre y saldo inicial en el panel de la derecha.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <AnimatePresence mode="popLayout">
                      {banks.map((bank) => (
                        <div key={bank.id} className="relative group">
                          <BankCard
                            bank={bank}
                            isSelected={selectedBankId === bank.id}
                            onSelect={(id) => setSelectedBankId(selectedBankId === id ? undefined : id)}
                            onDelete={handleDeleteBank}
                          />
                        </div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Right Column: Register Bank Card Form */}
              <div className="lg:col-span-12 xl:col-span-5 lg:sticky lg:top-24">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-display mb-4">
                  Registrar Nueva Entidad
                </h3>
                <AddBankForm
                  onAddBank={handleAddBank}
                />
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: OPERATIONS (EGRESOS Y TRANSFERENCIAS) */}
        {activeView === 'operations' && (
          <div id="view-operations-container" className="space-y-6 md:space-y-8 max-w-3xl mx-auto">
            <div className="text-center space-y-1">
              <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-850 dark:text-white font-display">
                Carga de Operaciones
              </h2>
              <p className="text-xs text-slate-550 dark:text-slate-400">
                Selecciona la acción financiera deseada para asentar tus salidas de fondos o movimientos.
              </p>
            </div>

            {/* Custom Tab toggle controls */}
            <div className="bg-slate-200/60 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl flex gap-1 shadow-inner">
              <button
                onClick={() => setActiveTab('outflow')}
                className={`flex-1 py-3 text-xs font-extrabold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'outflow'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow'
                    : 'text-slate-650 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <TrendingDown className="h-4 w-4 text-red-500" />
                Asentar Salida (Gasto o Depósito)
              </button>

              <button
                onClick={() => setActiveTab('transfer')}
                className={`flex-1 py-3 text-xs font-extrabold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'transfer'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow'
                    : 'text-slate-650 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ArrowRightLeft className="h-4 w-4 text-indigo-500" />
                Transferencia Interna
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 p-1 rounded-2xl border border-transparent">
              <AnimatePresence mode="wait">
                {activeTab === 'outflow' ? (
                  <motion.div
                    key="view-outflow-subpanel"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                  >
                    <AddOutflowForm
                      banks={banks}
                      selectedBankId={selectedBankId}
                      onAddOutflow={handleAddOutflow}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="view-transfer-subpanel"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                  >
                    <TransferForm
                      banks={banks}
                      selectedBankId={selectedBankId}
                      onAddTransfer={handleAddTransfer}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* VIEW 4: LEDGER REGISTRY (HISTORIAL COMPLETO) */}
        {activeView === 'history' && (
          <div id="view-history-container" className="space-y-6 md:space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-850 dark:text-white font-display">
                  Historial de Movimientos
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Filtrado, búsqueda inteligente de conceptos y auditoría completa de saldos liquidados.
                </p>
              </div>

              {selectedBankId && (
                <div className="flex items-center gap-2 bg-indigo-55 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-455 p-2 px-3.5 rounded-full border border-indigo-150/40 text-xs font-semibold">
                  <span>Banco activo: {banks.find(b => b.id === selectedBankId)?.name}</span>
                  <button 
                    onClick={() => setSelectedBankId(undefined)}
                    className="p-1 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded-full cursor-pointer ml-1 text-indigo-800"
                    title="Limpiar pre-selección"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>

            <TransactionsTable
              logs={logs}
              banks={banks}
              selectedFilterBankId={selectedBankId}
              onClearBankFilter={() => setSelectedBankId(undefined)}
              onDeleteLog={handleDeleteLog}
            />
          </div>
        )}

      </main>
    </div>
  );
}
