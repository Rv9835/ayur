"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const routes_1 = __importDefault(require("./routes"));
dotenv_1.default.config();
function createApp() {
  const app = (0, express_1.default)();
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
  const corsOptions = {
    credentials: true,
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
  };
  app.use((0, cors_1.default)(corsOptions));
  // Express v5: use regex for catch-all preflight handling
  app.options(/.*/, (0, cors_1.default)(corsOptions));
  app.use(express_1.default.json());
  const resolvedMongoUri =
    process.env.MONGO_URI ||
    "mongodb+srv://prince844121_db_user:chaman1@cluster0.yilecha.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
  // Track last connection error for diagnostics
  let lastMongoError = null;
  // Debug logging for MongoDB connection
  console.log("🔍 MongoDB Connection Debug Info:");
  console.log("📍 Environment:", process.env.NODE_ENV || "development");
  console.log("🌐 Platform:", process.env.VERCEL ? "Vercel" : "Local");
  console.log("🔗 MONGO_URI from env:", !!process.env.MONGO_URI);
  console.log("📝 Resolved URI:", resolvedMongoUri ? "✅ Set" : "❌ Empty");
  if (resolvedMongoUri) {
    try {
      const uri = new URL(
        resolvedMongoUri
          .replace("mongodb+srv://", "https://")
          .replace("mongodb://", "http://")
      );
      console.log("🏠 MongoDB Host:", uri.hostname);
      console.log("🔌 MongoDB Port:", uri.port || "default");
    } catch (e) {
      console.log("⚠️ Could not parse MongoDB URI for host info");
    }
  }
  if (!resolvedMongoUri) {
    console.error("❌ MONGO_URI environment variable is required");
  } else {
    // Set up connection event listeners
    mongoose_1.default.connection.on("connected", () => {
      console.log("✅ MongoDB connected successfully");
      console.log(
        "📊 Connection State:",
        mongoose_1.default.connection.readyState
      );
      console.log(
        "🏠 Connected to:",
        mongoose_1.default.connection.host,
        ":",
        mongoose_1.default.connection.port
      );
      console.log("🗄️ Database:", mongoose_1.default.connection.name);
      lastMongoError = null;
    });
    mongoose_1.default.connection.on("error", (error) => {
      console.error("❌ MongoDB connection error:", error);
      console.error("🔍 Error details:", {
        name: error?.name,
        message: error?.message,
        code: error?.code,
        codeName: error?.codeName,
        reason: error?.reason,
      });
      try {
        lastMongoError = error?.message || String(error);
      } catch {
        lastMongoError = "Unknown MongoDB error";
      }
    });
    mongoose_1.default.connection.on("disconnected", () => {
      console.log("⚠️ MongoDB disconnected");
      console.log(
        "📊 Connection State:",
        mongoose_1.default.connection.readyState
      );
    });
    mongoose_1.default.connection.on("reconnected", () => {
      console.log("🔄 MongoDB reconnected");
      console.log(
        "📊 Connection State:",
        mongoose_1.default.connection.readyState
      );
    });
    // Attempt connection with retry
    console.log("🚀 Attempting MongoDB connection...");
    console.log("⚙️ Connection options:", {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      retryWrites: true,
      w: "majority",
      directConnection: false,
      retryReads: true,
      maxIdleTimeMS: 30000,
    });
    mongoose_1.default
      .connect(resolvedMongoUri, {
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
      })
      .then(() => {
        console.log("✅ MongoDB connection established");
        console.log(
          "📊 Final Connection State:",
          mongoose_1.default.connection.readyState
        );
        console.log("🏠 Final Host:", mongoose_1.default.connection.host);
        console.log("🗄️ Final Database:", mongoose_1.default.connection.name);
      })
      .catch((error) => {
        console.error("❌ MongoDB connection failed:", error);
        console.error("🔍 Connection failure details:", {
          name: error?.name,
          message: error?.message,
          code: error?.code,
          codeName: error?.codeName,
          reason: error?.reason,
          stack: error?.stack,
        });
        try {
          lastMongoError = error?.message || String(error);
        } catch {
          lastMongoError = "Unknown MongoDB error";
        }
        console.log("⚠️ Server will continue without database connection");
        console.log(
          "📊 Current Connection State:",
          mongoose_1.default.connection.readyState
        );
        // Don't exit process, let server continue
      });
  }
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
    // Debug logging for health check
    console.log("🏥 Health check requested");
    console.log("📊 Current MongoDB State:", dbState, "(", dbStatus, ")");
    console.log(
      "🏠 MongoDB Host:",
      mongoose_1.default.connection.host || "unknown"
    );
    console.log(
      "🗄️ MongoDB Database:",
      mongoose_1.default.connection.name || "unknown"
    );
    console.log("🔗 Has MONGO_URI:", !!process.env.MONGO_URI);
    console.log("❌ Last Error:", lastMongoError || "none");
    const healthResponse = {
      status: "OK",
      timestamp: new Date().toISOString(),
      database: dbStatus,
      mongoState: dbState,
      environment: process.env.NODE_ENV || "development",
      hasMongoUri: !!process.env.MONGO_URI,
      mongoUriHost: (() => {
        try {
          const uri = new URL(
            resolvedMongoUri
              .replace("mongodb+srv://", "https://")
              .replace("mongodb://", "http://")
          );
          return uri.hostname || null;
        } catch {
          return null;
        }
      })(),
      lastMongoError,
      mongoHost: mongoose_1.default.connection.host || null,
      mongoDatabase: mongoose_1.default.connection.name || null,
      mongoPort: mongoose_1.default.connection.port || null,
    };
    console.log("📤 Health response:", JSON.stringify(healthResponse, null, 2));
    res.json(healthResponse);
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
  app.use("/api", routes_1.default);
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
//# sourceMappingURL=index.js.map
