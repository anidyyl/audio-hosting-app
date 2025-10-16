# Audio Hosting App

A full-stack audio hosting application built with Next.js, Express.js microservices, PostgreSQL, and Redis.

## Architecture

- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Backend**: Express.js microservices architecture
  - User Service (Port 3001): Handles user authentication and management
  - Audio Service (Port 3002): Handles audio file uploads, storage, and metadata
- **Database**: PostgreSQL with Prisma ORM for type-safe database operations
- **Cache**: Redis for caching and session management
- **Reverse Proxy**: Caddy for routing and SSL termination

## Features

- User registration and authentication with JWT
- Audio file upload, storage, and management
- User dashboard for managing uploaded files
- File sharing with temporary links
- Responsive UI with Tailwind CSS
- RESTful API design
- Rate limiting and security middleware

## Project Structure

```
audio-hosting-app/
├── frontend/                 # Next.js frontend application
│   └── Dockerfile           # Frontend-specific Dockerfile
├── backend/
│   ├── user-service/         # User management microservice
│   │   ├── Dockerfile       # User service-specific Dockerfile
│   │   └── prisma/          # Prisma schema and migrations
│   └── audio-service/        # Audio file handling microservice
│       ├── Dockerfile       # Audio service-specific Dockerfile
│       └── prisma/          # Prisma schema and migrations
├── caddy/                    # Caddy reverse proxy configuration
├── shared/                   # Shared utilities and types
└── docker-compose.yml        # Docker Compose for development
```

## Prerequisites

- Docker and Docker Compose
- Node.js 22+ (for local development)
- PostgreSQL 15+ (for local development)
- Redis 8+ (for local development)

## Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd audio-hosting-app
   ```

2. **Start all services**
   ```bash
   docker-compose up -d
   ```

3. **Initialize the database**
   ```bash
   # The database will be automatically initialized with the schema files
   # If you need to run migrations manually:
   docker-compose exec postgres psql -U postgres -d audio_hosting_app -f /docker-entrypoint-initdb.d/schemas/init.sql
   ```

4. **Access the application**
   - Frontend: http://localhost
   - User Service API: http://localhost/api/users
   - Audio Service API: http://localhost/api/audio
   - Direct service access:
     - User Service: http://localhost:3001
     - Audio Service: http://localhost:3002

## Local Development Setup

### Backend Services Setup

1. **User Service**
   ```bash
   cd backend/user-service
   cp env.example .env
   # Edit .env with your configuration
   npm install
   npm run dev
   ```

2. **Audio Service**
   ```bash
   cd backend/audio-service
   cp env.example .env
   # Edit .env with your configuration
   npm install
   npm run dev
   ```

### Frontend Setup

1. **Next.js Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

2. **Start Caddy (optional for local development)**
   ```bash
   cd caddy
   caddy run
   ```

## Environment Variables

### User Service (.env)
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/audio_hosting_app?schema=public"
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
PORT=3001
NODE_ENV=development
```

### Audio Service (.env)
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/audio_hosting_app?schema=public"
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
PORT=3002
NODE_ENV=development
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=100000000
ALLOWED_AUDIO_TYPES=audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/flac
```

## API Endpoints

### User Service (Port 3001)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `GET /health` - Health check

### Audio Service (Port 3002)
- `POST /api/audio/upload` - Upload audio file
- `GET /api/audio/files` - Get user's audio files
- `GET /api/audio/files/:id` - Get audio file details
- `DELETE /api/audio/files/:id` - Delete audio file
- `GET /api/audio/files/:id/download` - Download audio file
- `POST /api/audio/files/:id/share` - Create share link
- `GET /health` - Health check

## Database Schema

### Users Table
- `id` - Primary key
- `username` - Unique username
- `email` - Unique email address
- `password_hash` - Bcrypt hashed password
- `first_name`, `last_name` - User details
- `created_at`, `updated_at` - Timestamps
- `is_active` - Account status

### Audio Files Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `filename` - Unique filename
- `original_filename` - Original uploaded filename
- `file_path` - Server path to file
- `file_size` - File size in bytes
- `mime_type` - Audio MIME type
- `duration_seconds` - Audio duration
- `title`, `artist`, `album` - Metadata
- `is_public` - Public access flag
- `created_at`, `updated_at` - Timestamps

## Database Setup with Prisma

The application uses Prisma ORM for complete database management including schema definition, migrations, and type generation.

### Initial Database Setup

1. **Start the database**
   ```bash
   docker-compose up postgres redis -d
   ```

2. **Push Prisma schema to database** (for development)
   ```bash
   cd backend/user-service && npm run prisma:push
   cd backend/audio-service && npm run prisma:push
   ```

3. **Generate Prisma Client** (automatically done in Docker build)
   ```bash
   cd backend/user-service && npm run prisma:generate
   cd backend/audio-service && npm run prisma:generate
   ```

### Development Workflow

- **Create migrations** when schema changes:
  ```bash
  cd backend/user-service && npm run prisma:migrate
  cd backend/audio-service && npm run prisma:migrate
  ```

- **View database with Prisma Studio**:
  ```bash
  cd backend/user-service && npm run prisma:studio
  # Opens browser at http://localhost:5555
  ```

- **Reset database** (development only):
  ```bash
  cd backend/user-service && npx prisma migrate reset
  cd backend/audio-service && npx prisma migrate reset
  ```

### Running Tests
```bash
# User Service
cd backend/user-service
npm test

# Audio Service
cd backend/audio-service
npm test

# Frontend
cd frontend
npm test
```

### Building for Production
```bash
# Build all services (includes Prisma client generation)
docker-compose build

# Or build individually
cd backend/user-service && npm run build
cd backend/audio-service && npm run build
cd frontend && npm run build
```

### Logs
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f user-service
docker-compose logs -f audio-service
docker-compose logs -f frontend
```

## Production Deployment

1. **Update environment variables** with production values
2. **Enable SSL** in Caddy configuration
3. **Configure proper database credentials**
4. **Set up file storage** (currently using local filesystem)
5. **Configure backup strategies** for database and files
6. **Set up monitoring and logging**

## Security Considerations

- JWT tokens are used for authentication
- Passwords are hashed with bcrypt
- Rate limiting is implemented
- CORS is configured
- Security headers are set via Caddy
- File uploads are validated by type and size

## Future Enhancements

- [ ] Email verification for user registration
- [ ] Password reset functionality
- [ ] Audio file transcoding
- [ ] File storage on cloud (S3, etc.)
- [ ] Advanced search and filtering
- [ ] Audio streaming
- [ ] User roles and permissions
- [ ] Admin dashboard
- [ ] API documentation with Swagger
- [ ] Unit and integration tests
- [ ] CI/CD pipeline

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
