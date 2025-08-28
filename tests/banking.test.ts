import request from 'supertest';
import app from '../src/app';

describe('Banking API', () => {
  let accountA: any, accountB: any;

  it('should create an account', async () => {
    const res = await request(app)
      .post('/api/accounts')
      .send({ name: 'Alice', balance: 100 });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Alice');
    expect(res.body.balance).toBe(100);
    accountA = res.body;
  });

  it('should deposit money', async () => {
    const res = await request(app)
      .post(`/api/accounts/${accountA.id}/deposit`)
      .send({ amount: 50 });
    expect(res.status).toBe(200);
    expect(res.body.amount).toBe(50);
  });

  it('should withdraw money', async () => {
    const res = await request(app)
      .post(`/api/accounts/${accountA.id}/withdraw`)
      .send({ amount: 30 });
    expect(res.status).toBe(200);
    expect(res.body.amount).toBe(30);
  });

  it('should not allow negative balance', async () => {
    const res = await request(app)
      .post(`/api/accounts/${accountA.id}/withdraw`)
      .send({ amount: 1000 });
    expect(res.status).toBe(400);
  });

  it('should create another account and transfer money', async () => {
    const resB = await request(app)
      .post('/api/accounts')
      .send({ name: 'Bob', balance: 50 });
    expect(resB.status).toBe(201);
    accountB = resB.body;

    const res = await request(app)
      .post('/api/accounts/transfer')
      .send({ fromId: accountA.id, toId: accountB.id, amount: 20 });
    expect(res.status).toBe(200);
    expect(res.body.amount).toBe(20);
  });

  it('should log transactions', async () => {
    const res = await request(app)
      .get(`/api/accounts/${accountA.id}/transactions`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
