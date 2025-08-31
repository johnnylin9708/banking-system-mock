import { Account, TransactionLog } from '../models/Account';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../app';

class BankingService {
  private accounts: Map<string, Account> = new Map();
  private transactions: TransactionLog[] = [];

  createAccount(name: string, balance: number): Account {
    if (balance < 0) throw new Error('Initial balance cannot be negative');
    const id = uuidv4();
    const account: Account = { id, name, balance };
    this.accounts.set(id, account);
    return account;
  }

  accountExists(name: string): boolean {
    for (const account of this.accounts.values()) {
      if (account.name === name) {
        return true;
      }
    }
    return false;
  }

  getAccount(id: string): Account | undefined {
    return this.accounts.get(id);
  }


  deposit(id: string, amount: number): TransactionLog {
    this.acquireLock(id);
    try {
      if (amount <= 0) throw new Error('Deposit amount must be positive');
      const account = this.accounts.get(id);
      if (!account) throw new Error('Account not found');
      account.balance += amount;
      const log: TransactionLog = {
        id: uuidv4(),
        toAccountId: id,
        to: account.name,
        amount,
        type: 'deposit',
        timestamp: this.formatTimestamp(new Date()),
      };
      this.transactions.push(log);
      logger.info({
        event: 'deposit',
        accountId: id,
        amount,
        timestamp: log.timestamp,
      });
      return log;
    } finally {
      this.releaseLock(id);
    }
  }


  withdraw(id: string, amount: number): TransactionLog {
    this.acquireLock(id);
    try {
      if (amount <= 0) throw new Error('Withdraw amount must be positive');
      const account = this.accounts.get(id);
      if (!account) throw new Error('Account not found');
      if (account.balance < amount) throw new Error('Insufficient funds');
      account.balance -= amount;
      const log: TransactionLog = {
        id: uuidv4(),
        fromAccountId: id,
        from: account.name,
        amount,
        type: 'withdraw',
        timestamp: this.formatTimestamp(new Date()),
      };
      this.transactions.push(log);
      logger.info({
        event: 'withdraw',
        accountId: id,
        amount,
        timestamp: log.timestamp,
      });
      return log;
    } finally {
      this.releaseLock(id);
    }
  }


  transfer(fromId: string, toId: string, amount: number): TransactionLog {
    if (fromId === toId) throw new Error('Cannot transfer to the same account');
    if (amount <= 0) throw new Error('Transfer amount must be positive');

    // avoid deadlock by locking in consistent order
    const [first, second] = [fromId, toId].sort();
    this.acquireLock(first);
    this.acquireLock(second);
    try {
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
        timestamp: this.formatTimestamp(new Date()),
      };
      this.transactions.push(log);
      logger.info({
        event: 'transfer',
        fromAccountId: fromId,
        toAccountId: toId,
        amount,
        timestamp: log.timestamp,
      });
      return log;
    } finally {
      this.releaseLock(second);
      this.releaseLock(first);
    }
  }

  getTransactionLogs(id: string): TransactionLog[] {
    if (!this.accounts.has(id)) throw new Error('Account not found');
    return this.transactions.filter(
      t => t.fromAccountId === id || t.toAccountId === id
    );
  }

  getAllAccounts(): Account[] {
    return Array.from(this.accounts.values());
  }

  getAllTransactions(): TransactionLog[] {
    return this.transactions;
  }

  // Helper: format timestamp as yyyy/mm/dd HH:MM:SS
  private formatTimestamp(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  private locks: Set<string> = new Set();

  private acquireLock(id: string) {
    if (this.locks.has(id)) throw new Error('Account is busy, try again');
    this.locks.add(id);
  }
  private releaseLock(id: string) {
    this.locks.delete(id);
  }
}

export const bankingService = new BankingService();
