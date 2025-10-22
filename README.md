# Audio Hosting App

A full-stack audio hosting application built with Next.js, Express.js microservices, PostgreSQL

## Architecture

- **Frontend**: Next.js with TypeScript and Tailwind CSS
- **Backend**: Express.js microservices architecture
  - User Service: Handles user authentication and management
  - Audio Service: Handles audio file uploads, storage, and metadata
- **Database**: PostgreSQL with Prisma ORM for type-safe database operations
- **Reverse Proxy**: Caddy for routing and SSL termination

### System Architecture Diagram

```
                            ┌─────────────────┐
                            │  Client/Browser │
                            │  (localhost)    │
                            └─────────────────┘
                                    │
                                    ▼
                            ┌─────────────────┐
                            │     Caddy       │
                            │  Reverse Proxy  │
                            │   Port: 80      │
                            └─────────────────┘
                                    │
                                    ▼
            ┌──────────────────────────────────────────────────────┐
            │               │                   │                  │
            ▼               ▼                   ▼                  ▼ 

┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Frontend       │ │  User Service   │ │  Audio Service  │ │  Static Files   │
│  Port: 3000     │ │   Port: 8001    │ │   Port: 8002    │ │ (/uploads/audio)│
│                 │ │                 │ │                 │ │                 │
│ • Dashboard     │ │ • Auth/Login    │ │ • File Upload   │ │ • Audio Files   │
│                 │ │ • User Mgmt     │ │ • Audio Mgmt    │ │                 │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
                                │          │     
                                │          │                  
                                │          │         
                                ▼          ▼         
                            ┌─────────────────┐         
                            │   PostgreSQL    │         
                            │   Port: 5432    │         
                            │                 │         
                            │ • User data     │         
                            │ • Audio metadata│         
                            └─────────────────┘         
         
```

### Data Flow

1. **User Authentication**: Frontend → Caddy → User Service → PostgreSQL
2. **Audio Upload**: Frontend → Caddy → Audio Service → Static Files + PostgreSQL
3. **Audio Streaming**: Frontend → Caddy → Static Files → File System
4. **File Management**: Audio Service ↔ Static Files (upload/delete operations)
5. **Database Management**: Adminer → PostgreSQL (development only)

## Features

- User registration and authentication with JWT
- Audio file upload, storage, and management
- User dashboard for managing uploaded files
- Responsive UI with Tailwind CSS
- RESTful API design

## Project Structure

```
audio-hosting-app/
├── frontend/                 # Next.js frontend application
│   └── Dockerfile*          # Frontend-specific Dockerfiles
├── backend/
│   ├── user-service/         # User management microservice
│   │   ├── Dockerfile*      # User service-specific Dockerfiles
│   │   └── prisma/          # Prisma schema and migrations
│   └── audio-service/        # Audio file handling microservice
│       ├── Dockerfile*      # Audio service-specific Dockerfiles
│       └── prisma/          # Prisma schema and migrations
├── caddy/                    # Caddy reverse proxy configuration
└── docker-compose*.yml       # Docker Compose files
```

## Prerequisites

- Docker and Docker Compose


## Environment Variables

### Docker Compose Setup

For Docker Compose deployments, environment variables are configured in the `docker-compose.yml` and `docker-compose.prod.yml` files. The following environment variables are required:

- `POSTGRES_DB` - PostgreSQL database name
- `POSTGRES_USER` - PostgreSQL username
- `POSTGRES_PASSWORD` - PostgreSQL password
- `JWT_SECRET` - JWT secret key for authentication

You need to create `.env` file by copying the `.env.example` file

## Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd audio-hosting-app
   ```

2. **Start all services**
   ```bash
   docker compose up -d
   ```

3. **Access the application**
   - Frontend: http://localhost
   - User Service API: http://localhost/api/users
   - Audio Service API: http://localhost/api/audio
   - Adminer (Database management): http://localhost:8080

4. **Default Login Credentials**
   - **Username**: `admin`
   - **Password**: `password`
   - **Note**: These credentials are automatically created during the initial database seeding


### Run Production build
```bash
docker compose -f docker-compose.prod.yml up --build -d
```

## API Endpoints

### User Service
- `GET /health/users` - Health check
- `POST /api/auth/login` - User login
- `GET /api/users/` - Get list of users (admin)
- `POST /api/users/` - Create new user (admin)
- `PATCH /api/users/:id` - Update password (user) and Update user type (admin)
- `DELETE /api/users/:id` - delete user (admin)


### Audio Service
- `GET /health/audio` - Health check
- `GET /api/audio/` - Get list of audio files
- `POST /api/audio/` - Upload audio files
- `PATCH /api/audio/:id` - Update audio file metadata
- `DELETE /api/audio/:id` - Delete audio file



### Logs
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f user-service
docker-compose logs -f audio-service
docker-compose logs -f frontend
```


## License

This project is licensed under the MIT License.
