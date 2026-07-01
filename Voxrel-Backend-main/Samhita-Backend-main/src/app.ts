import { globalErrorHandler } from '@/middleware/errorHandler.middleware.js';
import v1Router from '@/routes/index.route.js';
import '@/types/express.types.js';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';

const app: Application = express();

// Disable ETag generation to prevent 304 responses during development
app.set('etag', false);

// CORS configuration
const allowedOrigins = [
  'https://samhita-freelancer.kreativsaiapps.workers.dev',
  'http://samhita-freelancer.kreativsaiapps.workers.dev',
  'https://samhita-admin.kreativsaiapps.workers.dev',
  'http://samhita-admin.kreativsaiapps.workers.dev',
  'https://samhita-superadmin.kreativsaiapps.workers.dev',
  'http://samhita-superadmin.kreativsaiapps.workers.dev',
  'https://kreactive-freelancer.entraiotsolutions.workers.dev',
  'http://kreactive-freelancer.entraiotsolutions.workers.dev',
  'https://samhita-superadmin.entraiotsolutions.workers.dev',
  'http://samhita-superadmin.entraiotsolutions.workers.dev',
  'https://samhita-admin.entraiotsolutions.workers.dev',
  'http://samhita-admin.entraiotsolutions.workers.dev',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Core Middleware - Body parsing for JSON
app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// API Routes
app.use('/api/v1', v1Router);

// 404 Handler for undefined routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    statusCode: 404,
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Global Error Handler
app.use(globalErrorHandler);

export default app;
