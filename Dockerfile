FROM node:slim AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install bun
RUN apk add --no-cache curl unzip
RUN curl -fsSL https://bun.sh/install | bash

# Copy package.json and install dependencies
COPY package.json ./
RUN /root/.bun/bin/bun install

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Create app directory
RUN mkdir -p /app/data

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
RUN chown -R nextjs:nodejs /app/data

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/schema.sql ./schema.sql
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Set the correct permission for prerender cache
RUN mkdir -p .next/cache
RUN chown -R nextjs:nodejs /app/.next

# Switch to non-root user
USER nextjs

# Expose the listening port
EXPOSE 3000

# Set environment variables
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"
ENV DB_PATH "/app/data/analytics.db"

# Start the application
CMD ["node", "server.js"]
