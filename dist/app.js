"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const bankingRoutes_1 = __importDefault(require("./routes/bankingRoutes"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const app = (0, express_1.default)();
// Swagger UI and OpenAPI docs (should be public)
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Banking System API',
            version: '1.0.0',
            description: 'API documentation for the Banking System',
        },
    },
    apis: ['dist/routes/*.js'],
};
const swaggerSpec = (0, swagger_jsdoc_1.default)(swaggerOptions);
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerSpec));
// Security middleware
app.use((0, helmet_1.default)());
app.use((0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // limit each IP to 100 requests per windowMs
}));
app.use(express_1.default.json());
// API Key middleware only for /api
app.use('/api', (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== process.env.API_KEY) {
        return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
    }
    next();
}, bankingRoutes_1.default);
exports.default = app;
