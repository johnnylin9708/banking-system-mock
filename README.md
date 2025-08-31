# Banking System Mock API

A Node.js + TypeScript RESTful banking system with in-memory storage, JWT authentication, OpenAPI docs, and full test coverage.

---

## Project Structure

```
bankingSystemMock/
├── src/
│   ├── app.ts                # Express app and middleware
│   ├── server.ts             # Server entry point
│   ├── models/
│   │   └── Account.ts        # Type definitions
│   ├── routes/
│   │   └── bankingRoutes.ts  # All API routes
│   └── services/
│       └── BankingService.ts # Business logic (atomic operations)
├── tests/
│   └── banking.test.ts       # Jest unit and integration tests
├── postman/
│   └── Banking System Mock API.postman_collection.json # Postman collection
├── openapi.yaml              # OpenAPI 3.1 spec
├── Dockerfile                # Docker build config
├── .dockerignore
├── package.json
└── README.md
```

---

## Features

- **Account Management**
  - Create account (unique name, non-negative balance)
  - List all accounts
  - Get account by ID

- **Transactions**
  - Deposit (positive amount only)
  - Withdraw (cannot overdraw)
  - Transfer (atomic, cannot transfer to self, cannot overdraw)

- **Transaction Logs**
  - Get all transactions for an account
  - Get all transactions

- **API Documentation**
  - [Swagger UI](http://localhost:9999/docs) (JWT support)

- **Security**
  - JWT authentication (all `/api` routes require Bearer Token)
  - Helmet, rate-limit, unified error format

- **Testing**
  - Jest unit and integration tests, covers all edge cases

- **Docker Support**
  - One-command build/run, no need for local Node/npm

---

## Getting Started

### 1. Install dependencies

```sh
npm install
```

### 2. Set environment variables

Create a `.env` file (or use environment variables):

```
JWT_SECRET=6b2e1f9c-8a3d-4d7e-9c2a-7f1b2e3c4d5e
```

> **Note: This secret is for testing/demo only. In production, use a secure secret managed by your cloud platform or a Secret Manager.**

### 3. Start development server

```sh
npm run dev
```

### 4. Run tests

```sh
npm test
npm run test:coverage
```

---

## Docker Deployment

### Build & Run

```sh
docker build -t banking-system-mock .
docker run -p 9999:9999 --env JWT_SECRET=6b2e1f9c-8a3d-4d7e-9c2a-7f1b2e3c4d5e banking-system-mock
```
> **Note: This secret is for testing/demo only. In production, use environment variables or a Secret Manager.**

### Or use docker-compose

```yaml
version: '3'
services:
  api:
    build: .
    ports:
      - "9999:9999"
    environment:
      - JWT_SECRET=your_secret
```

```sh
docker-compose up --build
```

---

## API Documentation

- Swagger UI: [http://localhost:9999/docs](http://localhost:9999/docs)
- OpenAPI YAML: [`openapi.yaml`](openapi.yaml)

---

## API Usage & Limitations

### Authentication & Security
- **All `/api` routes require Bearer Token (JWT)**. Use `Authorization: Bearer <token>` in the header.
- Invalid or missing JWT returns 401 Unauthorized.
- The default JWT_SECRET is for testing only. Always use a secure secret in production.

### Rate Limiting
- **Max 100 requests per minute** (shared across all APIs). Exceeding this returns 429 Too Many Requests.
- See `openapi.yaml` and Swagger UI for 429 error examples.

### Input Validation
- All amounts must be positive; account balances cannot be negative.
- Account names must be unique.
- Transfers cannot be to self (`fromId ≠ toId`), and source account must have sufficient balance.
- Request body only allows specified fields; extra fields will be rejected.

### Response Format
- All API responses follow  
  `{ success, data, error, message }`
- On failure, `success: false`, `error` contains the error message, and `data` is null.

### Data & Transaction Limitations
- All accounts and transactions are stored in memory; **data is lost on server restart**.
- No data persistence or multi-threaded deployment.
- No multi-currency, advanced permissions, or pagination (can be extended if needed).

---

## Postman Testing

1. Import `postman/Banking System Mock API.postman_collection.json`
2. Set the `baseUrl` variable to `http://localhost:9999`
3. Set the Bearer Token (the collection includes a demo token)

---

## Main API Endpoints

- `POST /api/accounts` Create account
- `GET /api/accounts` List all accounts
- `GET /api/accounts/:id` Get account by ID
- `POST /api/accounts/:id/deposit` Deposit
- `POST /api/accounts/:id/withdraw` Withdraw
- `POST /api/accounts/transfer` Transfer
- `GET /api/accounts/:id/transactions` Get account transaction logs
- `GET /api/transactions` Get all transactions

---

## Notes

- All data is in-memory and will be cleared on server restart.
- All API responses follow `{ success, data, error, message }`
```# Banking System Mock API