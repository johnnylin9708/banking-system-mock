import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bankingRoutes from './routes/bankingRoutes';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import jwt from 'jsonwebtoken';
import winston from 'winston';

const app = express();

// Winston logger setting
export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
  ],
});

// Swagger UI and OpenAPI docs (should be public)
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    servers: [
      { url: '/api' }
    ],
    info: {
      title: 'Banking System API',
      version: '1.0.0',
      description: 'API documentation for the Banking System',
    },
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token in the format: Bearer <token>',
        },
      },
    },
    security: [
      { BearerAuth: [] }
    ],
  },
  apis: ['dist/routes/*.js'],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Logger middleware
app.use((req, res, next) => {
  res.on('finish', () => {
    logger.info({
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      ip: req.ip,
    });
  });
  next();
});

// Body parser
app.use(express.json());

// Security middleware
app.use(helmet());
app.use(rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
}));

// JWT middleware for /api
app.use('/api', (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false,
      data: null,
      error: 'Missing token',
      message: 'Unauthorized: Missing token'
    });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string);
    (req as any).user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ 
      success: false,
      data: null,
      error: 'Invalid token',
      message: 'Unauthorized: Invalid token'
    });
  }
}, bankingRoutes);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    error: 'Not Found',
    message: 'The requested resource was not found'
  });
});

// 500 handler for unexpected errors
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error({ error: err.message, stack: err.stack });
  res.status(500).json({
    success: false,
    data: null,
    error: 'Internal Server Error',
    message: err.message || 'Unexpected error'
  });
});


export default app;
