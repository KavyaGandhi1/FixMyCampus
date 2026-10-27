import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { connectDB } from './config/db.js';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import issueRoutes from './routes/issueRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import userRoutes from './routes/userRoutes.js';
import adminStaffRoutes from './routes/adminStaffRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS with dynamic local and production support
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman, server-to-server)
      if (!origin) return callback(null, true);

      // Check explicit allowed origins or any vercel.app preview domain
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin/staff', adminStaffRoutes);

// Direct mounts if /api prefix is stripped by proxy/rewrites
app.use('/health', healthRoutes);
app.use('/auth', authRoutes);
app.use('/issues', issueRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/users', userRoutes);
app.use('/admin/staff', adminStaffRoutes);

// 404 and Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

let server;

export const startServer = async () => {
  await connectDB();
  try {
    const { default: User } = await import('./models/User.js');
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('Database empty, seeding default campus accounts...');
      const { seedData } = await import('./seeds/seed.js');
      await seedData();
    }
  } catch (seedErr) {
    console.error('Auto-seed check notice:', seedErr.message);
  }

  return new Promise((resolve) => {
    server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n==================================================`);
      console.log(`⚡ FixMyCampus Server running on port ${PORT}`);
      console.log(`   Health:    http://localhost:${PORT}/api/health`);
      console.log(`   Mode:      ${process.env.NODE_ENV || 'development'}`);
      console.log(`==================================================\n`);
      resolve(server);
    });
  });
};

const isRunningDirectly =
  !process.env.VERCEL &&
  (process.argv[1]?.endsWith('server.js') ||
   (process.argv[1]?.endsWith('index.js') && !process.argv[1]?.replace(/\\/g, '/').includes('/api/index.js')));

if (isRunningDirectly) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

export { app };
export default app;
