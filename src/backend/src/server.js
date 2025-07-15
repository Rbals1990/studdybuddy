// backend/src/server.js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { testConnection } from "./config/database.js";

// Import routes
import authRoutes from "./routes/auth.js";
import questionRoutes from "./routes/questions.js";
import uploadRoutes from "./routes/upload.js";
import contactRoutes from "./routes/contact.js";

// Load .env variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ========================================
// MIDDLEWARE SETUP
// ========================================

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuten
  max: 100, // max 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
});
app.use(limiter);

// CORS configuration - VERBETERD
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:3000",
  "https://studdy-buddy.netlify.app",
].filter(Boolean); // Remove undefined values

console.log("Allowed CORS origins:", allowedOrigins);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error(`Not allowed by CORS policy. Origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Explicit preflight handler
app.options("*", cors(corsOptions));

// Debug middleware (tijdelijk voor troubleshooting)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log(`Origin: ${req.headers.origin || "No origin"}`);
  console.log(`User-Agent: ${req.headers["user-agent"] || "No user-agent"}`);
  next();
});

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static files voor uploads
app.use("/uploads", express.static("uploads"));

// ========================================
// ROUTES
// ========================================

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    allowedOrigins: allowedOrigins,
  });
});

// CORS test endpoint
app.get("/api/test-cors", (req, res) => {
  res.json({
    message: "CORS is working!",
    origin: req.headers.origin,
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/contact", contactRoutes);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
    method: req.method,
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("Global error handler:", error);

  // CORS error specifiek afhandelen
  if (error.message.includes("Not allowed by CORS")) {
    return res.status(403).json({
      error: "CORS policy violation",
      message: error.message,
      origin: req.headers.origin,
    });
  }

  res.status(error.status || 500).json({
    error:
      process.env.NODE_ENV === "development"
        ? error.message
        : "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
});

// ========================================
// SERVER STARTUP
// ========================================

const startServer = async () => {
  try {
    // Test database connectie
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error("Failed to connect to database. Exiting...");
      process.exit(1);
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 StuddyBuddy API running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🌐 CORS enabled for origins:`, allowedOrigins);
      console.log(`🔑 JWT Secret configured: ${!!process.env.JWT_SECRET}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down gracefully...");
  process.exit(0);
});

startServer();
