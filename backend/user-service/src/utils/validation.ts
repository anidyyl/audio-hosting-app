import Joi from 'joi';
import { UserType } from '@prisma/client';

// Login validation schema
export const loginSchema = Joi.object({
  username: Joi.string()
    .min(3)
    .max(50)
    .required()
    .messages({
      'string.empty': 'Username is required',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username cannot exceed 50 characters',
      'any.required': 'Username is required'
    }),

  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'Password is required'
    })
});

// Create user validation schema
export const createUserSchema = Joi.object({
  username: Joi.string()
    .min(3)
    .max(50)
    .required()
    .messages({
      'string.empty': 'Username is required',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username cannot exceed 50 characters',
      'any.required': 'Username is required'
    }),

  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'Password is required'
    }),

  user_type: Joi.string()
    .valid(UserType.USER, UserType.ADMIN)
    .default(UserType.USER)
    .messages({
      'any.only': 'User type must be either USER or ADMIN'
    })
});

// Update user password validation schema (for users updating their own password)
export const updateUserPasswordSchema = Joi.object({
  current_password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Current password is required',
      'any.required': 'Current password is required'
    }),
  new_password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.empty': 'New password is required',
      'string.min': 'New password must be at least 6 characters long',
      'any.required': 'New password is required'
    })
});

// Update user validation schema (for admins updating other users - user_type only)
export const updateUserByAdminSchema = Joi.object({
  user_type: Joi.string()
    .valid(UserType.USER, UserType.ADMIN)
    .required()
    .messages({
      'any.only': 'User type must be either USER or ADMIN',
      'any.required': 'User type is required'
    })
});

// Middleware to validate request body
export const validateBody = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
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
};
