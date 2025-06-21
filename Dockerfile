# ================================================================
# Build Stage
# ================================================================
FROM node:18-alpine as builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache libc6-compat

# Copy package files first for better layer caching
COPY package*.json ./
COPY server/package*.json ./server/

# Copy package files first for better layer caching
COPY package*.json ./

# Install root dependencies (skip postinstall script)
RUN if [ -f package-lock.json ]; then \
      npm ci --ignore-scripts; \
    else \
      npm install --ignore-scripts; \
    fi

# Copy the rest of the application
COPY . .

# Install server dependencies (skip postinstall script)
RUN if [ -d server ] && [ -f server/package.json ]; then \
      cd server && \
      if [ -f package-lock.json ]; then \
        npm ci --ignore-scripts; \
      else \
        npm install --ignore-scripts; \
      fi; \
      cd ..; \
    else \
      echo "Server directory not found or no package.json in server directory"; \
    fi

# Build the React app with production optimizations
RUN npm run build

# ================================================================
# Production Stage
# ================================================================
FROM node:18-alpine

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S -u 1001 -G nodejs nodejs

# Copy necessary files from builder
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/server/package*.json ./server/
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/server/node_modules ./server/node_modules
COPY --from=builder --chown=nodejs:nodejs /app/build ./build
COPY --from=builder --chown=nodejs:nodejs /app/server ./server
COPY --from=builder --chown=nodejs:nodejs /app/public ./public

# Set environment variables
ENV NODE_ENV=production
ENV PORT=10000
ENV NPM_CONFIG_PRODUCTION=false

# Use non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:10000/api/health || exit 1

# Expose the app port
EXPOSE 10000

# Use dumb-init as entrypoint to handle signals properly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Start the application
CMD ["node", "server/index.js"]
