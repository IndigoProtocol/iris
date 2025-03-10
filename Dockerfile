# Build stage
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . ./

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --production

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Set environment variables
ENV NODE_NO_WARNINGS=1
ENV NODE_ENV=production

# Create logs directory and set permissions
RUN mkdir -p /app/logs/indexer && \
    chown -R node:node /app

# Use node user
USER node

# Expose port 3000
EXPOSE 3000

# Command to run the application
CMD ["node", "--experimental-specifier-resolution=node", "--loader", "ts-node/esm", "./dist/indexer.js"]
