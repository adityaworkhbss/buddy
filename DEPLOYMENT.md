# Vercel Deployment Guide

This guide will help you deploy your Next.js application to Vercel with PostgreSQL database.

## Prerequisites

1. A GitHub account (recommended) or GitLab/Bitbucket
2. A Vercel account (sign up at https://vercel.com)
3. All your service API keys ready (Twilio, Cloudinary, Firebase, etc.)

## Step 1: Prepare Your Repository

1. **Commit all changes** to your local repository:
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   ```

2. **Push to GitHub** (if not already done):
   ```bash
   git push origin main
   ```

## Step 2: Set Up Database

### Option A: Vercel Postgres (Recommended)

1. Go to your Vercel dashboard
2. Create a new project or select existing one
3. Go to **Storage** tab
4. Click **Create Database** → Select **Postgres**
5. Choose a plan (Hobby plan is free for development)
6. Copy the connection string (it will be automatically added as `POSTGRES_URL`)

### Option B: External PostgreSQL Database

You can use any PostgreSQL provider:
- **Supabase** (Free tier available)
- **Neon** (Free tier available)
- **Railway** (Free tier available)
- **AWS RDS**
- **DigitalOcean**

Get the connection string in format:
```
postgresql://user:password@host:port/database?sslmode=require
```

## Step 3: Deploy to Vercel

### Method 1: Via Vercel Dashboard (Recommended)

1. Go to [vercel.com/new](https://vercel.com/new)
2. **Import Git Repository**:
   - Connect your GitHub/GitLab/Bitbucket account if not already connected
   - Select your `buddy` repository
   - Click **Import**

3. **Configure Project**:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `prisma generate && next build` (already configured)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

4. **Environment Variables**: Add all required variables (see Step 4)

5. Click **Deploy**

### Method 2: Via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```
   - Follow the prompts
   - Link to existing project or create new one
   - Add environment variables when prompted

4. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

## Step 4: Configure Environment Variables

In your Vercel project dashboard, go to **Settings** → **Environment Variables** and add:

### Required Database Variables

```env
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
```

If using Vercel Postgres, use:
```env
POSTGRES_URL=your_vercel_postgres_url
POSTGRES_PRISMA_URL=your_vercel_postgres_prisma_url
POSTGRES_URL_NON_POOLING=your_vercel_postgres_non_pooling_url
```

Then in your Prisma schema, you can use:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("POSTGRES_PRISMA_URL")
  directUrl = env("POSTGRES_URL_NON_POOLING")
}
```

### Required Application Variables

```env
# Next.js
NODE_ENV=production
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app

# Socket.IO (if deploying separately)
SOCKET_PORT=3001
FRONTEND_URL=https://your-app.vercel.app
NEXT_PUBLIC_SOCKET_URL=https://your-socket-server.com
SOCKET_URL=https://your-socket-server.com
```

### Twilio (WhatsApp OTP)

```env
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

### Cloudinary (Media Storage)

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Firebase (if using)

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_client_email
```

### Mapbox (if using maps)

```env
NEXT_PUBLIC_MAPBOX_PUBLIC_KEY=your_mapbox_token
```

**Important**: 
- Add variables for **Production**, **Preview**, and **Development** environments
- For `FIREBASE_PRIVATE_KEY`, make sure to include the newlines (`\n`) in the value

## Step 5: Run Database Migrations

After deployment, you need to run Prisma migrations to create tables:

### Option 1: Using Vercel CLI

```bash
# Set your DATABASE_URL
export DATABASE_URL="your_database_url"

# Run migrations
npx prisma migrate deploy
```

### Option 2: Using Vercel Postgres

1. Go to your Vercel project → **Storage** → Your Postgres database
2. Click **.env.local** tab
3. Copy the connection string
4. Run locally:
   ```bash
   DATABASE_URL="your_connection_string" npx prisma migrate deploy
   ```

### Option 3: Using Prisma Studio (for manual setup)

```bash
DATABASE_URL="your_connection_string" npx prisma studio
```

Then manually run the SQL from `prisma/migrations/` folder.

## Step 6: Deploy Socket.IO Server (Separate Service)

The Socket.IO server (`server/socket-server.js`) needs to run separately. Options:

### Option A: Deploy to Railway

1. Go to [railway.app](https://railway.app)
2. Create new project → Deploy from GitHub
3. Select your repository
4. Add environment variables:
   - `DATABASE_URL`
   - `FRONTEND_URL` (your Vercel app URL)
   - `SOCKET_PORT=3001`
5. Set start command: `node server/socket-server.js`
6. Get the deployed URL and update `NEXT_PUBLIC_SOCKET_URL` in Vercel

### Option B: Deploy to Render

1. Go to [render.com](https://render.com)
2. Create new **Web Service**
3. Connect GitHub repository
4. Settings:
   - **Build Command**: `npm install`
   - **Start Command**: `node server/socket-server.js`
   - **Environment**: Node
5. Add environment variables
6. Deploy and get URL

### Option C: Use a VPS (DigitalOcean, AWS EC2, etc.)

1. Set up a VPS
2. Install Node.js
3. Clone repository
4. Install dependencies: `npm install`
5. Use PM2 to run:
   ```bash
   npm install -g pm2
   pm2 start server/socket-server.js --name socket-server
   pm2 save
   pm2 startup
   ```

## Step 7: Verify Deployment

1. **Check Build Logs**: Go to Vercel dashboard → **Deployments** → Click on latest deployment → View logs

2. **Test Your Application**:
   - Visit your deployed URL
   - Test user registration
   - Test OTP sending
   - Test file uploads
   - Test Socket.IO connection (if deployed)

3. **Check Database Connection**:
   ```bash
   DATABASE_URL="your_url" npx prisma studio
   ```

## Troubleshooting

### Build Fails with Prisma Error

- Make sure `postinstall` script is in `package.json` (already added)
- Check that `DATABASE_URL` is set correctly
- Try running `npx prisma generate` locally first

### Database Connection Issues

- Verify `DATABASE_URL` format is correct
- Check if database allows connections from Vercel IPs
- For Vercel Postgres, use `POSTGRES_PRISMA_URL` instead of `DATABASE_URL`

### Environment Variables Not Working

- Make sure variables are set for the correct environment (Production/Preview/Development)
- Restart deployment after adding new variables
- Check variable names match exactly (case-sensitive)

### Socket.IO Not Connecting

- Verify `NEXT_PUBLIC_SOCKET_URL` is set correctly
- Check CORS settings in `server/socket-server.js`
- Ensure Socket.IO server is running and accessible

## Post-Deployment Checklist

- [ ] Database migrations run successfully
- [ ] All environment variables configured
- [ ] Application builds without errors
- [ ] User registration works
- [ ] OTP sending works
- [ ] File uploads work
- [ ] Socket.IO server deployed and connected
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active (automatic with Vercel)

## Next Steps

1. **Set up Custom Domain** (optional):
   - Go to Vercel project → **Settings** → **Domains**
   - Add your domain
   - Update DNS records as instructed

2. **Monitor Performance**:
   - Use Vercel Analytics
   - Check function logs
   - Monitor database performance

3. **Set up CI/CD**:
   - Vercel automatically deploys on git push
   - Configure branch protection if needed

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

