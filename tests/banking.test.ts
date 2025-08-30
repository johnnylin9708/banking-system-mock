import request from 'supertest';
import app from '../src/app';
import jwt from 'jsonwebtoken';

// Generate a valid JWT for testing
const TEST_JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
const testToken = jwt.sign({ userId: 'test-user' }, TEST_JWT_SECRET, { expiresIn: '1h' });
const authHeader = { Authorization: `Bearer ${testToken}` };

describe('Banking API', () => {
  // unit tests
  it('should return undefined for non-existent account', () => {
    const result = require('../src/services/BankingService').bankingService.getAccount('not-exist');
    expect(result).toBeUndefined();
  });

  it('should return false when account does not exist', () => {
    const result = require('../src/services/BankingService').bankingService.accountExists('not-exist');
    expect(result).toBe(false);
  });

  // integration tests for banking operations
  let accountA: any, accountB: any;

  it('should create an account', async () => {
    const res = await request(app)
      .post('/api/accounts')
      .set(authHeader)
      .send({ name: 'Alice', balance: 100 });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Alice');
    expect(res.body.data.balance).toBe(100);
    accountA = res.body.data;
  });

  it('should reject request with extra fields', async () => {
    const res = await request(app)
      .post('/api/accounts')
      .set(authHeader)
      .send({ name: 'Extra', balance: 100, foo: 'bar' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/Unexpected fields/);
  });

  it('should return validation error details', async () => {
    const res = await request(app)
      .post('/api/accounts')
      .set(authHeader)
      .send({ balance: 100 }); // missing name
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.details).toBeDefined();
  });

  it('should not allow creating account with negative balance', async () => {
    const res = await request(app)
      .post('/api/accounts')
      .set(authHeader)
      .send({ name: 'Negative', balance: -100 });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should deposit money', async () => {
    const res = await request(app)
      .post(`/api/accounts/${accountA.id}/deposit`)
      .set(authHeader)
      .send({ amount: 50 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.amount).toBe(50);
  });

  it('should withdraw money', async () => {
    const res = await request(app)
      .post(`/api/accounts/${accountA.id}/withdraw`)
      .set(authHeader)
      .send({ amount: 30 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.amount).toBe(30);
  });

  it('should not allow negative balance', async () => {
    const res = await request(app)
      .post(`/api/accounts/${accountA.id}/withdraw`)
      .set(authHeader)
      .send({ amount: 1000 });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
  });

  it('should create another account and transfer money', async () => {
    const resB = await request(app)
      .post('/api/accounts')
      .set(authHeader)
      .send({ name: 'Bob', balance: 50 });
    expect(resB.status).toBe(201);
    expect(resB.body.success).toBe(true);
    accountB = resB.body.data;

    const res = await request(app)
      .post('/api/accounts/transfer')
      .set(authHeader)
      .send({ fromId: accountA.id, toId: accountB.id, amount: 20 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.amount).toBe(20);
  });

  it('should not allow transfer to self', async () => {
    const res = await request(app)
      .post('/api/accounts/transfer')
      .set(authHeader)
      .send({ fromId: accountA.id, toId: accountA.id, amount: 10 });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/Cannot transfer to the same account/);
  });

  it('should log transactions', async () => {
    const res = await request(app)
      .get(`/api/accounts/${accountA.id}/transactions`)
      .set(authHeader);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('should not allow transfer from non-existent account', async () => {
    const res = await request(app)
      .post('/api/accounts/transfer')
      .set(authHeader)
      .send({ fromId: 'notfound', toId: accountA.id, amount: 10 });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/Account not found/);
  });

  it('should not allow transfer to non-existent account', async () => {
    const res = await request(app)
      .post('/api/accounts/transfer')
      .set(authHeader)
      .send({ fromId: accountA.id, toId: 'notfound', amount: 10 });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/Account not found/);
  });

  it('should return 404 for get transactions of non-existent account', async () => {
    const res = await request(app)
      .get('/api/accounts/notfound/transactions')
      .set(authHeader);
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/Account not found/);
  });

  it('should return 404 for withdraw from non-existent account', async () => {
    const res = await request(app)
      .post('/api/accounts/notfound/withdraw')
      .set(authHeader)
      .send({ amount: 10 });
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/Account not found/);
  });

  it('should return 404 for deposit to non-existent account', async () => {
    const res = await request(app)
      .post('/api/accounts/notfound/deposit')
      .set(authHeader)
      .send({ amount: 10 });
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/Account not found/);
  });

  it('should return 500 for unexpected server error', async () => {
    const res = await request(app)
      .get('/api/simulate-error')
      .set(authHeader);
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Internal Server Error');
    expect(res.body.message).toMatch(/Simulated server error/);
  });

  it('should return 404 for unknown route', async () => {
    const res = await request(app)
      .get('/api/unknown-route')
      .set(authHeader);
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Not Found');
  });
});
