import express, { Request, Response, NextFunction } from 'express';
import { bankingService } from '../services/BankingService';
import { body, param, validationResult } from 'express-validator';

const router = express.Router();

// Centralized error handler
function handleValidationErrors(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

/**
 * @swagger
 * /accounts:
 *   post:
 *     summary: Create a new account
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
 *       400:
 *         description: Invalid input
 */
router.post(
  '/accounts',
  body('name').isString().notEmpty(),
  body('balance').isNumeric().isFloat({ min: 0 }),
  handleValidationErrors,
  (req: Request, res: Response) => {
    const { name, balance } = req.body;
    try {
      const account = bankingService.createAccount(name, balance);
      res.status(201).json(account);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }
);

/**
 * @swagger
 * /accounts/{id}:
 *   get:
 *     summary: Get account by ID
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
 *       404:
 *         description: Account not found
 */
router.get(
  '/accounts/:id',
  param('id').isString().notEmpty(),
  handleValidationErrors,
  (req: Request, res: Response) => {
    const id = req.params?.id ?? '';
    const account = bankingService.getAccount(id);
    if (!account) return res.status(404).json({ error: 'Account not found' });
    res.json(account);
  }
);

/**
 * @swagger
 * /accounts/{id}/deposit:
 *   post:
 *     summary: Deposit money to an account
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
 *       400:
 *         description: Invalid input
 */
router.post(
  '/accounts/:id/deposit',
  param('id').isString().notEmpty(),
  body('amount').isNumeric().isFloat({ gt: 0 }),
  handleValidationErrors,
  (req: Request, res: Response) => {
    const id = req.params?.id ?? '';
    try {
      const log = bankingService.deposit(id, req.body.amount);
      res.json(log);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }
);

/**
 * @swagger
 * /accounts/{id}/withdraw:
 *   post:
 *     summary: Withdraw money from an account
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
 *       400:
 *         description: Invalid input
 */
router.post(
  '/accounts/:id/withdraw',
  param('id').isString().notEmpty(),
  body('amount').isNumeric().isFloat({ gt: 0 }),
  handleValidationErrors,
  (req: Request, res: Response) => {
    const id = req.params?.id ?? '';
    try {
      const log = bankingService.withdraw(id, req.body.amount);
      res.json(log);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }
);

/**
 * @swagger
 * /accounts/transfer:
 *   post:
 *     summary: Transfer money between accounts
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
 *       400:
 *         description: Invalid input
 */
router.post(
  '/accounts/transfer',
  body('fromId').isString().notEmpty(),
  body('toId').isString().notEmpty(),
  body('amount').isNumeric().isFloat({ gt: 0 }),
  handleValidationErrors,
  (req: Request, res: Response) => {
    try {
      const log = bankingService.transfer(req.body.fromId, req.body.toId, req.body.amount);
      res.json(log);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }
);

/**
 * @swagger
 * /accounts/{id}/transactions:
 *   get:
 *     summary: Get transaction logs for an account
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
 *       404:
 *         description: Account not found
 */
router.get(
  '/accounts/:id/transactions',
  param('id').isString().notEmpty(),
  handleValidationErrors,
  (req: Request, res: Response) => {
    const id = req.params?.id ?? '';
    try {
      const logs = bankingService.getTransactionLogs(id);
      res.json(logs);
    } catch (e: any) {
      res.status(404).json({ error: e.message });
    }
  }
);

/**
 * @swagger
 * /accounts:
 *   get:
 *     summary: Get all accounts
 *     tags: [Accounts]
 *     responses:
 *       200:
 *         description: List of all accounts
 */
router.get('/accounts', (req: Request, res: Response) => {
  res.json(bankingService.getAllAccounts());
});

export default router;
