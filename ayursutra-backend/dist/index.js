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
  process.exit(1);
}
mongoose_1.default
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((error) => {
    console.error("❌ MongoDB connection failed:", error);
    console.log("⚠️ Server will continue without database connection");
  });
// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    database:
      mongoose_1.default.connection.readyState === 1
        ? "connected"
        : "disconnected",
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
