# Use official Bun image
FROM oven/bun:1-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN bun install

# Copy source code
COPY . .

# Generate Prisma client
RUN bunx prisma generate

# Expose port
EXPOSE 4000

# Start the application with Bun (Bun can run TypeScript natively)
CMD ["bun", "run", "src/index.ts"]
