import { startServer } from './src/server.js';

startServer().catch((err) => {
  console.error('Failed to start server from index.js:', err);
  process.exit(1);
});
