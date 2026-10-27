import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: './server/.env' });

import app from '../server/src/server.js';
import { connectDB } from '../server/src/config/db.js';

let isSeeded = false;

/**
 * Serverless function entrypoint for Vercel
 * Handles MongoDB Atlas connection caching, auto-seeding on fresh clusters, and Express request dispatching.
 */
export default async function handler(req, res) {
  try {
    await connectDB();

    // Auto-seed initial admin/staff accounts on cold start if database is empty
    if (!isSeeded) {
      try {
        const { default: User } = await import('../server/src/models/User.js');
        const userCount = await User.countDocuments();
        if (userCount === 0) {
          console.log('Database empty, seeding default campus accounts...');
          const { seedData } = await import('../server/src/seeds/seed.js');
          await seedData();
        }
        isSeeded = true;
      } catch (seedErr) {
        console.warn('Vercel initial seed check notice:', seedErr.message);
      }
    }

    return app(req, res);
  } catch (error) {
    console.error('Vercel Serverless Handler Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to connect to MongoDB Atlas or process request on Vercel.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
