import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import routes from "./routes";

dotenv.config();

export function createApp() {
  const app = express();

  const corsOptions = {
    origin: process.env.CORS_ORIGIN || process.env.NEXT_PUBLIC_APP_ORIGIN || "http://localhost:3000",
    credentials: true,
  };
  app.use(cors(corsOptions));
  app.use(express.json());

  const MONGO_URI = process.env.MONGO_URI;

  if (!MONGO_URI) {
    console.error("❌ MONGO_URI environment variable is required");
  } else {
    mongoose
      .connect(MONGO_URI)
      .then(() => console.log("✅ MongoDB connected successfully"))
      .catch((error) => {
        console.error("❌ MongoDB connection failed:", error);
        console.log("⚠️ Server will continue without database connection");
      });
  }

  app.get("/health", (req, res) => {
    res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      database:
        mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    });
  });

  app.use("/api", routes);

  return app;
}

if (require.main === module) {
  const app = createApp();
  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    console.log(`🚀 AyurSutra Backend API running on port ${port}`);
    console.log(`📊 Health check: http://localhost:${port}/health`);
    console.log(`🔗 API Base URL: http://localhost:${port}/api`);
  });
}
