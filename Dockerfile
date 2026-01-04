# Development Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies for node-gyp, git, and openssl
RUN apk add --no-cache libc6-compat git openssl

# Enable corepack for yarn
RUN corepack enable && corepack prepare yarn@stable --activate

# Copy package files
COPY package.json yarn.lock* .yarnrc.yml* ./
COPY .yarn ./.yarn

# Install dependencies
RUN yarn install

# Copy source code
COPY . .

# Generate Prisma client
RUN yarn db:generate || true

# Expose port
EXPOSE 3000

# Development command
CMD ["yarn", "dev"]
