import mongoose from 'mongoose';

let mongoMemoryServer = null;

export const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
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
