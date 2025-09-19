import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { User } from '../models/User';

const router = Router();

// GET /setup-status
router.get('/setup-status', async (_req: Request, res: Response) => {
  const userCount = await User.countDocuments();
  res.json({ isSetupComplete: userCount > 0 });
});

// POST /setup
router.post('/setup', async (req: Request, res: Response) => {
  const userCount = await User.countDocuments();
  if (userCount > 0) {
    return res.status(403).json({ error: 'Setup already complete' });
  }

  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const hash = await bcrypt.hash(password, 10);

  const adminUser = await User.create({
    email,
    password: hash,
    role: 'admin'
  });

  res.json({
    message: 'Admin created successfully',
    user: { id: adminUser._id, email: adminUser.email }
  });
});

export default router;
