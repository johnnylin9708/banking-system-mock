# Banking System Mock API

A Node.js + TypeScript RESTful banking system with in-memory storage, JWT authentication, OpenAPI docs, and full test coverage.

---

## 專案架構

```
bankingSystemMock/
├── src/
│   ├── app.ts                # Express app 與中介層
│   ├── server.ts             # 啟動 server
│   ├── models/
│   │   └── Account.ts        # 型別定義
│   ├── routes/
│   │   └── bankingRoutes.ts  # 所有 API 路由
│   └── services/
│       └── BankingService.ts # 商業邏輯 (原子操作)
├── tests/
│   └── banking.test.ts       # Jest 單元與整合測試
├── postman/
│   └── Banking System Mock API.postman_collection.json # Postman collection
├── openapi.yaml              # OpenAPI 3.1 文件
├── Dockerfile                # Docker 部署設定
├── .dockerignore
├── package.json
└── README.md
```

---

## 功能說明

- **帳戶管理**
  - 建立帳戶（不可重複名稱，餘額不可為負）
  - 查詢所有帳戶
  - 依 ID 查詢帳戶

- **交易操作**
  - 存款（不可負數）
  - 提款（餘額不可為負）
  - 轉帳（原子操作，不能自轉，餘額不可為負）

- **交易紀錄**
  - 查詢單一帳戶所有交易紀錄
  - 查詢所有交易紀錄

- **API 文件**
  - [Swagger UI](http://localhost:9999/docs)（自動帶 JWT 權杖）

- **驗證與安全**
  - JWT 驗證（所有 `/api` 路徑皆需 Bearer Token）
  - Helmet, rate-limit, 統一錯誤格式

- **測試**
  - Jest 單元與整合測試，覆蓋所有 edge case

- **Docker 支援**
  - 一鍵 build/run，無需本地安裝 Node/npm

---

## 快速開始

### 1. 安裝依賴

```sh
npm install
```

### 2. 設定環境變數

建立 `.env` 檔案（或直接用環境變數）：

```
JWT_SECRET=6b2e1f9c-8a3d-4d7e-9c2a-7f1b2e3c4d5e
```

> **備註：本專案為測試用途，JWT_SECRET 僅為範例值。正式專案會放在雲端部署平台的環境變數或是Secret Manager裡面管理密鑰**

### 3. 啟動開發伺服器

```sh
npm run dev
```

### 4. 執行測試

```sh
npm test
npm run test:coverage
```

---

## Docker 部署

### Build & Run

```sh
docker build -t banking-system-mock .
docker run -p 9999:9999 --env JWT_SECRET=6b2e1f9c-8a3d-4d7e-9c2a-7f1b2e3c4d5e banking-system-mock
```
> **備註：本專案為測試用途，JWT_SECRET 僅為範例值。正式專案會放在雲端部署平台的環境變數或是Secret Manager裡面管理密鑰**

### 或用 docker-compose

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

## API 文件

- Swagger UI: [http://localhost:9999/docs](http://localhost:9999/docs)
- OpenAPI YAML: [`openapi.yaml`](openapi.yaml)

---

## Postman 測試

1. 匯入 `postman/Banking System Mock API.postman_collection.json`
2. 設定 `baseUrl` 變數為 `http://localhost:9999`
3. 設定 Bearer Token（預設 collection 已有測試用 token）

---

## 主要 API 範例

- `POST /api/accounts` 建立帳戶
- `GET /api/accounts` 查詢所有帳戶
- `GET /api/accounts/:id` 查詢單一帳戶
- `POST /api/accounts/:id/deposit` 存款
- `POST /api/accounts/:id/withdraw` 提款
- `POST /api/accounts/transfer` 轉帳
- `GET /api/accounts/:id/transactions` 查詢帳戶交易紀錄
- `GET /api/transactions` 查詢所有交易紀錄

---

## 注意事項

- 所有資料皆為 in-memory，重啟即清空。
- 所有 API 回傳格式皆為 `{ success, data, error, message }`