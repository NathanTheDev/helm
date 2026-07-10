import type { NextFunction, Request, Response } from "express";

export const DEFAULT_USER_ID = "default-user";

declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

export function currentUser(req: Request, _res: Response, next: NextFunction) {
  req.userId = DEFAULT_USER_ID;
  next();
}
