# Banking System Mock

A simple Node.js + TypeScript RESTful banking system with in-memory storage, atomic transactions, and transaction logs.

## Features
- Create account (name, balance)
- Deposit, withdraw, transfer (no negative balances)
- Transaction logs for transfers
- Atomic transactions
- RESTful API (Express)
- In-memory storage (no DB)
- Unit & integration tests (Jest)
- Docker container support

## Development

```sh
npm install
npm run dev
```

## Build & Run

```sh
npm run build
npm start
```

## Test

```sh
npm test
```

## Docker

```sh
docker build -t banking-system .
docker run -p 3000:3000 banking-system
```

API will be available at `http://localhost:3000`.
