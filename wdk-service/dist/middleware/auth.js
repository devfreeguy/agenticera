"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
function authMiddleware(req, res, next) {
    const secret = req.headers["x-wdk-service-secret"];
    if (!secret || secret !== process.env.WDK_SERVICE_SECRET) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    next();
}
