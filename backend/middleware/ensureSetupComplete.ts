import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';

export default async function ensureSetupComplete(req: Request, res: Response, next: NextFunction) {
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    return res.status(403).json({ error: 'Setup not complete. Please run setup first.' });
  }
  next();
}
