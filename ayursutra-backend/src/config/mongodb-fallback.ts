// MongoDB fallback configuration for Vercel deployment
// This provides alternative connection methods when direct connection fails

import mongoose from "mongoose";

export const MONGODB_CONFIG = {
  // Primary connection string (with fallback)
  uri:
    process.env.MONGO_URI ||
    "mongodb+srv://prince844121_db_user:.Chaman1@cluster0.yilecha.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",

  // Connection options optimized for Vercel
  options: {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    bufferCommands: false,
    retryWrites: true,
    w: "majority" as any,
    directConnection: false,
    retryReads: true,
    maxIdleTimeMS: 30000,
  },
};

export async function connectWithRetry(
  maxRetries = 3,
  delay = 2000
): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await mongoose.connect(MONGODB_CONFIG.uri, MONGODB_CONFIG.options);
      console.log("✅ MongoDB connected successfully");
      return true;
    } catch (error) {
      console.error(`❌ MongoDB connection attempt ${i + 1} failed:`, error);
      if (i < maxRetries - 1) {
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }
  return false;
}

export function getConnectionStatus() {
  const state = mongoose.connection.readyState;
  const status =
    state === 1
      ? "connected"
      : state === 2
      ? "connecting"
      : state === 3
      ? "disconnecting"
      : "disconnected";

  return {
    status,
    state,
    hasUri: !!MONGODB_CONFIG.uri,
    environment: process.env.NODE_ENV || "development",
  };
}
