"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const routes_1 = __importDefault(require("./routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// CORS configuration (allowlist + preflight)
const allowedOrigins = [
  ...(process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
    : []),
  ...(process.env.NEXT_PUBLIC_APP_ORIGIN
    ? [process.env.NEXT_PUBLIC_APP_ORIGIN]
    : []),
  "https://ayursutra-panchakarma.vercel.app",
  "https://ayursutra_panchakarma.vercel.app",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];
const corsOptions = {
  credentials: true,
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
};
app.use((0, cors_1.default)(corsOptions));
app.options(/.*/, (0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
// MongoDB connection
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌ MONGO_URI environment variable is required");
} else {
  // Set up connection event listeners
  mongoose_1.default.connection.on("connected", () => {
    console.log("✅ MongoDB connected successfully");
  });

  mongoose_1.default.connection.on("error", (error) => {
    console.error("❌ MongoDB connection error:", error);
  });

  mongoose_1.default.connection.on("disconnected", () => {
    console.log("⚠️ MongoDB disconnected");
  });

  // Attempt connection with retry
  mongoose_1.default
    .connect(MONGO_URI, {
      // Add connection options for better reliability
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      // Add retry logic
      retryWrites: true,
      w: "majority",
      // Add serverless-specific options
      directConnection: false,
      retryReads: true,
      // For Vercel/serverless environments
      maxIdleTimeMS: 30000,
      serverSelectionRetryDelayMS: 2000,
    })
    .then(() => console.log("✅ MongoDB connection established"))
    .catch((error) => {
      console.error("❌ MongoDB connection failed:", error);
      console.log("⚠️ Server will continue without database connection");
      // Don't exit process, let server continue
    });
}
// Health check endpoint
app.get("/health", (req, res) => {
  const dbState = mongoose_1.default.connection.readyState;
  const dbStatus =
    dbState === 1
      ? "connected"
      : dbState === 2
      ? "connecting"
      : dbState === 3
      ? "disconnecting"
      : "disconnected";

  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    database: dbStatus,
    mongoState: dbState,
    environment: process.env.NODE_ENV || "development",
    hasMongoUri: !!process.env.MONGO_URI,
  });
});
// Alias and root endpoint for online status
app.get("/api/health", (req, res) => {
  res.redirect(302, "/health");
});
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
app.use("/api", routes_1.default);
const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`🚀 AyurSutra Backend API running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🔗 API Base URL: http://localhost:${port}/api`);
});
//# sourceMappingURL=index.js.map
