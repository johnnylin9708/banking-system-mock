import express, { Request, Response, NextFunction } from 'express';
import { bankingService } from '../services/BankingService';
import { body, param, validationResult } from 'express-validator';

const router = express.Router();

// Centralized error handler
function handleValidationErrors(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      data: null,
      error: "Invalid input",
      message: "Validation failed",
      details: errors.array()
    });
  }
  next();
}

// Middleware to allow only specified fields in req.body
function allowOnlyFields(allowed: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const extra = Object.keys(req.body).filter(k => !allowed.includes(k));
    if (extra.length > 0) {
      return res.status(400).json({ 
        success: false,
        data: null,
        error: `Unexpected fields: ${extra.join(', ')}` 
      });
    }
    next();
  };
}

/**
 * @swagger
 * /accounts:
 *   post:
 *     summary: Create a new account
 *     description: |
 *       Create a new bank account with a unique name and initial balance. The account name must not duplicate an existing account. Returns the created account object on success.
 *     tags: [Accounts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               balance:
 *                 type: number
 *     responses:
 *       201:
 *         description: Account created
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 id: "acc123"
 *                 name: "Alice"
 *                 balance: 100
 *               error: null
 *               message: "Account created"
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               data: null
 *               error: "Invalid input"
 *               message: "Failed to create account"
 *       409:
 *         description: Conflict
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               data: null
 *               error: "Account already exists"
 *               message: "Duplicate account name"
 */
router.post(
  '/accounts',
  body('name').isString().bail().notEmpty(),
  body('balance').isNumeric().bail().isFloat({ min: 0 }),
  handleValidationErrors,
  allowOnlyFields(['name', 'balance']),
  (req: Request, res: Response) => {
    const { name, balance } = req.body;
    try {
      if (bankingService.accountExists(name)) {
        return res.status(409).json({
          success: false,
          data: null,
          error: 'Account already exists',
          message: 'Duplicate account name'
        });
      }
      const account = bankingService.createAccount(name, balance);
      res.status(201).json({
        success: true,
        data: account,
        error: null,
        message: 'Account created'
      });
    } catch (e: any) {
      res.status(400).json({
        success: false,
        data: null,
        error: e.message,
        message: 'Failed to create account'
      });
    }
  }
);

/**
 * @swagger
 * /accounts/{id}:
 *   get:
 *     summary: Get account by ID
 *     description: |
 *       Retrieve a single account's details by its unique ID. Returns the account object if found, otherwise returns an error if the account does not exist.
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Account found
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 id: "acc123"
 *                 name: "Alice"
 *                 balance: 100
 *               error: null
 *               message: "Account found"
 *       404:
 *         description: Account not found
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               data: null
 *               error: "Account not found"
 *               message: "No such account"
 */
router.get(
  '/accounts/:id',
  param('id'),
  (req: Request, res: Response) => {
    const id = req.params?.id ?? '';
    const account = bankingService.getAccount(id);
    if (!account) return res.status(404).json({
      success: false,
      data: null,
      error: 'Account not found',
      message: 'No such account'
    });
    res.json({
      success: true,
      data: account,
      error: null,
      message: 'Account found'
    });
  }
);

/**
 * @swagger
 * /accounts/{id}/deposit:
 *   post:
 *     summary: Deposit money to an account
 *     description: |
 *       Deposit a positive amount of money into the specified account. Returns a transaction log entry for the deposit. Fails if the account does not exist or the amount is invalid.
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Deposit successful
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 id: "log123"
 *                 toAccountId: "acc123"
 *                 to: "Alice"
 *                 amount: 50
 *                 type: "deposit"
 *                 timestamp: "2025/08/31 12:00:00"
 *               error: null
 *               message: "Deposit successful"
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               data: null
 *               error: "Invalid input"
 *               message: "Deposit failed"
 */
router.post(
  '/accounts/:id/deposit',
  param('id').isString().notEmpty(),
  body('amount').isNumeric().bail().isFloat({ gt: 0 }),
  handleValidationErrors,
  allowOnlyFields(['amount']),
  (req: Request, res: Response) => {
    const id = req.params?.id ?? '';
    try {
      const log = bankingService.deposit(id, req.body.amount);
      res.json({
        success: true,
        data: log,
        error: null,
        message: 'Deposit successful'
      });
    } catch (e: any) {
      
      if (e.message === 'Account not found') {
        return res.status(404).json({
          success: false,
          data: null,
          error: e.message,
          message: 'Deposit failed'
        });
      }

      res.status(400).json({
        success: false,
        data: null,
        error: e.message,
        message: 'Deposit failed'
      });
    }
  }
);

/**
 * @swagger
 * /accounts/{id}/withdraw:
 *   post:
 *     summary: Withdraw money from an account
 *     description: |
 *       Withdraw a positive amount of money from the specified account. Returns a transaction log entry for the withdrawal. Fails if the account does not exist, the amount is invalid, or insufficient funds.
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Withdraw successful
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 id: "log124"
 *                 fromAccountId: "acc123"
 *                 from: "Alice"
 *                 amount: 30
 *                 type: "withdraw"
 *                 timestamp: "2025/08/31 12:10:00"
 *               error: null
 *               message: "Withdraw successful"
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               data: null
 *               error: "Invalid input"
 *               message: "Withdraw failed"
 */
