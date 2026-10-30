# Production Dockerfile for AccessAI on Render
# Includes Node.js 22, Chromium browser, and system dependencies for Playwright & axe-core

FROM node:22-bookworm-slim

# Install Chromium and headless browser rendering dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    fonts-dejavu-core \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Point AccessAI browser launcher to installed Chromium binary
ENV CHROMIUM_PATH=/usr/bin/chromium
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy project source code
COPY . .

# Build production frontend client into dist/
RUN npm run build

# Create data directory with write permissions for persistent disk mounting
RUN mkdir -p /app/data && chmod 777 /app/data

# Expose Render application port
EXPOSE 3000

# Start AccessAI production server
CMD ["npm", "start"]
