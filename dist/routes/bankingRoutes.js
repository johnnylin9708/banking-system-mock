"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const BankingService_1 = require("../services/BankingService");
const express_validator_1 = require("express-validator");
const router = express_1.default.Router();
// Centralized error handler
function handleValidationErrors(req, res, next) {
    const errors = (0, express_validator_1.validationResult)(req);
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
router.post('/accounts', (0, express_validator_1.body)('name').isString().notEmpty(), (0, express_validator_1.body)('balance').isNumeric().isFloat({ min: 0 }), handleValidationErrors, (req, res) => {
    const { name, balance } = req.body;
    try {
        const account = BankingService_1.bankingService.createAccount(name, balance);
        res.status(201).json(account);
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
});
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
router.get('/accounts/:id', (0, express_validator_1.param)('id').isString().notEmpty(), handleValidationErrors, (req, res) => {
    const id = req.params?.id ?? '';
    const account = BankingService_1.bankingService.getAccount(id);
    if (!account)
        return res.status(404).json({ error: 'Account not found' });
    res.json(account);
});
router.post('/accounts/:id/deposit', (0, express_validator_1.param)('id').isString().notEmpty(), (0, express_validator_1.body)('amount').isNumeric().isFloat({ gt: 0 }), handleValidationErrors, (req, res) => {
    const id = req.params?.id ?? '';
    try {
        const log = BankingService_1.bankingService.deposit(id, req.body.amount);
        res.json(log);
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
});
router.post('/accounts/:id/withdraw', (0, express_validator_1.param)('id').isString().notEmpty(), (0, express_validator_1.body)('amount').isNumeric().isFloat({ gt: 0 }), handleValidationErrors, (req, res) => {
    const id = req.params?.id ?? '';
    try {
        const log = BankingService_1.bankingService.withdraw(id, req.body.amount);
        res.json(log);
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
});
router.post('/accounts/transfer', (0, express_validator_1.body)('fromId').isString().notEmpty(), (0, express_validator_1.body)('toId').isString().notEmpty(), (0, express_validator_1.body)('amount').isNumeric().isFloat({ gt: 0 }), handleValidationErrors, (req, res) => {
    try {
        const log = BankingService_1.bankingService.transfer(req.body.fromId, req.body.toId, req.body.amount);
        res.json(log);
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
});
router.get('/accounts/:id/transactions', (0, express_validator_1.param)('id').isString().notEmpty(), handleValidationErrors, (req, res) => {
    const id = req.params?.id ?? '';
    try {
        const logs = BankingService_1.bankingService.getTransactionLogs(id);
        res.json(logs);
    }
    catch (e) {
        res.status(404).json({ error: e.message });
    }
});
router.get('/accounts', (req, res) => {
    res.json(BankingService_1.bankingService.getAllAccounts());
});
exports.default = router;
