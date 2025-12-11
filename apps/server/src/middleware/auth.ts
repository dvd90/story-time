import { clerkMiddleware, getAuth, requireAuth } from '@clerk/express';
import type { Request, Response, NextFunction } from 'express';

// Initialize Clerk middleware - validates session tokens
export const clerkAuth = clerkMiddleware();

// Require authentication - returns 401 if not authenticated
export const requireAuthentication = requireAuth();

// Optional authentication - allows unauthenticated requests but adds auth info if present
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  // Auth info is automatically added by clerkMiddleware
  next();
};

// Helper to get user ID from request
export function getUserId(req: Request): string | null {
  const auth = getAuth(req);
  return auth.userId;
}

// Helper to get full auth object
export function getAuthInfo(req: Request) {
  return getAuth(req);
}

// Custom middleware to check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  const auth = getAuth(req);
  
  if (!auth.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'You must be signed in to access this resource',
    });
    return;
  }
  
  next();
}

