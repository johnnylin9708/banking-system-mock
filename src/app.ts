import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bankingRoutes from './routes/bankingRoutes';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const app = express();

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
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Security middleware
app.use(helmet());
app.use(rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
}));
app.use(express.json());

// API Key middleware only for /api
app.use('/api', (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
  }
  next();
}, bankingRoutes);

export default app;
