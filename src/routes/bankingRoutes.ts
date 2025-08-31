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

router.get('/accounts', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: bankingService.getAllAccounts(),
    error: null,
    message: 'All accounts fetched'
  });
});

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
