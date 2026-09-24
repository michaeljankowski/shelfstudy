import type { NextFunction, Request, Response } from 'express';
import { supabase } from '../config/supabase.js';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authorization = req.header('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return res.status(401).json({ error: 'Invalid or expired session' });

  req.userId = data.user.id;
  next();
}

export function authenticatedUserId(req: Request): string {
  if (!req.userId) throw new Error('Authenticated user is missing from request');
  return req.userId;
}
