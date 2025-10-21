import express from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import { generateToken } from '../middleware/auth';
import { validateBody, loginSchema } from '../utils/validation';

const router = express.Router();

// POST /auth/login - User login
router.post('/login', validateBody(loginSchema), async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Update last login time
    await prisma.user.update({
      where: { id: user.id },
      data: { last_login_at: new Date() }
    });

    // Generate JWT token
    const token = generateToken(user.id);

    // Return user info and token (excluding password hash)
    const userResponse = {
      id: user.id,
      username: user.username,
      user_type: user.user_type,
      created_at: user.created_at,
      last_login_at: user.last_login_at
    };

    res.json({
      message: 'Login successful',
      user: userResponse,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
