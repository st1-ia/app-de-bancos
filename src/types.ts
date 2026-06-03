/**
 * Type definitions for Gestor de Bancos
 */

export interface Bank {
  id: string;
  name: string;
  initialBalance: number;
  currentBalance: number;
  color: string; // Tailwind bg-color or theme slug (e.g. "blue", "indigo", "emerald", "fuchsia", "amber", "rose")
  accountNumber?: string;
}

export type OutflowCategory = string;

export interface Outflow {
  id: string;
  bankId: string;
  amount: number;
  description?: string;
  category?: OutflowCategory;
  date: string;
  isIncome?: boolean;
}

export interface Transfer {
  id: string;
  fromBankId: string;
  toBankId: string;
  amount: number;
  description?: string;
  date: string;
}

export interface LogEntry {
  id: string;
  date: string;
  type: 'outflow' | 'transfer';
  bankId: string; // primary involved bank (for outflow: the bank, for transfer: fromBank)
  relatedBankId?: string; // for transfers: toBank
  bankName: string;
  relatedBankName?: string;
  amount: number;
  description?: string;
  category?: OutflowCategory; // only for outflow
  isIncome?: boolean;
}
