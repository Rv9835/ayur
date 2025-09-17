import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import routes from "./routes";

dotenv.config();

export function createApp() {
  const app = express();

  const allowedOrigins = [
    // Primary origins from env (comma-separated supported)
    ...(process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
      : []),
    ...(process.env.NEXT_PUBLIC_APP_ORIGIN
      ? [process.env.NEXT_PUBLIC_APP_ORIGIN]
      : []),
    // Production frontend (hyphen version is valid on Vercel; underscore kept just in case it's used somewhere internally)
    "https://ayursutra-panchakarma.vercel.app",
    "https://ayursutra_panchakarma.vercel.app",
    // Local development
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ];

  const corsOptions: cors.CorsOptions = {
    credentials: true,
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
  };
  app.use(cors(corsOptions));
  // Express v5: use regex for catch-all preflight handling
  app.options(/.*/, cors(corsOptions));
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

  // Alias: /api/health for convenience in some clients
  app.get("/api/health", (req, res) => {
    res.redirect(302, "/health");
  });

  // Root route to indicate backend is online and point to health
  app.get("/", (req, res) => {
    const portInfo = process.env.VERCEL
      ? "serverless"
      : `port ${process.env.PORT || 4000}`;
    res
      .type("text/plain")
      .send(
        `AyurSutra Backend is online (${portInfo}).\n` +
          `Health: /health\n` +
          `API Base: /api\n`
      );
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
