import { Account, TransactionLog } from '../models/Account';
import { v4 as uuidv4 } from 'uuid';

class BankingService {
  private accounts: Map<string, Account> = new Map();

  createAccount(name: string, balance: number): Account {
    if (balance < 0) throw new Error('Initial balance cannot be negative');
    const id = uuidv4();
    const account: Account = { id, name, balance, transactions: [] };
    this.accounts.set(id, account);
    return account;
  }

  getAccount(id: string): Account | undefined {
    return this.accounts.get(id);
  }

  deposit(id: string, amount: number): TransactionLog {
    if (amount <= 0) throw new Error('Deposit amount must be positive');
    const account = this.accounts.get(id);
    if (!account) throw new Error('Account not found');
    account.balance += amount;
    const log: TransactionLog = {
      id: uuidv4(),
      toAccountId: id,
      amount,
      type: 'deposit',
      timestamp: new Date().toISOString(),
    };
    account.transactions.push(log);
    return log;
  }

  withdraw(id: string, amount: number): TransactionLog {
    if (amount <= 0) throw new Error('Withdraw amount must be positive');
    const account = this.accounts.get(id);
    if (!account) throw new Error('Account not found');
    if (account.balance < amount) throw new Error('Insufficient funds');
    account.balance -= amount;
    const log: TransactionLog = {
      id: uuidv4(),
      fromAccountId: id,
      amount,
      type: 'withdraw',
      timestamp: new Date().toISOString(),
    };
    account.transactions.push(log);
    return log;
  }

  transfer(fromId: string, toId: string, amount: number): TransactionLog {
    if (amount <= 0) throw new Error('Transfer amount must be positive');
    if (fromId === toId) throw new Error('Cannot transfer to the same account');
    const from = this.accounts.get(fromId);
    const to = this.accounts.get(toId);
    if (!from || !to) throw new Error('Account not found');
    if (from.balance < amount) throw new Error('Insufficient funds');
    // Atomic operation
    from.balance -= amount;
    to.balance += amount;
    const log: TransactionLog = {
      id: uuidv4(),
      fromAccountId: fromId,
      toAccountId: toId,
      amount,
      type: 'transfer',
      timestamp: new Date().toISOString(),
    };
    from.transactions.push(log);
    to.transactions.push(log);
    return log;
  }

  getTransactionLogs(id: string): TransactionLog[] {
    const account = this.accounts.get(id);
    if (!account) throw new Error('Account not found');
    return account.transactions;
  }

  getAllAccounts(): Account[] {
    return Array.from(this.accounts.values());
  }
}

export const bankingService = new BankingService();
