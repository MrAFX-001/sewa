import type { NextFunction, Request, Response } from "express";

type AsyncFn = (req: Request, res: Response) => Promise<unknown>;

// Express doesn't auto-catch rejected promises from async route handlers -
// without this, a thrown error in an async controller would hang the
// request instead of reaching errorHandler.
export function asyncHandler(fn: AsyncFn) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch(next);
  };
}
