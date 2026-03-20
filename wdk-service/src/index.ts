import path from "path";
import dotenv from "dotenv";

// Load .env from the project root (two levels up from wdk-service/src/)
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import express from "express";
import cors from "cors";
import { walletRouter } from "./routes/wallet";
import { authMiddleware } from "./middleware/auth";

const app = express();
const PORT = process.env.WDK_SERVICE_PORT ?? 3001;

app.use(express.json());

const allowedOrigin = process.env.ALLOWED_ORIGIN ?? /^http:\/\/localhost/;

app.use(
  cors({
    origin: allowedOrigin,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "x-wdk-service-secret"],
  })
);

// Request logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Auth on all routes
app.use(authMiddleware);

app.use("/wallet", walletRouter);

app.listen(PORT, () => {
  console.log(`WDK microservice running on http://localhost:${PORT}`);
});
