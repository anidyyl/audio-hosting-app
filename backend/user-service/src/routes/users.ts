import express from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { validateBody, createUserSchema, updateUserPasswordSchema, updateUserByAdminSchema } from '../utils/validation';
import { UserType } from '@prisma/client';
import Joi from 'joi';

const router = express.Router();

// Dynamic validation middleware for user updates
const validateUserUpdate = (req: any, res: any, next: any) => {
  // This middleware runs after authenticateToken, so req.user should be available
  const userId = parseInt(req.params.id);
  const isUpdatingSelf = req.user && req.user.id === userId;
  const isAdmin = req.user && req.user.user_type === UserType.ADMIN;

  // Choose schema based on context:
  // - User updating themselves: always use password schema (current_password + new_password)
  // - Admin updating another user: use admin update schema (optional password + user_type)
  // - Admin updating themselves: use password schema (same as regular users)
  let schema;
  if (isUpdatingSelf) {
    // User updating their own password
    schema = updateUserPasswordSchema;
  } else if (isAdmin) {
    // Admin updating another user
    schema = updateUserByAdminSchema;
  } else {
    // Non-admin trying to update someone else (shouldn't happen due to permission checks)
    schema = updateUserPasswordSchema;
  }

  const { error } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const errors = error.details.map((detail: any) => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

// GET /users - Get all users (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        user_type: true,
        created_at: true,
        updated_at: true,
        last_login_at: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    res.json({
      users,
      total: users.length
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /users - Create new user (admin only)
router.post('/', authenticateToken, requireAdmin, validateBody(createUserSchema), async (req, res) => {
  try {
    const { username, password, user_type } = req.body;

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        username,
        password_hash: hashedPassword,
        user_type: user_type || UserType.USER
      },
      select: {
        id: true,
        username: true,
        user_type: true,
        created_at: true,
        updated_at: true
      }
    });

    res.status(201).json({
      message: 'User created successfully',
      user: newUser
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /users/:id - Update user (authenticated user can update themselves, admin can update anyone)
router.patch('/:id', authenticateToken, validateUserUpdate, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check permissions: users can only update themselves, admins can update anyone
    if (req.user!.id !== userId && req.user!.user_type !== UserType.ADMIN) {
      return res.status(403).json({ error: 'You can only update your own profile' });
    }

    const { current_password, new_password, user_type } = req.body;
    const isUpdatingSelf = req.user!.id === userId;
    const isAdmin = req.user!.user_type === UserType.ADMIN;

    // Prevent admin from changing their own user_type if they are the last admin
    if (userId === req.user!.id && user_type !== undefined && req.user!.user_type === UserType.ADMIN) {
      const totalAdmins = await prisma.user.count({
        where: { user_type: UserType.ADMIN }
      });
      if (totalAdmins <= 1) {
        return res.status(400).json({ error: 'Cannot change user type: you are the last admin' });
      }
    }

    const updateData: any = {};

    // Handle password updates (only for self-updates)
    if (isUpdatingSelf && current_password && new_password) {
      // User updating their own password - requires current_password verification
      const isPasswordValid = await bcrypt.compare(current_password, existingUser.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid current password' });
      }
      updateData.password_hash = await bcrypt.hash(new_password, 10);
    }

    // Handle user_type updates (only admins can do this)
    if (user_type !== undefined && isAdmin) {
      updateData.user_type = user_type;
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        user_type: true,
        created_at: true,
        updated_at: true
      }
    });

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /users/:id - Delete user (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent admin from deleting themselves if they are the last user
    if (userId === req.user!.id) {
      const totalUsers = await prisma.user.count();
      if (totalUsers <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last user' });
      }
    }

    // Delete user
    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
