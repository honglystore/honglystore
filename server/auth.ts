import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { db } from './db.js';
import { User, RoleName } from './types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'nexus_store_super_secure_jwt_secret_key_2026';

export interface AuthRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function hashPassword(plainText: string): string {
  return bcrypt.hashSync(plainText, 10);
}

export function comparePassword(plainText: string, hashed: string): boolean {
  return bcrypt.compareSync(plainText, hashed);
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. Authentication token is missing.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const database = db.getDb();
    const user = database.users.find(u => u.id === decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'User no longer exists.' });
    }

    if (user.status === 'disabled') {
      return res.status(403).json({ error: 'Your account has been deactivated. Please contact an administrator.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }
}

export function requireRole(...allowedRoles: RoleName[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthenticated user.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Permission denied. Required role: [${allowedRoles.join(', ')}]. Current role: ${req.user.role}.`,
      });
    }

    next();
  };
}

export function requirePermission(permissionCode: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthenticated user.' });
    }

    // Super Admin has all privileges
    if (req.user.role === 'Super Admin') {
      return next();
    }

    const database = db.getDb();
    const userRole = database.roles.find(r => r.name === req.user?.role);
    if (!userRole || !userRole.permissions.includes(permissionCode)) {
      return res.status(403).json({
        error: `Forbidden. Missing permission: ${permissionCode}`,
      });
    }

    next();
  };
}
