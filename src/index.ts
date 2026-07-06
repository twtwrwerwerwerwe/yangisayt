import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import * as dotenv from "dotenv";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.routes";
import heroSlidesRoutes from "./routes/heroSlides.routes";
import routeRoutes from "./routes/routes.routes";
import driverRoutes from "./routes/drivers.routes";
import applicationRoutes from "./routes/applications.routes";
import orderRoutes from "./routes/orders.routes";
import promotionRoutes from "./routes/promotions.routes";
import notificationRoutes from "./routes/notifications.routes";
import statsRoutes from "./routes/stats.routes";
import { notFound, errorHandler } from "./middleware/errorHandler";
import prisma from "./utils/prisma";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);
// CLIENT_URL can be a single origin or a comma-separated list, e.g.:
// CLIENT_URL=http://localhost:5173,https://your-app.netlify.app
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser requests (curl, server-to-server, Postman) which send no Origin header
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      console.warn(`[CORS] Blocked request from unlisted origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "comfort-taxi-api" }));

app.use("/api/auth", authRoutes);
app.use("/api/hero-slides", heroSlidesRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/promotions", promotionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/stats", statsRoutes);

app.use(notFound);
app.use(errorHandler);

async function warmUpDatabase(retries = 5, delayMs = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await prisma.$connect();
      console.log("Ma'lumotlar bazasi bilan aloqa o'rnatildi.");
      return;
    } catch (err) {
      console.warn(
        `Ma'lumotlar bazasiga ulanishda xatolik (urinish ${attempt}/${retries}):`,
        (err as Error).message
      );
      if (attempt < retries) await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  console.warn(
    "Ma'lumotlar bazasiga ulanib bo'lmadi — server baribir ishga tushadi, lekin so'rovlar xato qaytarishi mumkin."
  );
}

warmUpDatabase().finally(() => {
  const server = app.listen(PORT, () => {
    console.log(`Comfort Taxi API http://localhost:${PORT}`);
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `\n❌ ${PORT}-port band. Ehtimol, avvalgi "npm run dev" jarayoni hali ham ishlab turibdi.\n` +
          `Windows'da tuzatish:\n` +
          `   netstat -ano | findstr :${PORT}\n` +
          `   taskkill /PID <topilgan_raqam> /F\n` +
          `Mac/Linux'da tuzatish:\n` +
          `   lsof -i :${PORT}\n` +
          `   kill -9 <topilgan_raqam>\n` +
          `Shundan keyin "npm run dev" ni qaytadan ishga tushiring.\n`
      );
      process.exit(1);
    } else {
      console.error("Server xatoligi:", err);
      process.exit(1);
    }
  });
});
