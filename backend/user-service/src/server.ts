import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'user-service' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'User Service API',
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /auth/login': 'User login - returns JWT'
      },
      users: {
        'GET /users': 'Get all users (admin only)',
        'POST /users': 'Create new user (admin only)',
        'PATCH /users/:id': 'Update user password (users) or password/user_type (admins)',
        'DELETE /users/:id': 'Delete user (admin only)'
      }
    }
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`User service listening on port ${PORT}`);
});
