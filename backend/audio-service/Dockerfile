# Dockerfile for Audio Service
FROM node:22-alpine

# Install dependencies
RUN apk add --no-cache libc6-compat curl openssl

# Set working directory
WORKDIR /app

# Install dependencies first (for better caching)
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm install

# Copy source code
COPY . .

# Create uploads directory for audio files
RUN mkdir -p uploads

# Expose port
EXPOSE 8002

# Set environment
ENV NODE_ENV=development

# Default command
CMD ["npm", "run", "dev"]
