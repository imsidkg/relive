# Use Node.js 18 Alpine with Bun for smaller image
FROM node:18-alpine

# Install Bun
RUN apk add --no-cache curl && \
    curl -fsSL https://bun.sh/install | bash && \
    mv /root/.bun/bin/bun /usr/local/bin/bun

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client
RUN bunx prisma generate

# Expose port
EXPOSE 4000

# Start the application
CMD ["bun", "run", "start"]
