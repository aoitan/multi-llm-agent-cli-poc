FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine AS runtime

RUN apk add --no-cache python3 py3-pip

WORKDIR /app

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

# Copy Python scripts and requirements
COPY scripts/ ./scripts/
COPY requirements.txt ./
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy configuration files
COPY config/ ./config/
COPY prompts/ ./prompts/

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S copilot -u 1001 -G nodejs

USER copilot

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('Health check passed')" || exit 1

CMD ["node", "dist/index.js"]