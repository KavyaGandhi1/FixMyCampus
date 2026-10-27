import mongoose from 'mongoose';

let mongoMemoryServer = null;

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    let mongoUri = (process.env.MONGODB_URI || process.env.dbURL || process.env.MONGO_URI || '').trim().replace(/^["']|["']$/g, '');

    if (mongoUri) {
      // Ensure database name and options are appended if URI ends with cluster root
      if (mongoUri.endsWith('.mongodb.net/') || mongoUri.endsWith('.mongodb.net')) {
        const separator = mongoUri.endsWith('/') ? '' : '/';
        mongoUri = `${mongoUri}${separator}fixmycampus?retryWrites=true&w=majority`;
      }
      // Ensure authSource=admin is included for MongoDB Atlas connections
      if (mongoUri.includes('mongodb+srv://') && !mongoUri.includes('authSource=')) {
        mongoUri += (mongoUri.includes('?') ? '&' : '?') + 'authSource=admin';
      }
    } else {
      console.log('ℹ️  No MONGODB_URI found. Initializing embedded in-memory MongoDB for local execution...');
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        mongoMemoryServer = await MongoMemoryServer.create({
          instance: {
            dbName: 'fixmycampus'
          }
        });
        mongoUri = mongoMemoryServer.getUri();
        console.log(`✅ Embedded in-memory MongoDB initialized at: ${mongoUri}`);
      } catch (err) {
        console.error('❌ Failed to start MongoMemoryServer:', err.message);
        throw err;
      }
    }

    const conn = await mongoose.connect(mongoUri);
    console.log(`🚀 MongoDB Connected: ${conn.connection.host} / ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`❌ Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export const closeDB = async () => {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
};
