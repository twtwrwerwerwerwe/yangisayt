import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  admin?: { id: string; username: string };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Avtorizatsiya talab qilinadi" });
  }

  const token = header.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
      username: string;
    };
    req.admin = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token yaroqsiz yoki muddati tugagan" });
  }
}
