import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';
import { config } from './config.js';

export const adminTokenLifetimeSeconds = 60 * 60 * 12;

function timingSafeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function isValidAdminPassword(password: string) {
  return timingSafeCompare(password, config.adminPassword);
}

export function issueAdminToken() {
  return jwt.sign({ role: 'admin' }, config.jwtSecret, {
    expiresIn: adminTokenLifetimeSeconds,
  });
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Missing admin token.' });
    return;
  }

  const token = authorization.slice('Bearer '.length);

  try {
    jwt.verify(token, config.jwtSecret);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired admin token.' });
  }
}
