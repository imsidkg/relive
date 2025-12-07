# Deployment Guide

This guide will help you deploy the Loveab   Add:

   ```
   INNGEST_SIGNING_KEY="your_inngest_signing_key_here"
   E2B_TEMPLATE_NAME="nextjs-imsidkg"
   ```plication:
- Backend on Digital Ocean Droplet
- Frontend on Vercel

## Prerequisites

- Digital Ocean account
- Vercel account
- GitHub repository (public or with SSH access)
- PostgreSQL database (can be on Digital Ocean or external)
- Clerk account for authentication
- Inngest account for background jobs

## Backend Deployment Options

### Option 1: Docker Compose (Recommended)

This option uses Docker Compose to containerize the backend and PostgreSQL database.

#### Prerequisites for Docker Deployment

- Docker and Docker Compose installed on your Digital Ocean Droplet

#### Docker Deployment Steps

1. **Install Docker on Droplet**

   ```bash
   # Update system
   sudo apt update

   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh

   # Add user to docker group
   sudo usermod -aG docker $USER

   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose

   # Logout and login again for group changes to take effect
   ```

2. **Clone Repository and Navigate to Backend**

   ```bash
   git clone https://github.com/imsidkg/loveable.git
   cd loveable/backend
   ```

3. **Configure Environment Variables**

   Create a `.env` file:

   ```bash
   nano .env
   ```

   Add:

   ```
   INNGEST_SIGNING_KEY="your_inngest_signing_key"
   ```

   Note: DATABASE_URL is set in docker-compose.yml

4. **Run Database Migrations**

   ```bash
   # Start only postgres first
   docker-compose up -d postgres

   # Wait for postgres to be ready
   sleep 10

   # Run migrations
   docker-compose run --rm backend bunx prisma migrate deploy

   # Start all services
   docker-compose up -d
   ```

5. **Verify Deployment**

   ```bash
   docker-compose ps
   docker-compose logs backend
   ```

The backend will be running on port 4000.

### Option 2: Manual Installation

## Backend Deployment (Digital Ocean Droplet)

### 1. Create Digital Ocean Droplet

1. Go to [Digital Ocean](https://cloud.digitalocean.com/)
2. Click "Create" > "Droplets"
3. Choose Ubuntu 22.04 LTS
4. Select a plan (at least 1GB RAM for basic apps)
5. Choose a datacenter region
6. Add SSH keys for secure access
7. Create the droplet

### 2. Connect to Droplet

```bash
ssh root@YOUR_DROPLET_IP
```

Update the system:
```bash
sudo apt update && sudo apt upgrade -y
```

### 3. Install Node.js and Bun

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Bun (optional for manual deployment)
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
```

Verify installations:
```bash
node --version
bun --version
```

**Note:** For Docker deployment, Bun is automatically included in the container image.

### 4. Clone Repository

```bash
git clone https://github.com/imsidkg/loveable.git
cd loveable/backend
```

### 5. Install Dependencies

```bash
bun install
```

### 6. Configure Environment Variables

Create a `.env` file:

```bash
nano .env
```

Add the following variables:

```
DATABASE_URL="postgresql://username:password@host:5432/database"
INNGEST_SIGNING_KEY="your_inngest_signing_key"
```

- `DATABASE_URL`: Connection string for PostgreSQL database
- `INNGEST_SIGNING_KEY`: From your Inngest dashboard

### 7. Run Database Migrations

```bash
bunx prisma migrate deploy
```

### 8. Install PM2

```bash
sudo npm install -g pm2
```

### 9. Start the Application

```bash
pm2 start "bun run start" --name "loveable-backend"
pm2 startup
pm2 save
```

The backend will be running on port 4000.

## Frontend Deployment (Vercel)

### 1. Connect Repository to Vercel

1. Go to [Vercel](https://vercel.com/)
2. Click "New Project"
3. Import your GitHub repository
4. Configure project settings:
   - Framework Preset: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

### 2. Set Environment Variables

In Vercel dashboard, go to your project settings > Environment Variables:

- `VITE_CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key
- `VITE_BACKEND_URL`: `http://YOUR_DROPLET_IP:4000/trpc`

### 3. Deploy

Click "Deploy" in Vercel. The frontend will be deployed automatically.

## Post-Deployment

1. Update your domain/DNS if needed
2. Configure firewall on Digital Ocean (allow ports 22, 80, 443, 4000)
3. Set up SSL certificate (Let's Encrypt)
4. Monitor logs with PM2: `pm2 logs loveable-backend`

## Troubleshooting

- Ensure all environment variables are set correctly
- Check database connectivity
- Verify Inngest webhooks are configured
- Test tRPC endpoints after deployment
