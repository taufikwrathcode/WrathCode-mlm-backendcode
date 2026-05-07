import mongoose from "mongoose";
import os from "os";
import { initSocket } from "./Utils/soket.js";
import http from "http";
import cors from "cors";
import { connectdb } from "./config/db.js";
import { startROICron } from "./Cron_jon.js";
import dotenv from "dotenv";
dotenv.config();
import express from "express";
import { AdminRouter } from "./Router/Adminrouter.js";
import { AdminDashboardRouter } from "./Router/admindashbordrouter.js";
import { UserRegisterRouter } from "./Router/UserRouter.js";
import { UserDashboardRouter } from "./Router/userDashbordrouter.js";
import { CurrencyRouter } from "./Router/currancy.js";
import { NotificationRouter } from "./Router/notificationRouter.js";
import { PlansRouter } from "./Router/plansRouter.js";
import { KYCrouter } from "./Router/KYCrouter.js";
import { InvestmentRouter } from "./Router/Invesmentrouter.js";
import { depositrouter } from "./Router/depositrouter.js";
import { Withdrawalrouter } from "./Router/Withdrawalrouter.js";
import { profilerouter } from "./Router/userProfilerouter.js";
import { ReportRouter } from "./Router/reportrouter.js";
import { TicketRouter } from "./Router/TicketRouter.js";

// Connect Database
connectdb()
startROICron();

const app = express();
const server = http.createServer(app);
const io = initSocket(server);
console.log("Socket.io initialized", io ? "Success" : "Failed");

// ==================== CORS CONFIG ====================
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:7002",
  "http://10.101.72.6:7002",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://192.168.1.9:3000",
  "https://unorbed-reva-cuddlesome.ngrok-free.dev",
  "https://unorbed-reva-cuddlesome.ngrok-free.dev",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (process.env.NODE_ENV !== "production") return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(" CORS Blocked:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "ngrok-skip-browser-warning",
  ],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  credentials: true,
  maxAge: 86400,
  optionsSuccessStatus: 200,
};

// Apply CORS middleware FIRST
app.use(cors(corsOptions));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ==================== LOGGING MIDDLEWARE ====================
app.use((req, res, next) => {
  const start = Date.now();
  if (req.method === "OPTIONS") {
    console.log(
      ` OPTIONS: ${req.url} | Origin: ${req.headers.origin || "none"}`,
    );
  }
  if (req.method !== "OPTIONS") {
    console.log(`\n ${req.method} ${req.url}`);
    if (req.headers.origin) console.log(`   Origin: ${req.headers.origin}`);
    if (req.headers.authorization)
      console.log(`   Auth: ${req.headers.authorization?.slice(0, 40)}...`);
  }
  const originalSend = res.send;
  res.send = function (body) {
    if (req.method !== "OPTIONS") {
      console.log(`${res.statusCode} | ${Date.now() - start}ms`);
    }
    originalSend.call(this, body);
  };
  next();
});

// ==================== ROUTES ====================
app.use("/api/admin", AdminRouter);
app.use("/api/admin/dashboard", AdminDashboardRouter);
app.use("/api/auth", UserRegisterRouter);
app.use("/api/dashboard", UserDashboardRouter);
app.use("/api/currency", CurrencyRouter);
app.use("/api/notification", NotificationRouter);
app.use("/api/plans", PlansRouter);
app.use("/api/kyc", KYCrouter);
app.use("/api/investment", InvestmentRouter);
app.use("/api/deposit", depositrouter);
app.use("/api/profile", profilerouter);
app.use("/api/withdrawal", Withdrawalrouter);
app.use("/api/report", ReportRouter);
app.use("/api/ticket", TicketRouter);

// ==================== HEALTH ENDPOINTS ====================
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "API Running",
    cors: "enabled",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/test-cors", (req, res) => {
  res.json({
    message: "CORS OK",
    origin: req.headers.origin,
    timestamp: new Date().toISOString(),
  });
});

app.get("/favicon.ico", (req, res) => res.status(204).send());

// ==================== ERROR HANDLERS (with CORS headers) ====================
app.use((req, res) => {
  console.log(` 404: ${req.method} ${req.url}`);
  // Ensure CORS headers on 404 responses
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else if (process.env.NODE_ENV !== "production") {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type,Authorization,X-Requested-With,Accept",
  );

  res
    .status(404)
    .json({ error: "Route not found", path: req.url, method: req.method });
});

app.use((err, req, res, next) => {
  console.error(" Error:", err.message);
  // Ensure CORS headers on error responses
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else if (process.env.NODE_ENV !== "production") {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type,Authorization,X-Requested-With,Accept",
  );

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ error: "CORS blocked", allowedOrigins });
  }
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === "production" ? "Server error" : err.message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
});

// ==================== START SERVER ====================
const Port = process.env.PORT || 3031;
 app.listen(Port, "0.0.0.0", () => {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name in interfaces) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }

  console.log("CONNECTED DB NAME:", mongoose.connection.name);
  console.log(`Server running on port ${Port}`);
  console.log("Access backend using:");

  addresses.forEach((addr) => {
    console.log(`http://${addr}:${Port}`);
  });
});
// ===========================ngroksetup==========================================
//   console.log(
//     `\n Server started! Port: ${Port} | Env: ${process.env.NODE_ENV || "dev"} | CORS: ${process.env.NODE_ENV !== "production" ? "🟢 Open" : "🔴 Restricted"}`,
//   );
//   console.log(` Ngrok: https://unorbed-reva-cuddlesome.ngrok-free.dev`);
// });

// // Graceful shutdown
// process.on("SIGINT", async () => {
//   console.log("\nShutting down gracefully...");
//   try {
//     // Close HTTP server
//     server.close(async () => {
//       // Close MongoDB connection
//       if (mongoose.connection.readyState === 1) {
//         await mongoose.connection.close();
//         console.log("🔌 Database connection closed");
//       }
//       console.log("Shutdown complete");
//       process.exit(0);
//     });
//   } catch (error) {
//     console.error(" Shutdown error:", error.message);
//     process.exit(1);
//   }
// });

// // Handle unhandled rejections
// process.on("unhandledRejection", (err) => {
//   console.error(" Unhandled Rejection:", err);
//   if (process.env.NODE_ENV === "production") {
//     server.close(() => process.exit(1));
//   }
// });
