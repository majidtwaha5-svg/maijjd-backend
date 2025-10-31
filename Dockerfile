# Multi-stage build for production optimization
FROM node:18-alpine AS builder

# Set the working directory in the container
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the application if needed
RUN npm run build || echo "No build script found, skipping build step"

# Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Set the working directory in the container
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application files from builder stage (only what runtime needs)
COPY --from=builder /app/server.js ./
COPY --from=builder /app/routes ./routes
COPY --from=builder /app/middleware ./middleware
COPY --from=builder /app/models ./models
COPY --from=builder /app/config ./config
COPY --from=builder /app/services ./services
COPY --from=builder /app/maijjd-ai-agent.js ./
COPY --from=builder /app/maijjd-api-integration.js ./
COPY --from=builder /app/monitoring-setup.js ./
COPY --from=builder /app/swagger.json ./swagger.json
COPY --from=builder /app/README.md ./

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Create necessary directories and set permissions
RUN mkdir -p logs uploads && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose the port the app runs on
# Optional: document an arbitrary port. Railway injects $PORT at runtime; app must listen on process.env.PORT
# EXPOSE is not required for Railway
# EXPOSE 5000

# Do not hardcode an internal healthcheck port; Railway performs health checks externally

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["npm", "start"]