router.post(
  '/accounts/:id/withdraw',
  param('id').isString().notEmpty(),
  body('amount').isNumeric().bail().isFloat({ gt: 0 }),
  handleValidationErrors,
  allowOnlyFields(['amount']),
  (req: Request, res: Response) => {
    const id = req.params?.id ?? '';
    try {
      const log = bankingService.withdraw(id, req.body.amount);
      res.json({
        success: true,
        data: log,
        error: null,
        message: 'Withdraw successful'
      });
    } catch (e: any) {

      if (e.message === 'Account not found') {
        return res.status(404).json({
          success: false,
          data: null,
          error: e.message,
          message: 'Withdraw failed'
        });
      }

      res.status(400).json({
        success: false,
        data: null,
        error: e.message,
        message: 'Withdraw failed'
      });
    }
  }
);

/**
 * @swagger
 * /accounts/transfer:
 *   post:
 *     summary: Transfer money between accounts
 *     description: |
 *       Transfer a positive amount of money from one account to another. Both accounts must exist and the source account must have sufficient funds. Returns a transaction log entry for the transfer.
 *     tags: [Accounts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fromId:
 *                 type: string
 *               toId:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Transfer successful
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 id: "log125"
 *                 fromAccountId: "acc123"
 *                 toAccountId: "acc456"
 *                 amount: 20
 *                 type: "transfer"
 *                 timestamp: "2025/08/31 12:20:00"
 *               error: null
 *               message: "Transfer successful"
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               data: null
 *               error: "Invalid input"
 *               message: "Transfer failed"
 */
router.post(
  '/accounts/transfer',
  body('fromId').isString().bail().notEmpty(),
  body('toId').isString().bail().notEmpty(),
  body('amount').isNumeric().bail().isFloat({ gt: 0 }),
  handleValidationErrors,
  allowOnlyFields(['fromId', 'toId', 'amount']),
  (req: Request, res: Response) => {
    try {
      const log = bankingService.transfer(req.body.fromId, req.body.toId, req.body.amount);
      res.json({
        success: true,
        data: log,
        error: null,
        message: 'Transfer successful'
      });
    } catch (e: any) {
      res.status(400).json({
        success: false,
        data: null,
        error: e.message,
        message: 'Transfer failed'
      });
    }
  }
);

/**
 * @swagger
 * /accounts/{id}/transactions:
 *   get:
 *     summary: Get transaction logs for an account
 *     description: |
 *       Retrieve all transaction logs (deposits, withdrawals, transfers) for the specified account. Returns an array of transaction log objects. Fails if the account does not exist.
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction logs
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 - id: "log123"
 *                   type: "deposit"
 *                   amount: 50
 *                   timestamp: "2025/08/31 12:00:00"
 *                 - id: "log124"
 *                   type: "withdraw"
 *                   amount: 30
 *                   timestamp: "2025/08/31 12:10:00"
 *               error: null
 *               message: "Transaction logs fetched"
 *       404:
 *         description: Account not found
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               data: null
 *               error: "Account not found"
 *               message: "Account not found"
 */
router.get(
  '/accounts/:id/transactions',
  param('id'),
  (req: Request, res: Response) => {
    const id = req.params?.id ?? '';
    try {
      const logs = bankingService.getTransactionLogs(id);
      res.json({
        success: true,
        data: logs,
        error: null,
        message: 'Transaction logs fetched'
      });
    } catch (e: any) {
      res.status(404).json({
        success: false,
        data: null,
        error: e.message,
        message: 'Account not found'
      });
    }
  }
);

/**
 * @swagger
 * /accounts:
 *   get:
 *     summary: Get all accounts
 *     description: |
 *       Retrieve a list of all bank accounts in the system. Returns an array of account objects.
 *     tags: [Accounts]
 *     responses:
 *       200:
 *         description: List of all accounts
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 - id: "acc123"
 *                   name: "Alice"
 *                   balance: 100
 *                 - id: "acc456"
 *                   name: "Bob"
 *                   balance: 200
 *               error: null
 *               message: "All accounts fetched"
 */
router.get('/accounts', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: bankingService.getAllAccounts(),
    error: null,
    message: 'All accounts fetched'
  });
});

/**
 * @swagger
 * /transactions:
 *   get:
 *     summary: Get all transactions
 *     description: |
 *       Retrieve a list of all transaction logs (deposits, withdrawals, transfers) in the system. Returns an array of transaction log objects.
 *     tags: [Transactions]
 *     responses:
 *       200:
 *         description: List of all transactions
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 - id: "log123"
 *                   type: "deposit"
 *                   amount: 50
 *                   timestamp: "2025/08/31 12:00:00"
 *                 - id: "log124"
 *                   type: "withdraw"
 *                   amount: 30
 *                   timestamp: "2025/08/31 12:10:00"
 *               error: null
 *               message: "All transactions fetched"
 */
router.get('/transactions', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: bankingService.getAllTransactions(),
    error: null,
    message: 'All transactions fetched'
  });
});


router.get('/simulate-error', (req, res) => {
  throw new Error('Simulated server error');
});

export default router;
