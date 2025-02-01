FROM node:20.5.1-alpine3.18

# Install system dependencies (GPG + PM2)
RUN apk add --no-cache gnupg && \
    npm install -g pm2

# Create and set working directory
WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install application dependencies
RUN npm install

# Copy application source
COPY . .

# Expose the application port
EXPOSE 5001

# Start in cluster mode using PM2 (auto-restart, load balancing)
CMD ["pm2-runtime", "start", "js_backend.js", "-i", "max"]