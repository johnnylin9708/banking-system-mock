export interface TransactionLog {
  id: string;
  fromAccountId?: string;
  from?: string;
  toAccountId?: string;
  to?: string;
  amount: number;
  type: 'deposit' | 'withdraw' | 'transfer';
  timestamp: string;
}

export interface Account {
  id: string;
  name: string;
  balance: number;
}
