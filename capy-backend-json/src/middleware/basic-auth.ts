import type { NextFunction, Request, Response } from "express";
import { CONFIG } from "../config.js";

declare global {
  namespace Express {
    interface Request {
      authUser?: {
        username: string;
      };
    }
  }
}

function unauthorized(res: Response) {
  res.setHeader("WWW-Authenticate", 'Basic realm="capy-api"');
  return res.status(401).json({ message: "Unauthorized" });
}

function parseAuthorizationHeader(headerValue?: string) {
  if (!headerValue) return null;
  const [scheme, token] = headerValue.split(" ");
  if (!scheme || !token || scheme.toLowerCase() !== "basic") return null;
  try {
    const decoded = Buffer.from(token, "base64").toString("utf8");
    const separator = decoded.indexOf(":");
    if (separator < 0) return null;
    const username = decoded.slice(0, separator);
    const password = decoded.slice(separator + 1);
    if (!username || !password) return null;
    return { username, password };
  } catch {
    return null;
  }
}

export function basicAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const credentials = parseAuthorizationHeader(req.header("authorization"));
  if (!credentials) {
    return unauthorized(res);
  }

  const expectedPassword = CONFIG.basicUsers.get(credentials.username);
  if (!expectedPassword || expectedPassword !== credentials.password) {
    return unauthorized(res);
  }

  req.authUser = { username: credentials.username };
  return next();
}
