import { Request, Response, NextFunction } from "express";

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const secret = req.headers["x-wdk-service-secret"];
  if (!secret || secret !== process.env.WDK_SERVICE_SECRET) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}
