"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bankingService = void 0;
const uuid_1 = require("uuid");
class BankingService {
    constructor() {
        this.accounts = new Map();
    }
    createAccount(name, balance) {
        if (balance < 0)
            throw new Error('Initial balance cannot be negative');
        const id = (0, uuid_1.v4)();
        const account = { id, name, balance, transactions: [] };
        this.accounts.set(id, account);
        return account;
    }
    getAccount(id) {
        return this.accounts.get(id);
    }
    deposit(id, amount) {
        if (amount <= 0)
            throw new Error('Deposit amount must be positive');
        const account = this.accounts.get(id);
        if (!account)
            throw new Error('Account not found');
        account.balance += amount;
        const log = {
            id: (0, uuid_1.v4)(),
            toAccountId: id,
            amount,
            type: 'deposit',
            timestamp: new Date().toISOString(),
        };
        account.transactions.push(log);
        return log;
    }
    withdraw(id, amount) {
        if (amount <= 0)
            throw new Error('Withdraw amount must be positive');
        const account = this.accounts.get(id);
        if (!account)
            throw new Error('Account not found');
        if (account.balance < amount)
            throw new Error('Insufficient funds');
        account.balance -= amount;
        const log = {
            id: (0, uuid_1.v4)(),
            fromAccountId: id,
            amount,
            type: 'withdraw',
            timestamp: new Date().toISOString(),
        };
        account.transactions.push(log);
        return log;
    }
    transfer(fromId, toId, amount) {
        if (amount <= 0)
            throw new Error('Transfer amount must be positive');
        if (fromId === toId)
            throw new Error('Cannot transfer to the same account');
        const from = this.accounts.get(fromId);
        const to = this.accounts.get(toId);
        if (!from || !to)
            throw new Error('Account not found');
        if (from.balance < amount)
            throw new Error('Insufficient funds');
        // Atomic operation
        from.balance -= amount;
        to.balance += amount;
        const log = {
            id: (0, uuid_1.v4)(),
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
    getTransactionLogs(id) {
        const account = this.accounts.get(id);
        if (!account)
            throw new Error('Account not found');
        return account.transactions;
    }
    getAllAccounts() {
        return Array.from(this.accounts.values());
    }
}
exports.bankingService = new BankingService();
