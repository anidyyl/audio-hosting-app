# Dockerfile for Audio Service
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Install dependencies first (for better caching)
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source code
COPY . .

# Create uploads directory for audio files
RUN mkdir -p uploads

# Expose port
EXPOSE 3002

# Default command
CMD ["npm", "start"]
