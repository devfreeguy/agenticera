"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load .env.local from the project root (two levels up from wdk-service/src/)
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, "../../.env.local") });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const wallet_1 = require("./routes/wallet");
const auth_1 = require("./middleware/auth");
const app = (0, express_1.default)();
const PORT = process.env.WDK_SERVICE_PORT ?? 3001;
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: /^http:\/\/localhost/,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "x-wdk-service-secret"],
}));
// Request logger
app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});
// Auth on all routes
app.use(auth_1.authMiddleware);
app.use("/wallet", wallet_1.walletRouter);
app.listen(PORT, () => {
    console.log(`WDK microservice running on http://localhost:${PORT}`);
});
