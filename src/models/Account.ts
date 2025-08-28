export interface TransactionLog {
  id: string;
  fromAccountId?: string;
  toAccountId?: string;
  amount: number;
  type: 'deposit' | 'withdraw' | 'transfer';
  timestamp: string;
}

export interface Account {
  id: string;
  name: string;
  balance: number;
  transactions: TransactionLog[];
}
