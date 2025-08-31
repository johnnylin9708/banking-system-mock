// Load OpenAPI YAML
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bankingRoutes from './routes/bankingRoutes';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
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
const swaggerDocument = YAML.load('./openapi.yaml');
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

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
      error: 'Unauthorized',
      message: 'Missing token'
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
      error: 'Unauthorized',
      message: 'Invalid token'
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
